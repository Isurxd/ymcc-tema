import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { sendOrderCreatedEmail } from "@/lib/email";

export async function POST(req) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { items, userDetails, shippingDetails, deliveryMethod, shippingCost, promo } = await req.json();
    const SERVER_PLATFORM_FEE = 2000;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let totalAmount = 0;
    let totalItems = 0;
    const orderItems = [];

    const isDigital = deliveryMethod === "digital";
    const targetCollection = isDigital ? 'Orders' : 'merch_orders';
    const sourceCollection = isDigital ? 'activities' : 'merchandise';
    const orderId = db.collection(targetCollection).doc().id;

    // Begin Firestore transaction for Atomic Soft-Lock
    await db.runTransaction(async (transaction) => {
      // 1. Fetch all docs first to avoid read-after-write errors
      const itemRefs = items.map(item => db.collection(sourceCollection).doc(item.id));
      const itemDocs = await transaction.getAll(...itemRefs);

      itemDocs.forEach((docSnap, idx) => {
        const item = items[idx];
        if (!docSnap.exists) throw new Error(`${isDigital ? 'Activity' : 'Product'} ${item.name} not found`);
        
        let dbPrice = Number(docSnap.data().priceNumber) || Number(docSnap.data().price) || Number(item.price) || 150000;

        if (!isDigital) {
          const itemSize = item.size;
          const stockPerSize = docSnap.data().stockPerSize || {};
          // If the item has sizes but no stockPerSize, or if it uses stockPerSize, use it
          const hasPerSizeStock = Object.keys(stockPerSize).length > 0;
          
          let stock = docSnap.data().stockAmount || 0;
          if (hasPerSizeStock && itemSize) {
            stock = stockPerSize[itemSize] || 0;
          }

          // Disable stock check for PO (Pre-Order) items if needed
          if (docSnap.data().stockType !== "PO" && stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name} (Size: ${itemSize || 'N/A'})`);
          }

          // Direct Row-level Locking: Decrement stock immediately
          const updatePayload = {};
          if (hasPerSizeStock && itemSize) {
            updatePayload[`stockPerSize.${itemSize}`] = FieldValue.increment(-Number(item.quantity || 1));
          }
          updatePayload.stockAmount = FieldValue.increment(-Number(item.quantity || 1));
          transaction.update(docSnap.ref, updatePayload);
        }

        const qty = Number(item.quantity) || 1;
        totalAmount += dbPrice * qty;
        totalItems += qty;
        orderItems.push({
          productId: item.id,
          name: docSnap.data().title || docSnap.data().name || item.name,
          image: docSnap.data().icon || docSnap.data().image || null,
          size: item.size || null,
          quantity: qty,
          price: dbPrice
        });
      });

      // 2. Handle Promo and Affiliate Commission Securely
      let discountAmount = 0;
      let totalCommission = 0;
      let validPromoCode = null;
      let affiliateEmail = null;

      if (promo && promo.code) {
         // Query the database for the promo to calculate discount securely on the server
         const promoQuery = await transaction.get(db.collection('promos').where('code', '==', promo.code).limit(1));
         
         if (!promoQuery.empty) {
            const promoDocSnap = promoQuery.docs[0];
            const promoData = promoDocSnap.data();
            validPromoCode = promoData.code;
            
            if (promoData.discountType === "PERCENT") {
               discountAmount = totalAmount * (Number(promoData.discount || 0) / 100);
            } else {
               discountAmount = Number(promoData.discount || 0);
            }
            if (discountAmount > totalAmount) discountAmount = totalAmount; // Max discount is subtotal

            if (promoData.affiliateEmail) {
               affiliateEmail = promoData.affiliateEmail;
               totalCommission = Number(promoData.commission || 0) * totalItems;
               transaction.update(promoDocSnap.ref, { frozenBalance: FieldValue.increment(totalCommission) });
            }
         } else {
            throw new Error("Invalid Promo Code");
         }
      }

      // Prevent negative shipping costs
      const secureShippingCost = Math.max(0, Number(shippingCost) || 0);

      // 3. Final Calculation
      totalAmount = totalAmount - discountAmount + secureShippingCost + SERVER_PLATFORM_FEE;

      // Create Order Document
      const orderRef = db.collection(targetCollection).doc(orderId);
      transaction.set(orderRef, {
        id: orderId,
        userDetails,
        deliveryMethod: deliveryMethod || "shipping",
        shippingDetails: deliveryMethod === "shipping" ? shippingDetails : null,
        shippingCost: secureShippingCost,
        platformFee: SERVER_PLATFORM_FEE,
        promoCode: validPromoCode,
        discountAmount: discountAmount,
        affiliateEmail: affiliateEmail,
        commissionFrozen: totalCommission,
        items: orderItems,
        totalAmount,
        status: "PENDING_PAYMENT",
        paymentStatus: "UNPAID",
        orderStatus: "PENDING",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Hours Expiry
      });
    });

    // Map item details for Midtrans Snap breakdown
    const itemDetails = orderItems.map(item => ({
      id: item.productId,
      price: item.price,
      quantity: item.quantity,
      name: item.name.length > 50 ? item.name.substring(0, 47) + "..." : item.name,
    }));

    const secureShippingCost = Math.max(0, Number(shippingCost) || 0);
    if (deliveryMethod === "shipping" && secureShippingCost > 0) {
      itemDetails.push({
        id: "shipping-fee",
        price: secureShippingCost,
        quantity: 1,
        name: "Shipping Fee"
      });
    }

    if (SERVER_PLATFORM_FEE > 0) {
      itemDetails.push({
        id: "platform-fee",
        price: SERVER_PLATFORM_FEE,
        quantity: 1,
        name: "Platform Fee"
      });
    }

    // Server-calculated promo discount
    let discountAmount = 0;
    if (promo && promo.code) {
       const promoSnap = await db.collection('promos').where('code', '==', promo.code).limit(1).get();
       if (!promoSnap.empty) {
          const promoData = promoSnap.docs[0].data();
          const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          if (promoData.discountType === "PERCENT") {
             discountAmount = subtotal * (Number(promoData.discount || 0) / 100);
          } else {
             discountAmount = Number(promoData.discount || 0);
          }
          if (discountAmount > subtotal) discountAmount = subtotal;
       }
    }

    if (discountAmount > 0) {
      itemDetails.push({
        id: "discount",
        price: -discountAmount,
        quantity: 1,
        name: "Promo Discount"
      });
    }

    // Generate Midtrans Snap Transaction
    const authString = Buffer.from(process.env.MIDTRANS_SERVER_KEY + ":").toString("base64");
    const midtransResponse = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Basic " + authString
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: Math.round(totalAmount)
        },
        expiry: {
          duration: 5,
          unit: "minute"
        },
        item_details: itemDetails,
        customer_details: {
          first_name: userDetails.name.split(" ")[0] || "Guest",
          last_name: userDetails.name.split(" ").slice(1).join(" ") || "",
          email: userDetails.email,
          phone: userDetails.phone
        }
      })
    });

    const midtransData = await midtransResponse.json();

    if (!midtransResponse.ok) {
      console.error("Midtrans Error:", midtransData);
      throw new Error(midtransData.error_messages?.[0] || "Failed to generate payment link");
    }
    // Update the order in Firestore with the generated Midtrans link & token
    await db.collection("merch_orders").doc(orderId).update({
      checkoutUrl: midtransData.redirect_url,
      token: midtransData.token,
      snapToken: midtransData.token,
      snapRedirectUrl: midtransData.redirect_url
    });

    // Send Invoice Email via Nodemailer (Background task)
    sendOrderCreatedEmail(userDetails.email, {
      id: orderId,
      customerName: userDetails.name,
      totalAmount: Math.round(totalAmount),
      status: "PENDING_PAYMENT"
    });

    return NextResponse.json({ 
      success: true, 
      orderId, 
      checkoutUrl: midtransData.redirect_url,
      token: midtransData.token,
      redirectUrl: midtransData.redirect_url
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
// Force Next.js cache invalidation 3
