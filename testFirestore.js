const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-admin-key.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

async function testWrite(dbId) {
  try {
    console.log(`Attempting to write to database: ${dbId}`);
    const db = getFirestore(app, dbId);
    const res = await db.collection("test").add({ timestamp: Date.now() });
    console.log(`Success on ${dbId}! Document written with ID: ${res.id}`);
    return true;
  } catch (error) {
    console.error(`Error on ${dbId}: ${error.message}`);
    return false;
  }
}

async function run() {
  await testWrite("(default)");
  await testWrite("ymcc-vii");
}

run();
