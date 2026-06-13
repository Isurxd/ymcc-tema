import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAN1MraMferwJYveRRxDfyORH8NkChqjpg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ymcc-vii.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ymcc-vii",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ymcc-vii");
const dbDefault = getFirestore(app);

async function test() {
  try {
    console.log("Testing read on ymcc-vii...");
    const snap = await getDoc(doc(db, "staff_applications", "test"));
    console.log("ymcc-vii Read Success!", snap.exists());
  } catch(e) {
    console.error("ymcc-vii Read Failed:", e.message);
  }

  try {
    console.log("Testing read on (default)...");
    const snap = await getDoc(doc(dbDefault, "staff_applications", "test"));
    console.log("(default) Read Success!", snap.exists());
  } catch(e) {
    console.error("(default) Read Failed:", e.message);
  }
  process.exit(0);
}

test();
