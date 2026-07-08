import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import path from 'path';

// Fix dotenv loading for scratch folder execution
import { fileURLToPath } from 'url';
import { dirname } from 'path';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

const app = getApps()[0];
const db = getFirestore(app, "ymcc-vii");

async function migrate() {
  console.log("Migrating Merchandise...");
  const batch = db.batch();
  
  const wearpackRef = db.collection('merchandise').doc('wearpack-official');
  batch.update(wearpackRef, {
    description: "Official YMCC VII Wearpack featuring an exclusive, durable, and comfortable design. Perfect for fieldwork, practicums, and other outdoor activities. Equipped with high-visibility reflective tape for added safety.",
    stockPerSize: {
      "S": 0,
      "M": 1,
      "L": 0,
      "XL": 0
    },
    // We will keep stockAmount as the TOTAL stock for backward compatibility if needed,
    // or just calculate it. For now let's set it to total.
    stockAmount: 1,
    sizes: ["S", "M", "L", "XL"] // We'll offer these sizes, but only M has stock
  });

  const vestRef = db.collection('merchandise').doc('vest-official');
  batch.update(vestRef, {
    description: "Official YMCC VII Vest in a stylish and functional Maroon and Navy color combination. Ideal for committee events or casual wear. Stay comfortable and professional wherever you go.",
    stockPerSize: {
      "S": 0,
      "M": 0,
      "L": 0,
      "XL": 0
    },
    stockAmount: 0,
    sizes: ["S", "M", "L", "XL"]
  });

  await batch.commit();
  console.log("Migration complete!");
}

migrate().catch(console.error);
