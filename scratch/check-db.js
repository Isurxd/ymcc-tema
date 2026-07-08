import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
const serviceAccount = JSON.parse(match[1]);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
  try {
    const snap = await db.collection("merch_orders").get();
    console.log(`merch_orders count: ${snap.size}`);
    snap.forEach(doc => {
      console.log(doc.id, doc.data().status, doc.data().createdAt);
    });
  } catch (e) {
    console.error("Error:", e);
  }
}
check();
