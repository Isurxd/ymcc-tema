import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

const app = getApps()[0];
const db = getFirestore(app, "ymcc-vii");

async function check() {
  const merchSnap = await db.collection("merchandise").get();
  const ordersSnap = await db.collection("Orders").get();
  
  console.log(`Found ${merchSnap.size} merchandise items.`);
  merchSnap.forEach(doc => console.log(` - ${doc.id}: ${doc.data().name}`));

  console.log(`\nFound ${ordersSnap.size} orders.`);
  ordersSnap.forEach(doc => console.log(` - ${doc.id}: ${doc.data().status}`));
}

check().catch(console.error);
