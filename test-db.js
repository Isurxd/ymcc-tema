const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

const app = initializeApp({
  credential: cert(serviceAccount)
});

async function testDb(dbId) {
  try {
    const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    console.log(`Testing database: ${dbId || '(default)'}...`);
    // Try to list collections, which requires read access
    const collections = await db.listCollections();
    console.log(`✅ Success accessing database: ${dbId || '(default)'}. Collections: ${collections.length}`);
    return true;
  } catch (err) {
    console.log(`❌ Failed to access database ${dbId || '(default)'}: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log("Starting DB tests...");
  await testDb(''); // Test (default)
  await testDb('ymcc-vii'); // Test named db
}

runTests();
