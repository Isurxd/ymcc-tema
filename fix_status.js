const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const envLocal = fs.readFileSync('.env.local', 'utf8');
const saKeyLine = envLocal.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
const rawKey = saKeyLine.substring('FIREBASE_SERVICE_ACCOUNT_KEY='.length).trim();
const key = rawKey.replace(/(^'|'$|^"|"$)/g, '');

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(key)) });
}
const db = getFirestore(getApps()[0], "ymcc-vii");

async function update() {
  await db.collection('merch_orders').doc('TSUkmczgbyLfJRbgNGUt').update({ status: 'PAID' });
  console.log('Fixed status to PAID');
  process.exit(0);
}
update();
