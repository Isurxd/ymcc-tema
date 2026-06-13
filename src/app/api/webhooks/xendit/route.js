import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req) {
  try {
    const callbackToken = req.headers.get("x-callback-token");

    // Verify Xendit Webhook Secret
    if (process.env.XENDIT_WEBHOOK_SECRET && callbackToken !== process.env.XENDIT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid Callback Token" }, { status: 403 });
    }

    const payload = await req.json();
    const orderId = payload.external_id;
    const status = payload.status; // PAID, EXPIRED, SETTLED

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('Orders').doc(orderId);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      // Update Order Status
      transaction.update(orderRef, {
        status: status, 
        paidAt: status === "PAID" || status === "SETTLED" ? FieldValue.serverTimestamp() : null
      });

      // Find all locks for this order and convert them to permanent deductions
      const locksSnapshot = await db.collection('Inventory_Locks')
        .where('orderId', '==', orderId)
        .get();

      // Delete the locks because the order is either PAID (lock is permanent) or EXPIRED (lock releases)
      locksSnapshot.docs.forEach((lockDoc) => {
        transaction.delete(lockDoc.ref);
      });
    });

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Xendit Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Error", details: error.message }, { status: 500 });
  }
}
