const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const envLocal = fs.readFileSync('.env.local', 'utf8');
const saKeyLine = envLocal.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
const key = saKeyLine.substring('FIREBASE_SERVICE_ACCOUNT_KEY='.length).trim().replace(/(^'|'$|^"|"$)/g, '');
if (!getApps().length) { initializeApp({ credential: cert(JSON.parse(key)) }); }
const db = getFirestore(getApps()[0], 'ymcc-vii');
db.collection('merch_orders').doc('TSUkmczgbyLfJRbgNGUt').update({
  orderStatus: 'SHIPPED',
  'shippingDetails.trackingNumber': 'JNT-1234567890',
  'shippingDetails.courier': 'J&T EXPRESS'
}).then(() => {
  console.log("Order set to SHIPPED");
  process.exit(0);
});
