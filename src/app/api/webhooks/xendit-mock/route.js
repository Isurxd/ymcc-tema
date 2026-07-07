import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Begin transaction to update Order and confirm Inventory Locks
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('Orders').doc(orderId);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      // Update Order Status
      transaction.update(orderRef, {
        status: status, // "PAID"
        paidAt: FieldValue.serverTimestamp()
      });

      // Find all locks for this order and convert them to permanent deductions
      // Note: In Firestore, queries inside transactions must come before writes,
      // so we use a standard query first to get the locks
      const locksSnapshot = await db.collection('Inventory_Locks')
        .where('orderId', '==', orderId)
        .get();

      // Delete the locks because the order is now PAID (lock is permanent) and deduct from stock
      locksSnapshot.docs.forEach((lockDoc) => {
        const lockData = lockDoc.data();
        if (status === "PAID") {
          const productRef = db.collection('merchandise').doc(lockData.productId);
          transaction.update(productRef, {
            stockAmount: FieldValue.increment(-lockData.quantity)
          });
        }
        transaction.delete(lockDoc.ref);
      });
    });

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
