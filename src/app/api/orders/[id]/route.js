import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(request, { params }) {
  try {
    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const orderDoc = await db.collection("merch_orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDoc.data();

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        status: orderData.status,
        orderStatus: orderData.orderStatus,
        deliveryMethod: orderData.deliveryMethod,
        trackingNumber: orderData.shippingDetails?.trackingNumber || null,
        courier: orderData.shippingDetails?.courier || null,
        totalAmount: orderData.totalAmount,
        items: orderData.items,
        shippingDetails: orderData.shippingDetails,
        customerName: orderData.userDetails?.name || orderData.userDetails?.fullName || orderData.customerDetails?.first_name || "Customer",
        checkoutUrl: orderData.checkoutUrl,
        token: orderData.token,
        createdAt: orderData.createdAt ? (typeof orderData.createdAt.toDate === 'function' ? orderData.createdAt.toDate().toISOString() : new Date(orderData.createdAt).toISOString()) : null
      }
    });

  } catch (error) {
    console.error("Fetch Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
