import { NextResponse } from "next/server";
import { db as dbAdmin } from "@/lib/firebaseAdmin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    
    const email = searchParams.get("email");

    if (type === "affiliate_data") {
      // For affiliate dashboard
      if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
      const promosSnap = await dbAdmin.collection("promos").where("affiliateEmail", "==", email).get();
      const promos = promosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let orders = [];
      if (promos.length > 0) {
        const promoCodes = promos.map(p => p.code);
        // Firestore 'in' query supports up to 10 items.
        // Assuming an affiliate has fewer than 10 active codes at once.
        const chunks = [];
        for (let i = 0; i < promoCodes.length; i += 10) {
          chunks.push(promoCodes.slice(i, i + 10));
        }
        
        for (const chunk of chunks) {
          const ordersSnap = await dbAdmin.collection("merch_orders").where("customerInfo.referralCode", "in", chunk).get();
          ordersSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.createdAt && data.createdAt.toDate) {
              data.createdAt = data.createdAt.toDate().toISOString();
            } else if (data.createdAt && data.createdAt._seconds) {
              data.createdAt = new Date(data.createdAt._seconds * 1000).toISOString();
            }
            orders.push({ id: doc.id, ...data });
          });
        }
      }
      
      // Sort orders newest first
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return NextResponse.json({ promos, orders });
    }

    if (type === "staff_dashboard") {
      // For staff dashboard
      const promosSnap = await dbAdmin.collection("promos").get();
      const appsSnap = await dbAdmin.collection("affiliate_applications").orderBy("createdAt", "desc").get();
      
      const promos = promosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const affiliateApps = appsSnap.docs.map(doc => {
        const data = doc.data();
        if (data.createdAt && data.createdAt.toDate) {
          data.createdAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt && data.createdAt._seconds) {
          data.createdAt = new Date(data.createdAt._seconds * 1000).toISOString();
        }
        return { id: doc.id, ...data };
      });
      
      return NextResponse.json({ promos, affiliateApps });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Admin data error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === "approve_affiliate") {
      const { id, promoData } = payload;
      await dbAdmin.collection("affiliate_applications").doc(id).update({ status: "APPROVED" });
      await dbAdmin.collection("promos").add(promoData);
      return NextResponse.json({ success: true });
    }

    if (action === "reject_affiliate") {
      const { id } = payload;
      await dbAdmin.collection("affiliate_applications").doc(id).update({ status: "REJECTED" });
      return NextResponse.json({ success: true });
    }

    if (action === "save_promo") {
      const { id, promoData } = payload;
      if (id) {
        await dbAdmin.collection("promos").doc(id).update(promoData);
      } else {
        await dbAdmin.collection("promos").add(promoData);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "delete_promo") {
      const { id } = payload;
      await dbAdmin.collection("promos").doc(id).delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
