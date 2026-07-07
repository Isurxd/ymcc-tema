import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

/**
 * Midtrans Payment Notification Webhook
 * URL: POST /api/webhooks/midtrans
 *
 * Midtrans akan POST ke sini setiap kali status transaksi berubah.
 * Signature verification: SHA512(orderId + statusCode + grossAmount + serverKey)
 *
 * Daftarkan URL ini di:
 * Midtrans Dashboard → Settings → Configuration → Payment Notification URL
 * → https://yourdomain.com/api/webhooks/midtrans
 */
export async function POST(req) {
  try {
    const payload = await req.json();

    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
      payment_type,
      transaction_id,
      transaction_time,
    } = payload;

    // ── 1. Verifikasi Signature Midtrans ──────────────────────────────────────
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (serverKey) {
      const rawString = `${order_id}${status_code}${gross_amount}${serverKey}`;
      const expectedSignature = crypto
        .createHash("sha512")
        .update(rawString)
        .digest("hex");

      if (signature_key !== expectedSignature) {
        console.warn("⚠️ Midtrans Webhook: Invalid signature for order:", order_id);
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    if (!order_id || !transaction_status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 2. Tentukan status order berdasarkan notifikasi Midtrans ─────────────
    //
    // Midtrans transaction_status:
    //   capture   → kartu kredit berhasil (cek fraud_status)
    //   settlement → transfer/VA/e-wallet sukses diselesaikan
    //   pending   → menunggu pembayaran user
    //   deny      → ditolak (kartu/fraud)
    //   expire    → waktu pembayaran habis
    //   cancel    → dibatalkan
    //   refund    → dikembalikan
    //
    let newStatus = null;

    if (transaction_status === "capture") {
      // Kartu kredit: perlu cek fraud_status
      newStatus = fraud_status === "accept" ? "PAID" : "FRAUD_DENIED";
    } else if (transaction_status === "settlement") {
      newStatus = "PAID";
    } else if (transaction_status === "pending") {
      newStatus = "PENDING_PAYMENT";
    } else if (transaction_status === "deny") {
      newStatus = "DENIED";
    } else if (transaction_status === "expire") {
      newStatus = "EXPIRED";
    } else if (transaction_status === "cancel") {
      newStatus = "CANCELLED";
    } else if (transaction_status === "refund" || transaction_status === "partial_refund") {
      newStatus = "REFUNDED";
    } else {
      // Status tidak dikenal — log tapi tetap return 200 agar Midtrans tidak retry
      console.log(`ℹ️ Midtrans unhandled status: ${transaction_status} for order ${order_id}`);
      return NextResponse.json({ success: true, message: "Status noted but not processed" });
    }

    const isPaid = newStatus === "PAID";

    // ── 3. Update Firestore dalam satu transaksi atomik ───────────────────────
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection("Orders").doc(order_id);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error(`Order not found: ${order_id}`);
      }

      const currentStatus = orderDoc.data()?.status;

      // Idempotency: jangan proses ulang jika sudah PAID
      if (currentStatus === "PAID" && isPaid) {
        console.log(`ℹ️ Order ${order_id} already PAID. Skipping.`);
        return;
      }

      // Update status order
      transaction.update(orderRef, {
        status: newStatus,
        paymentType: payment_type || null,
        midtransTransactionId: transaction_id || null,
        midtransTransactionTime: transaction_time || null,
        ...(isPaid && { paidAt: FieldValue.serverTimestamp() }),
        ...(["EXPIRED", "CANCELLED"].includes(newStatus) && {
          expiredAt: FieldValue.serverTimestamp(),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Hapus semua inventory locks untuk order ini
      const locksSnapshot = await db
        .collection("Inventory_Locks")
        .where("orderId", "==", order_id)
        .get();

      locksSnapshot.docs.forEach((lockDoc) => {
        transaction.delete(lockDoc.ref);
      });

      // Jika PAID: kurangi stok permanen
      if (isPaid) {
        const orderData = orderDoc.data();
        if (orderData && Array.isArray(orderData.items)) {
          orderData.items.forEach((item) => {
            const productId = item.productId || item.id;
            if (productId) {
              const merchRef = db.collection("merchandise").doc(productId);
              transaction.update(merchRef, {
                stockAmount: FieldValue.increment(-item.quantity),
              });
            }
          });
        }
      }
    });

    console.log(`✅ Midtrans Webhook: Order ${order_id} → ${newStatus}`);
    return NextResponse.json({
      success: true,
      message: `Order ${order_id} updated to ${newStatus}`,
    });

  } catch (error) {
    console.error("❌ Midtrans Webhook Error:", error.message);
    // Tetap return 200 untuk status "order not found" agar Midtrans tidak retry berulang
    if (error.message?.includes("Order not found")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
