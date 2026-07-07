import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export async function POST(req) {
  try {
    const payload = await req.json();
    
    const { 
      order_id: orderId, 
      transaction_status: midtransStatus, 
      status_code: statusCode, 
      gross_amount: grossAmount, 
      signature_key: signatureKey 
    } = payload;

    // Verify Midtrans Webhook Signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const hashData = orderId + statusCode + grossAmount + serverKey;
    const expectedSignature = crypto.createHash("sha512").update(hashData).digest("hex");
    
    if (signatureKey !== expectedSignature) {
      return NextResponse.json({ error: "Invalid Signature Key" }, { status: 403 });
    }

    if (!orderId || !midtransStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Map Midtrans Status to YMCC Order Status
    let status = "PENDING_PAYMENT";
    if (midtransStatus === "settlement" || midtransStatus === "capture") {
       status = "PAID";
    } else if (midtransStatus === "cancel" || midtransStatus === "deny" || midtransStatus === "expire") {
       status = "EXPIRED";
    } else {
       // pending, refund, chargeback, etc. We just ignore or keep pending.
       return NextResponse.json({ success: true, message: "Ignored status" });
    }

    // Fetch order first to get dependencies
    const orderRef = db.collection('Orders').doc(orderId);
    const orderDocSnap = await orderRef.get();
    if (!orderDocSnap.exists) {
      throw new Error("Order not found");
    }
    const orderData = orderDocSnap.data();

    if (orderData.status === "PAID" || orderData.status === "SETTLED" || orderData.status === "EXPIRED") {
       return NextResponse.json({ success: true, message: "Already processed" });
    }

    let promoRef = null;
    if (orderData.promoCode) {
       const pSnap = await db.collection('promos').where('code', '==', orderData.promoCode).limit(1).get();
       if (!pSnap.empty) {
          promoRef = pSnap.docs[0].ref;
       }
    }

    await db.runTransaction(async (transaction) => {
      // Re-read order to enforce transaction safety
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) throw new Error("Order missing in tx");
      const data = orderDoc.data();
      if (data.status === "PAID" || data.status === "SETTLED" || data.status === "EXPIRED") {
         return; // already handled
      }

      // Update Order Status
      transaction.update(orderRef, {
        status: status, 
        paidAt: status === "PAID" || status === "SETTLED" ? FieldValue.serverTimestamp() : null
      });

      if (status === "EXPIRED") {
        // Return stock
        if (Array.isArray(data.items)) {
          data.items.forEach((item) => {
            if (item.productId) { 
              const merchRef = db.collection('merchandise').doc(item.productId);
              transaction.update(merchRef, {
                stockAmount: FieldValue.increment(item.quantity)
              });
            }
          });
        }
        
        // Remove frozen balance
        if (promoRef && data.commissionFrozen) {
           transaction.update(promoRef, {
              frozenBalance: FieldValue.increment(-data.commissionFrozen)
           });
        }
      } else if (status === "PAID" || status === "SETTLED") {
        // Stock already decremented at checkout, do nothing for merch
        
        // Move frozen to available
        if (promoRef && data.commissionFrozen) {
           transaction.update(promoRef, {
              frozenBalance: FieldValue.increment(-data.commissionFrozen),
              availableBalance: FieldValue.increment(data.commissionFrozen)
           });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Midtrans Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Error", details: error.message }, { status: 500 });
  }
}
