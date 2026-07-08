import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

const app = getApps()[0];
const db = getFirestore(app, "ymcc-vii");

async function checkCollections() {
  const collections = await db.listCollections();
  console.log(`Found ${collections.length} collections:`);
  
  for (const collection of collections) {
    const snap = await collection.limit(5).get();
    console.log(`\nCollection: ${collection.id} (${snap.size} documents sampled)`);
    snap.forEach(doc => {
      // Try to print something identifiable
      const data = doc.data();
      const title = data.name || data.title || data.email || data.status || data.code || Object.keys(data)[0] || "No identifiable field";
      console.log(` - [${doc.id}]: ${String(title).substring(0, 50)}`);
    });
  }
}

checkCollections().catch(console.error);
