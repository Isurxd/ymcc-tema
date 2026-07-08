import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

const app = getApps()[0];
const db = getFirestore(app, "ymcc-vii");

async function check() {
  const merchSnap = await db.collection("merchandise").get();
  merchSnap.forEach(doc => console.log(doc.id, "Stock:", doc.data().stockAmount));

  const bannerSnap = await db.collection("merch_banners").get();
  bannerSnap.forEach(doc => console.log(doc.id, "Link:", doc.data().linkUrl));
}
check().catch(console.error);
