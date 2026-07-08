import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert(require('./firebase-service-account.json')) // Wait, I don't have this json here!
  });
}
