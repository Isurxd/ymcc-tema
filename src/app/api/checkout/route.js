import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { items, userDetails, shippingDetails, deliveryMethod, shippingCost, platformFee, promo } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let totalAmount = 0;
    let totalItems = 0;
    const orderItems = [];
    const orderId = db.collection('Orders').doc().id;

    // Begin Firestore transaction for Atomic Soft-Lock
    await db.runTransaction(async (transaction) => {
      // 1. Fetch all merch docs first to avoid read-after-write errors
      const merchRefs = items.map(item => db.collection('merchandise').doc(item.id));
      const merchDocs = await transaction.getAll(...merchRefs);

      merchDocs.forEach((docSnap, idx) => {
        const item = items[idx];
        if (!docSnap.exists) throw new Error(`Product ${item.name} not found`);
        const stock = docSnap.data().stockAmount || 0;
        
        // Disable stock check for PO (Pre-Order) items if needed, but assuming all use stockAmount
        if (docSnap.data().stockType !== "PO" && stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        // Direct Row-level Locking: Decrement stock immediately
        transaction.update(docSnap.ref, { stockAmount: FieldValue.increment(-item.quantity) });

        totalAmount += item.price * item.quantity;
        totalItems += item.quantity;
        orderItems.push({
          productId: item.id,
          name: item.name,
          size: item.size || null,
          quantity: item.quantity,
          price: item.price
        });
      });

      // 2. Handle Promo and Affiliate Commission
      let discountAmount = 0;
      let totalCommission = 0;
      if (promo) {
         discountAmount = promo.discountAmount || 0;
         if (promo.affiliateEmail) {
            totalCommission = Number(promo.commission || 0) * totalItems;
            const promoRef = db.collection('promos').doc(promo.id);
            transaction.update(promoRef, { frozenBalance: FieldValue.increment(totalCommission) });
         }
      }

      // 3. Final Calculation
      totalAmount = totalAmount - discountAmount + (shippingCost || 0) + (platformFee || 0);

      // Create Order Document
      const orderRef = db.collection('Orders').doc(orderId);
      transaction.set(orderRef, {
        id: orderId,
        userDetails,
        deliveryMethod: deliveryMethod || "shipping",
        shippingDetails: deliveryMethod === "shipping" ? shippingDetails : null,
        shippingCost: shippingCost || 0,
        platformFee: platformFee || 0,
        promoCode: promo ? promo.code : null,
        discountAmount: discountAmount,
        affiliateEmail: promo ? promo.affiliateEmail : null,
        commissionFrozen: totalCommission,
        items: orderItems,
        totalAmount,
        status: "PENDING_PAYMENT",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Hours Expiry
      });
    });

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
        customer_details: {
          first_name: userDetails.name,
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
    await db.collection("Orders").doc(orderId).update({
      checkoutUrl: midtransData.redirect_url,
      token: midtransData.token
    });

    return NextResponse.json({ 
      success: true, 
      orderId, 
      checkoutUrl: midtransData.redirect_url,
      token: midtransData.token
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
