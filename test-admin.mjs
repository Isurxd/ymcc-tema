import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./firebase-admin-key.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

async function run() {
  try {
    const defaultDb = getFirestore();
    console.log("Trying (default)...");
    await defaultDb.collection("test").doc("ping").set({ time: Date.now() });
    console.log("(default) Success!");
  } catch(e) {
    console.error("(default) Failed:", e.message);
  }

  try {
    const namedDb = getFirestore(app, "ymcc-vii");
    console.log("Trying ymcc-vii...");
    await namedDb.collection("test").doc("ping").set({ time: Date.now() });
    console.log("ymcc-vii Success!");
  } catch(e) {
    console.error("ymcc-vii Failed:", e.message);
  }
}

run();
