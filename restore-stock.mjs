import { db } from './src/lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

async function restoreStock() {
  console.log("Checking Orders...");
  const snapshot = await db.collection('Orders').where('status', '==', 'PENDING_PAYMENT').get();
  console.log(`Found ${snapshot.docs.length} pending orders`);
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.items) {
      for (const item of data.items) {
        if (item.productId) {
          console.log(`Restoring ${item.quantity} for ${item.name} (${item.size})`);
          if (item.size) {
            await db.collection('merchandise').doc(item.productId).update({
              [`stockPerSize.${item.size}`]: FieldValue.increment(item.quantity)
            });
          } else {
            await db.collection('merchandise').doc(item.productId).update({
              stockAmount: FieldValue.increment(item.quantity)
            });
          }
        }
      }
    }
    await doc.ref.update({ status: 'EXPIRED' });
  }
  console.log("Done");
  process.exit(0);
}
restoreStock();
