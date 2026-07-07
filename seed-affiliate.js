import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Load service account
const serviceAccountPath = path.resolve("./serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

async function seed() {
  const dummyEmail = "afiliasi_dummy@ymcc.com";
  const dummyPassword = "ymcc2026";
  const dummyCode = "YMCC-DUMMY";
  
  console.log("Creating dummy affiliate...");

  // 1. Create or Update Auth User
  try {
    try {
      const user = await auth.getUserByEmail(dummyEmail);
      await auth.updateUser(user.uid, { password: dummyPassword });
      console.log("Updated existing auth user.");
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        await auth.createUser({
          email: dummyEmail,
          password: dummyPassword,
          displayName: "Dummy Affiliate",
        });
        console.log("Created new auth user.");
      } else {
        throw e;
      }
    }

    // 2. Add to affiliate_applications (so they show up in Staff Dashboard)
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
      console.log("Added to affiliate_applications.");
    }

    // 3. Create a Dummy Promo
    const promosRef = db.collection("promos");
    const existingPromos = await promosRef.where("code", "==", dummyCode).get();
    if (existingPromos.empty) {
      await promosRef.add({
        code: dummyCode,
        discountType: "FIXED",
        discount: 10000,
        commission: 5000,
        affiliateEmail: dummyEmail,
        availableBalance: 15000, // 3 paid items
        frozenBalance: 5000, // 1 pending item
        createdAt: FieldValue.serverTimestamp()
      });
      console.log("Added dummy promo.");
    }

    // 4. Create some Dummy Orders that used this promo
    const ordersRef = db.collection("merch_orders");
    const existingOrders = await ordersRef.where("customerInfo.referralCode", "==", dummyCode).get();
    if (existingOrders.empty) {
      // Order 1: PAID (2 items = 10000 commission)
      await ordersRef.add({
        customerInfo: {
          fullName: "Pembeli Setia 1",
          email: "pembeli1@test.com",
          whatsapp: "0811111",
          referralCode: dummyCode
        },
        items: [{ id: "item1", name: "Shirt", quantity: 2, price: 100000 }],
        totalAmount: 180000,
        status: "PAID",
        createdAt: FieldValue.serverTimestamp()
      });

      // Order 2: PAID (1 item = 5000 commission)
      await ordersRef.add({
        customerInfo: {
          fullName: "Pembeli Setia 2",
          email: "pembeli2@test.com",
          whatsapp: "0822222",
          referralCode: dummyCode
        },
        items: [{ id: "item2", name: "Hat", quantity: 1, price: 50000 }],
        totalAmount: 40000,
        status: "PAID",
        createdAt: FieldValue.serverTimestamp()
      });

      // Order 3: PENDING (1 item = 5000 frozen commission)
      await ordersRef.add({
        customerInfo: {
          fullName: "Pembeli Galau",
          email: "pembeli3@test.com",
          whatsapp: "0833333",
          referralCode: dummyCode
        },
        items: [{ id: "item1", name: "Shirt", quantity: 1, price: 100000 }],
        totalAmount: 90000,
        status: "PENDING",
        createdAt: FieldValue.serverTimestamp()
      });
      console.log("Added dummy merch orders.");
    }

    console.log("Dummy affiliate seed complete!");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
}

seed();
