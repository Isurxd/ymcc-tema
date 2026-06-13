import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

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

    // Generate Xendit Invoice
    const xenditResponse = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64")
      },
      body: JSON.stringify({
        external_id: orderId,
        amount: totalAmount,
        payer_email: userDetails.email,
        description: "YMCC VII Merchandise Order",
        customer: {
          given_names: userDetails.name,
          email: userDetails.email,
          mobile_number: userDetails.phone
        },
        success_redirect_url: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/merch/success?order_id=${orderId}` : `http://localhost:3000/merch/success?order_id=${orderId}`,
        failure_redirect_url: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/merch/checkout` : `http://localhost:3000/merch/checkout`
      })
    });

    const xenditData = await xenditResponse.json();

    if (!xenditResponse.ok) {
      console.error("Xendit Error:", xenditData);
      throw new Error(xenditData.message || "Failed to generate payment invoice");
    }

    return NextResponse.json({ 
      success: true, 
      orderId, 
      checkoutUrl: xenditData.invoice_url 
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
