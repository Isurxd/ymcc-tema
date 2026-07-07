import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import midtransClient from "midtrans-client";

const snap = new midtransClient.Snap({
  isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});


export async function POST(req) {
  try {
    const { items, userDetails, shippingDetails, deliveryMethod, shippingCost, platformFee, promo } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let totalAmount = 0;
    let totalItems = 0;
    let discountAmount = 0;
    const orderItems = [];
    
    // Generate order ID (fallback to timestamp if db is not initialized)
    const orderId = db ? db.collection('Orders').doc().id : `YMCC-${Date.now()}`;

    if (db) {
      // Begin Firestore transaction
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
    } else {
      console.warn("⚠️ Database is not initialized. Running in Mock Mode to allow Midtrans checkout.");
      if (promo) {
        discountAmount = promo.discountAmount || 0;
      }
      
      items.forEach(item => {
        totalAmount += item.price * item.quantity;
        orderItems.push({
          productId: item.id,
          name: item.name,
          size: item.size || null,
          quantity: item.quantity,
          price: item.price
        });
      });
      totalAmount = totalAmount - discountAmount + (shippingCost || 0) + (platformFee || 0);
    }

    // Generate Midtrans Snap Token
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalAmount,
      },
      item_details: orderItems.map(item => ({
        id: item.productId,
        price: item.price,
        quantity: item.quantity,
        name: item.name.length > 50 ? item.name.substring(0, 47) + "..." : item.name,
      })),
      customer_details: {
        first_name: userDetails.name.split(" ")[0] || "Guest",
        last_name: userDetails.name.split(" ").slice(1).join(" ") || "",
        email: userDetails.email,
        phone: userDetails.phone,
      }
    };

    // Add shipping cost if delivery method is shipping
    if (deliveryMethod === "shipping" && shippingCost > 0) {
      parameter.item_details.push({
        id: "shipping-fee",
        price: shippingCost,
        quantity: 1,
        name: "Shipping Fee"
      });
    }

    // Add platform fee to item details
    if (platformFee > 0) {
      parameter.item_details.push({
        id: "platform-fee",
        price: platformFee,
        quantity: 1,
        name: "Platform Fee"
      });
    }

    // Add discount to item details as negative value
    if (discountAmount > 0) {
      parameter.item_details.push({
        id: "discount",
        price: -discountAmount,
        quantity: 1,
        name: "Promo Discount"
      });
    }

    const transaction = await snap.createTransaction(parameter);

    if (db) {
      // Save token and redirect url to Firestore Order
      await db.collection('Orders').doc(orderId).update({
        snapToken: transaction.token,
        snapRedirectUrl: transaction.redirect_url
      });
    }

    return NextResponse.json({ 
      success: true, 
      orderId, 
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
