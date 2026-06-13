import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  // TODO: Replace with your actual Firebase config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, inMemoryPersistence } from "firebase/auth";

// Initialize Firebase only if API Key is provided
const app = firebaseConfig.apiKey && !getApps().length 
  ? initializeApp(firebaseConfig) 
  : firebaseConfig.apiKey ? getApp() : null;

const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "ymcc-vii";
const db = app ? getFirestore(app, dbId) : null;
const storage = app ? getStorage(app) : null;
const auth = app ? getAuth(app) : null;

// Secondary app for manual user registration without logging out current user
let secondaryApp = null;
let secondaryAuth = null;
if (firebaseConfig.apiKey) {
  try {
    secondaryApp = initializeApp(firebaseConfig, "Secondary");
    secondaryAuth = getAuth(secondaryApp);
    setPersistence(secondaryAuth, inMemoryPersistence).catch(console.error);
  } catch (err) {
    secondaryApp = getApp("Secondary");
    secondaryAuth = getAuth(secondaryApp);
    setPersistence(secondaryAuth, inMemoryPersistence).catch(console.error);
  }
}

export { app, db, storage, auth, secondaryAuth };
export default app;
