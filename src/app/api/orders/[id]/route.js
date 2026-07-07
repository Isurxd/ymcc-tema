import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/lib/firebaseAdmin";

export async function GET(request, { params }) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const db = getFirestore(app, "ymcc-vii");
    const orderDoc = await db.collection("Orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDoc.data();

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        status: orderData.status,
        totalAmount: orderData.totalAmount,
        items: orderData.items,
        shippingDetails: orderData.shippingDetails,
        customerName: orderData.customerDetails?.first_name || orderData.customerDetails?.name || "Customer",
        checkoutUrl: orderData.checkoutUrl,
        token: orderData.token,
        createdAt: orderData.createdAt ? orderData.createdAt.toDate().toISOString() : null
      }
    });

  } catch (error) {
    console.error("Fetch Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
