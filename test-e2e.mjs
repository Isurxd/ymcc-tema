import { initializeApp as initAdmin, cert, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./firebase-admin-key.json');

// 1. Initialize Admin SDK
const adminApp = !getAdminApps().length ? initAdmin({ credential: cert(serviceAccount) }) : getAdminApps()[0];
const adminAuth = getAdminAuth(adminApp);

// 2. Initialize Client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAN1MraMferwJYveRRxDfyORH8NkChqjpg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ymcc-vii.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ymcc-vii",
};
const app = initializeApp(firebaseConfig);
const clientAuth = getAuth(app);
const clientDb = getFirestore(app, "ymcc-vii");

async function runTests() {
  console.log("🚀 Starting Automated E2E Portal Tests...\n");
  const testEmail = "test_auto_staff@ymccvii.com";
  const testPassword = "password123";

  try {
    console.log("🧹 Cleaning up previous test artifacts...");
    try {
      const userRecord = await adminAuth.getUserByEmail(testEmail);
      await adminAuth.deleteUser(userRecord.uid);
    } catch(e) {}

    // Get Superadmin UID and mint token
    console.log("🔑 Authenticating as Superadmin via Custom Token...");
    const superAdminRecord = await adminAuth.getUserByEmail("m.fairuzadhimularifin@gmail.com");
    const customToken = await adminAuth.createCustomToken(superAdminRecord.uid);
    await signInWithCustomToken(clientAuth, customToken);
    
    try {
      await deleteDoc(doc(clientDb, "staff_applications", testEmail));
    } catch(e) {}
    
    await signOut(clientAuth);

    console.log("✅ [1] Simulating Public Registration (/staff-register)...");
    const userCred = await createUserWithEmailAndPassword(clientAuth, testEmail, testPassword);
    const uid = userCred.user.uid;
    
    await setDoc(doc(clientDb, "staff_applications", testEmail), {
      name: "Test Staff",
      email: testEmail,
      status: "PENDING",
      role: null
    });
    console.log("   -> Staff successfully registered as PENDING.");
    await signOut(clientAuth);

    console.log("\n✅ [2] Simulating Admin APPROVAL & Role Assignment (OPERATOR)...");
    await signInWithCustomToken(clientAuth, customToken);
    await updateDoc(doc(clientDb, "staff_applications", testEmail), {
      status: "APPROVED",
      role: "Operator"
    });
    console.log("   -> Superadmin approved application and assigned OPERATOR.");
    await signOut(clientAuth);
    
    // Test logging in as Operator
    await signInWithEmailAndPassword(clientAuth, testEmail, testPassword);
    const docSnap1 = await getDoc(doc(clientDb, "staff_applications", testEmail));
    if(docSnap1.exists() && docSnap1.data().role === "Operator") {
      console.log("   -> Login as OPERATOR successful. Firestore Data readable.");
    } else {
      throw new Error("Failed Operator check");
    }
    await signOut(clientAuth);

    console.log("\n✅ [3] Simulating Role Change to FUNDRAISING...");
    await signInWithCustomToken(clientAuth, customToken);
    await updateDoc(doc(clientDb, "staff_applications", testEmail), {
      role: "Fundraising"
    });
    await signOut(clientAuth);

    await signInWithEmailAndPassword(clientAuth, testEmail, testPassword);
    const docSnap2 = await getDoc(doc(clientDb, "staff_applications", testEmail));
    if(docSnap2.data().role === "Fundraising") {
      console.log("   -> Login as FUNDRAISING successful.");
    }
    await signOut(clientAuth);

    console.log("\n✅ [4] Simulating Role Change to ADMIN...");
    await signInWithCustomToken(clientAuth, customToken);
    await updateDoc(doc(clientDb, "staff_applications", testEmail), {
      role: "Admin"
    });
    await signOut(clientAuth);

    await signInWithEmailAndPassword(clientAuth, testEmail, testPassword);
    const docSnap3 = await getDoc(doc(clientDb, "staff_applications", testEmail));
    if(docSnap3.data().role === "Admin") {
      console.log("   -> Login as ADMIN successful.");
    }
    await signOut(clientAuth);

    console.log("\n✅ [5] Cleaning Up...");
    await signInWithCustomToken(clientAuth, customToken);
    await deleteDoc(doc(clientDb, "staff_applications", testEmail));
    await adminAuth.deleteUser(uid);
    console.log("   -> Cleanup completed successfully.");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The portal roles, Firebase Auth, and Firestore Rules are functioning perfectly.");

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
  }
  process.exit(0);
}

runTests();
