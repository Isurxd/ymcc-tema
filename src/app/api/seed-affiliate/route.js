import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const dummyEmail = "afiliasi_dummy@ymcc.com";
  const dummyPassword = "ymcc2026";
  const dummyCode = "YMCC-DUMMY";
  
  try {
    try {
      const user = await auth.getUserByEmail(dummyEmail);
      await auth.updateUser(user.uid, { password: dummyPassword });
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        await auth.createUser({
          email: dummyEmail,
          password: dummyPassword,
          displayName: "Dummy Affiliate",
        });
      } else {
        throw e;
      }
    }

    const appsRef = db.collection("affiliate_applications");
    const existingApps = await appsRef.where("email", "==", dummyEmail).get();
    if (existingApps.empty) {
      await appsRef.add({
        fullName: "Dummy Affiliate",
        email: dummyEmail,
        phone: "08123456789",
        reason: "Ini adalah akun dummy untuk uji coba transparansi oleh superadmin.",
        socialLink: "https://instagram.com/dummy",
        bankDetails: "BCA 1234567890 a.n Dummy",
        status: "APPROVED",
        createdAt: FieldValue.serverTimestamp()
      });
    }

    const promosRef = db.collection("promos");
    const existingPromos = await promosRef.where("code", "==", dummyCode).get();
    if (existingPromos.empty) {
      await promosRef.add({
        code: dummyCode,
        discountType: "FIXED",
        discount: 10000,
        commission: 5000,
        affiliateEmail: dummyEmail,
        availableBalance: 15000,
        frozenBalance: 5000,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    const ordersRef = db.collection("merch_orders");
    const existingOrders = await ordersRef.where("customerInfo.referralCode", "==", dummyCode).get();
    if (existingOrders.empty) {
      await ordersRef.add({
        customerInfo: { fullName: "Pembeli Setia 1", email: "pembeli1@test.com", whatsapp: "0811111", referralCode: dummyCode },
        items: [{ id: "item1", name: "Shirt", quantity: 2, price: 100000 }],
        totalAmount: 180000,
        status: "PAID",
        createdAt: FieldValue.serverTimestamp()
      });

      await ordersRef.add({
        customerInfo: { fullName: "Pembeli Setia 2", email: "pembeli2@test.com", whatsapp: "0822222", referralCode: dummyCode },
        items: [{ id: "item2", name: "Hat", quantity: 1, price: 50000 }],
        totalAmount: 40000,
        status: "PAID",
        createdAt: FieldValue.serverTimestamp()
      });

      await ordersRef.add({
        customerInfo: { fullName: "Pembeli Galau", email: "pembeli3@test.com", whatsapp: "0833333", referralCode: dummyCode },
        items: [{ id: "item1", name: "Shirt", quantity: 1, price: 100000 }],
        totalAmount: 90000,
        status: "PENDING",
        createdAt: FieldValue.serverTimestamp()
      });
    }

    return NextResponse.json({ success: true, message: "Seeded dummy affiliate" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
