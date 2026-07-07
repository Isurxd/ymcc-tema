import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { items, userDetails, shippingDetails, deliveryMethod, shippingCost, platformFee, promo } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let totalAmount = 0;
    let totalItems = 0;
    const orderItems = [];
    const orderId = db.collection('Orders').doc().id;

    // Begin Firestore transaction for Atomic Soft-Lock
    await db.runTransaction(async (transaction) => {
      // 1. Fetch all merch docs first to avoid read-after-write errors
      const merchRefs = items.map(item => db.collection('merchandise').doc(item.id));
      const merchDocs = await transaction.getAll(...merchRefs);

      merchDocs.forEach((docSnap, idx) => {
        const item = items[idx];
        if (!docSnap.exists) throw new Error(`Product ${item.name} not found`);
        const stock = docSnap.data().stockAmount || 0;
        
        // Disable stock check for PO (Pre-Order) items if needed, but assuming all use stockAmount
        if (docSnap.data().stockType !== "PO" && stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        // Direct Row-level Locking: Decrement stock immediately
        transaction.update(docSnap.ref, { stockAmount: FieldValue.increment(-item.quantity) });

        totalAmount += item.price * item.quantity;
        totalItems += item.quantity;
        orderItems.push({
          productId: item.id,
          name: item.name,
          size: item.size || null,
          quantity: item.quantity,
          price: item.price
        });
      });

      // 2. Handle Promo and Affiliate Commission
      let discountAmount = 0;
      let totalCommission = 0;
      if (promo) {
         discountAmount = promo.discountAmount || 0;
         if (promo.affiliateEmail) {
            totalCommission = Number(promo.commission || 0) * totalItems;
            const promoRef = db.collection('promos').doc(promo.id);
            transaction.update(promoRef, { frozenBalance: FieldValue.increment(totalCommission) });
         }
      }

      // 3. Final Calculation
      totalAmount = totalAmount - discountAmount + (shippingCost || 0) + (platformFee || 0);

      // Create Order Document
      const orderRef = db.collection('Orders').doc(orderId);
      transaction.set(orderRef, {
        id: orderId,
        userDetails,
        deliveryMethod: deliveryMethod || "shipping",
        shippingDetails: deliveryMethod === "shipping" ? shippingDetails : null,
        shippingCost: shippingCost || 0,
        platformFee: platformFee || 0,
        promoCode: promo ? promo.code : null,
        discountAmount: discountAmount,
        affiliateEmail: promo ? promo.affiliateEmail : null,
        commissionFrozen: totalCommission,
        items: orderItems,
        totalAmount,
        status: "PENDING_PAYMENT",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Hours Expiry
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
