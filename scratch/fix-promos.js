import admin from "firebase-admin";
import fs from "fs";

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
const saKey = JSON.parse(match[1].replace(/\\n/g, '\n'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(saKey)
  });
}

const db = admin.firestore();

async function fixPromos() {
  const snapshot = await db.collection('promos').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let needsUpdate = false;
    let updates = {};

    if (isNaN(data.value) && isNaN(data.discount)) {
      // If it's NaN, just set to a safe default like 15 for percent, or 10000 for fixed
      updates.discount = data.discountType === "PERCENT" ? 15 : 10000;
      updates.value = admin.firestore.FieldValue.delete();
      needsUpdate = true;
    } else if (data.value && !data.discount) {
      updates.discount = data.value;
      updates.value = admin.firestore.FieldValue.delete();
      needsUpdate = true;
    }

    if (!data.discountType) {
      updates.discountType = "PERCENT";
      needsUpdate = true;
    }

    if (needsUpdate) {
      await doc.ref.update(updates);
      console.log(`Updated promo ${doc.id} (${data.code})`);
      count++;
    }
  }
  console.log(`Fixed ${count} promos.`);
}

fixPromos().then(() => process.exit(0)).catch(console.error);
