const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');

async function test() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  const db = new Firestore({
    projectId: serviceAccount.project_id,
    databaseId: 'ymcc-vii',
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key
    }
  });

  try {
    const docRef = db.collection('test').doc('test');
    await docRef.set({ test: true });
    console.log("✅ Successfully wrote to ymcc-vii database using raw Firestore SDK!");
  } catch (err) {
    console.error("❌ Failed raw Firestore:", err);
  }
}
test();
