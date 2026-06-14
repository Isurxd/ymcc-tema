import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
if (!getApps().length) {
  try {
    let appConfig = {};
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      appConfig.credential = cert(serviceAccount);
    }
    initializeApp(appConfig);
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const app = getApps()[0];
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

export { db, auth };
