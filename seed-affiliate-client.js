const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } = require("firebase/firestore");
const { getAuth, createUserWithEmailAndPassword, updatePassword, signInWithEmailAndPassword } = require("firebase/auth");
const firebaseConfig = {
  apiKey: "AIzaSyAN1MraMferwJYveRRxDfyORH8NkChqjpg",
  authDomain: "ymcc-vii.firebaseapp.com",
  projectId: "ymcc-vii",
  storageBucket: "ymcc-vii.firebasestorage.app",
  messagingSenderId: "40431608620",
  appId: "1:40431608620:web:2c56cbed4123bca6428289"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ymcc-vii");
const auth = getAuth(app);

async function seed() {
  const dummyEmail = "afiliasi_dummy@ymcc.com";
  const dummyPassword = "ymcc2026";
  const dummyCode = "YMCC-DUMMY";
  
  console.log("Creating dummy affiliate via client SDK...");

  try {
    try {
      await createUserWithEmailAndPassword(auth, dummyEmail, dummyPassword);
      console.log("Created new auth user.");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        await signInWithEmailAndPassword(auth, dummyEmail, dummyPassword);
        console.log("User already exists, signed in.");
      } else {
        throw e;
      }
    }

    const appsRef = collection(db, "affiliate_applications");
    const qApps = query(appsRef, where("email", "==", dummyEmail));
    const existingApps = await getDocs(qApps);
    if (existingApps.empty) {
      await addDoc(appsRef, {
        fullName: "Dummy Affiliate",
        email: dummyEmail,
        phone: "08123456789",
        reason: "Ini adalah akun dummy untuk uji coba transparansi oleh superadmin.",
        socialLink: "https://instagram.com/dummy",
        bankDetails: "BCA 1234567890 a.n Dummy",
        status: "APPROVED",
        createdAt: serverTimestamp()
      });
      console.log("Added to affiliate_applications.");
    }

    const promosRef = collection(db, "promos");
    const qPromos = query(promosRef, where("code", "==", dummyCode));
    const existingPromos = await getDocs(qPromos);
    if (!existingPromos.empty) {
      const pDoc = existingPromos.docs[0];
      const { updateDoc, doc } = require("firebase/firestore");
      await updateDoc(doc(db, "promos", pDoc.id), {
        availableBalance: 75000,
        frozenBalance: 25000
      });
      console.log("Updated dummy promo balance.");
    } else {
      await addDoc(promosRef, {
        code: dummyCode,
        discountType: "FIXED",
        discount: 10000,
        commission: 5000,
        affiliateEmail: dummyEmail,
        availableBalance: 75000,
        frozenBalance: 25000,
        createdAt: new Date().getTime()
      });
      console.log("Added dummy promo.");
    }

    const ordersRef = collection(db, "merch_orders");
    const qOrders = query(ordersRef, where("customerInfo.referralCode", "==", dummyCode));
    const existingOrders = await getDocs(qOrders);
    if (!existingOrders.empty) {
      const { updateDoc, doc } = require("firebase/firestore");
      for (const oDoc of existingOrders.docs) {
         await updateDoc(doc(db, "merch_orders", oDoc.id), {
            createdAt: new Date().getTime(),
            paymentStatus: oDoc.data().status || "PAID"
         });
      }
    } else {
      await addDoc(ordersRef, {
        customerInfo: { fullName: "Pembeli Setia 1", email: "pembeli1@test.com", whatsapp: "0811111", referralCode: dummyCode },
        items: [{ id: "item1", name: "Shirt", quantity: 2, price: 100000 }],
        totalAmount: 180000,
        status: "PAID",
        paymentStatus: "PAID",
        createdAt: new Date().getTime()
      });

      await addDoc(ordersRef, {
        customerInfo: { fullName: "Pembeli Setia 2", email: "pembeli2@test.com", whatsapp: "0822222", referralCode: dummyCode },
        items: [{ id: "item2", name: "Hat", quantity: 1, price: 50000 }],
        totalAmount: 40000,
        status: "PAID",
        paymentStatus: "PAID",
        createdAt: new Date().getTime()
      });

      await addDoc(ordersRef, {
        customerInfo: { fullName: "Pembeli Galau", email: "pembeli3@test.com", whatsapp: "0833333", referralCode: dummyCode },
        items: [{ id: "item1", name: "Shirt", quantity: 1, price: 100000 }],
        totalAmount: 90000,
        status: "PENDING",
        paymentStatus: "PENDING",
        createdAt: new Date().getTime()
      });
      console.log("Added dummy merch orders.");
    }

    console.log("Dummy affiliate seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
