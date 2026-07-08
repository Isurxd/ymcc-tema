import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function test() {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    const db = getFirestore(app, "ymcc-vii");
    const snap = await db.collection('Orders').limit(1).get();
    console.log("Success! Found documents:", snap.docs.length);
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
