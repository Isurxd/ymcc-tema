import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const orderRef = db.collection('merch_orders').doc(id);
    
    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }
      
      const data = orderDoc.data();
      
      if (data.status !== "PENDING_PAYMENT") {
        throw new Error("Only pending orders can be cancelled");
      }

      // 1. Update Order Status
      transaction.update(orderRef, {
        status: "CANCELLED",
        paymentStatus: "CANCELLED",
        orderStatus: "CANCELLED",
        cancelledAt: FieldValue.serverTimestamp()
      });

      // 2. Restore Stock
      if (Array.isArray(data.items)) {
        data.items.forEach((item) => {
          if (item.productId) {
            const merchRef = db.collection('merchandise').doc(item.productId);
            const updatePayload = {
              stockAmount: FieldValue.increment(item.quantity || 1)
            };
            if (item.size) {
               updatePayload[`stockPerSize.${item.size}`] = FieldValue.increment(item.quantity || 1);
            }
            transaction.update(merchRef, updatePayload);
          }
        });
      }

      // 3. Revert Promo Frozen Commission
      if (data.promoCode && data.commissionFrozen) {
         const pSnap = await db.collection('promos').where('code', '==', data.promoCode).limit(1).get();
         if (!pSnap.empty) {
            const promoRef = pSnap.docs[0].ref;
            transaction.update(promoRef, {
               frozenBalance: FieldValue.increment(-data.commissionFrozen)
            });
         }
      }
    });

    return NextResponse.json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json({ error: error.message || "Failed to cancel order" }, { status: 500 });
  }
}
