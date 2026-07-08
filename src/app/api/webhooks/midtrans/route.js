import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";
import { sendPaymentReceivedEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const payload = await req.json();

    const {
      order_id: orderId,
      transaction_status: midtransStatus,
      fraud_status: fraudStatus,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      payment_type: paymentType,
      transaction_id: transactionId,
      transaction_time: transactionTime,
    } = payload;

    // ── 1. Verifikasi Signature Midtrans ──────────────────────────────────────
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (serverKey) {
      const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
      const expectedSignature = crypto
        .createHash("sha512")
        .update(rawString)
        .digest("hex");

      if (signatureKey !== expectedSignature) {
        console.warn("⚠️ Midtrans Webhook: Invalid signature for order:", orderId);
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    if (!orderId || !midtransStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 2. Tentukan status order berdasarkan notifikasi Midtrans ─────────────
    let status = "PENDING_PAYMENT";

    if (midtransStatus === "capture") {
      status = fraudStatus === "accept" ? "PAID" : "FRAUD_DENIED";
    } else if (midtransStatus === "settlement") {
      status = "PAID";
    } else if (midtransStatus === "pending") {
      status = "PENDING_PAYMENT";
    } else if (midtransStatus === "deny") {
      status = "DENIED";
    } else if (midtransStatus === "expire") {
      status = "EXPIRED";
    } else if (midtransStatus === "cancel") {
      status = "CANCELLED";
    } else if (midtransStatus === "refund" || midtransStatus === "partial_refund") {
      status = "REFUNDED";
    } else {
      console.log(`ℹ️ Midtrans unhandled status: ${midtransStatus} for order ${orderId}`);
      return NextResponse.json({ success: true, message: "Status noted but not processed" });
    }

    const isPaid = status === "PAID" || status === "SETTLED";

    // Fetch order first to get dependencies
    let orderRef = db.collection("merch_orders").doc(orderId);
    let orderDocSnap = await orderRef.get();
    let isDigital = false;

    if (!orderDocSnap.exists) {
      orderRef = db.collection("Orders").doc(orderId);
      orderDocSnap = await orderRef.get();
      if (!orderDocSnap.exists) {
        throw new Error(`Order not found: ${orderId}`);
      }
      isDigital = true;
    }
    const orderData = orderDocSnap.data();

    if (orderData.status === "PAID" || orderData.status === "SETTLED" || orderData.status === "EXPIRED") {
       return NextResponse.json({ success: true, message: "Already processed" });
    }

    let promoRef = null;
    if (orderData.promoCode) {
      const pSnap = await db.collection("promos").where("code", "==", orderData.promoCode).limit(1).get();
      if (!pSnap.empty) {
        promoRef = pSnap.docs[0].ref;
      }
    }

    // ── 3. Update Firestore dalam satu transaksi atomik ───────────────────────
    await db.runTransaction(async (transaction) => {
      // Re-read order inside transaction for safety
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error(`Order not found in transaction: ${orderId}`);
      }

      const data = orderDoc.data();
      const currentStatus = data?.status;

      // Idempotency: jangan proses ulang jika sudah PAID
      if ((currentStatus === "PAID" || currentStatus === "SETTLED") && isPaid) {
        console.log(`ℹ️ Order ${orderId} already PAID. Skipping.`);
        return;
      }

      // Update status order
      transaction.update(orderRef, {
        status: status,
        paymentStatus: isPaid ? "PAID" : "UNPAID",
        orderStatus: ["EXPIRED", "CANCELLED", "DENIED", "FRAUD_DENIED"].includes(status) ? "CANCELLED" : isPaid ? "PROCESSING" : "PENDING",
        paymentType: paymentType || null,
        midtransTransactionId: transactionId || null,
        midtransTransactionTime: transactionTime || null,
        ...(isPaid && { paidAt: FieldValue.serverTimestamp() }),
        ...(["EXPIRED", "CANCELLED", "DENIED", "FRAUD_DENIED"].includes(status) && {
          expiredAt: FieldValue.serverTimestamp(),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Hapus semua inventory locks untuk order ini (jika ada)
      const locksSnapshot = await db
        .collection("Inventory_Locks")
        .where("orderId", "==", orderId)
        .get();

      locksSnapshot.docs.forEach((lockDoc) => {
        transaction.delete(lockDoc.ref);
      });

      // Jika EXPIRED, CANCELLED, atau DENIED: kembalikan stok & kurangi frozen balance
      if (["EXPIRED", "CANCELLED", "DENIED", "FRAUD_DENIED"].includes(status)) {
        if (!isDigital && Array.isArray(data.items)) {
          data.items.forEach((item) => {
            const productId = item.productId || item.id;
            if (productId) {
              const merchRef = db.collection("merchandise").doc(productId);
              const updatePayload = {
                stockAmount: FieldValue.increment(item.quantity)
              };
              if (item.size) {
                 updatePayload[`stockPerSize.${item.size}`] = FieldValue.increment(item.quantity);
              }
              transaction.update(merchRef, updatePayload);
            }
          });
        }

        // Hapus frozen balance affiliate
        if (promoRef && data.commissionFrozen) {
          transaction.update(promoRef, {
            frozenBalance: FieldValue.increment(-data.commissionFrozen),
          });
        }
      } else if (isPaid) {
        // Jika PAID: pindahkan frozen balance ke available balance
        if (promoRef && data.commissionFrozen) {
          transaction.update(promoRef, {
            frozenBalance: FieldValue.increment(-data.commissionFrozen),
            availableBalance: FieldValue.increment(data.commissionFrozen),
          });
        }
      }
    });

    if (isPaid) {
      const custEmail = orderData.userDetails?.email || orderData.customerDetails?.email;
      const custName = orderData.userDetails?.name || orderData.userDetails?.fullName || orderData.customerDetails?.first_name || "Customer";
      if (custEmail) {
        sendPaymentReceivedEmail(custEmail, {
          id: orderId,
          customerName: custName,
          totalAmount: orderData.totalAmount || grossAmount,
          status: "PAID"
        });
      }
    }

    console.log(`✅ Midtrans Webhook: Order ${orderId} → ${status}`);
    return NextResponse.json({
      success: true,
      message: `Order ${orderId} updated to ${status}`,
    });

  } catch (error) {
    console.error("❌ Midtrans Webhook Error:", error.message);
    if (error.message?.includes("Order not found")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
// Force Next.js cache invalidation 3
