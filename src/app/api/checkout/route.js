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
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { items, userDetails, shippingDetails, deliveryMethod, shippingCost } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let totalAmount = 0;
    const orderItems = [];
    const orderId = db.collection('Orders').doc().id;

    // Begin Firestore transaction for Atomic Soft-Lock
    await db.runTransaction(async (transaction) => {
      for (const item of items) {
        // Verify available stock
        const productRef = db.collection('merchandise').doc(item.id);
        const productSnap = await transaction.get(productRef);
        if (productSnap.exists) {
          const productData = productSnap.data();
          if (productData.stockAmount !== undefined && productData.stockAmount < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${productData.stockAmount}`);
          }
        }

        // Create an Inventory Lock for 15 minutes
        const lockRef = db.collection('Inventory_Locks').doc();
        transaction.set(lockRef, {
          orderId,
          productId: item.id,
          size: item.size || null,
          quantity: item.quantity,
          lockedAt: FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
        });

        totalAmount += item.price * item.quantity;
        orderItems.push({
          productId: item.id,
          name: item.name,
          size: item.size || null,
          quantity: item.quantity,
          price: item.price
        });
      }

      // Add shipping cost to total amount
      totalAmount += shippingCost || 0;

      // Create Order Document
      const orderRef = db.collection('Orders').doc(orderId);
      transaction.set(orderRef, {
        id: orderId,
        userDetails,
        deliveryMethod: deliveryMethod || "shipping",
        shippingDetails: deliveryMethod === "shipping" ? shippingDetails : null,
        shippingCost: shippingCost || 0,
        items: orderItems,
        totalAmount,
        status: "PENDING_PAYMENT",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });
    });

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

    const transaction = await snap.createTransaction(parameter);

    // Save token and redirect url to Firestore Order
    await db.collection('Orders').doc(orderId).update({
      snapToken: transaction.token,
      snapRedirectUrl: transaction.redirect_url
    });

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
