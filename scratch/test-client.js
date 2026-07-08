import { initializeApp as adminInitApp, cert } from 'firebase-admin/app';
import { getAuth as adminGetAuth } from 'firebase-admin/auth';
import { initializeApp as clientInitApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import fetch from 'node-fetch';

// Polyfill fetch for Firebase Client SDK in Node
global.fetch = fetch;

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
const serviceAccount = JSON.parse(match[1]);

adminInitApp({ credential: cert(serviceAccount) });

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAN1MraMferwJYveRRxDfyORH8NkChqjpg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ymcc-vii.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ymcc-vii",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ymcc-vii.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "40431608620",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:40431608620:web:2c56cbed4123bca6428289"
};

const clientApp = clientInitApp(clientConfig);
const clientAuth = getAuth(clientApp);
const db = getFirestore(clientApp);

const collectionsToCheck = [
  'audit_logs', 'users', 'broadcasts', 'competition_documents',
  'merchandise', 'merch_orders', 'merch_banners', 'promos',
  'affiliate_applications', 'payout_requests', 'staff_applications',
  'subscribers', 'newsFeedback', 'activityClicks', 'news', 'faqs',
  'sponsors', 'activities', 'tickets'
];

async function runTest() {
  try {
    // We need the UID of m.fairuzadhimularifin@gmail.com
    const userRecord = await adminGetAuth().getUserByEmail('m.fairuzadhimularifin@gmail.com');
    const customToken = await adminGetAuth().createCustomToken(userRecord.uid);
    
    await signInWithCustomToken(clientAuth, customToken);
    console.log("Signed in successfully as client!");

    for (const collName of collectionsToCheck) {
      try {
        await getDocs(collection(db, collName));
        console.log(`[OK] ${collName}`);
      } catch (e) {
        console.log(`[FAIL] ${collName}: ${e.message}`);
      }
    }
    process.exit(0);
  } catch (e) {
    console.error("Test failed:", e);
    process.exit(1);
  }
}

runTest();
