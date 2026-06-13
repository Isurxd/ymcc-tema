import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
const serviceAccount = require('../../firebase-admin-key.json');

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const app = getApps()[0];
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

export { db, auth };
