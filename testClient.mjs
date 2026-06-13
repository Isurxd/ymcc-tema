import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAN1MraMferwJYveRRxDfyORH8NkChqjpg",
  authDomain: "ymcc-vii.firebaseapp.com",
  projectId: "ymcc-vii",
  storageBucket: "ymcc-vii.firebasestorage.app",
  messagingSenderId: "40431608620",
  appId: "1:40431608620:web:2c56cbed4123bca6428289"
};

const app = initializeApp(firebaseConfig);

async function testDB(dbId) {
  console.log(`Testing database: ${dbId}`);
  const db = getFirestore(app, dbId);
  try {
    const col = collection(db, "test_collection");
    await getDocs(col);
    console.log(`[SUCCESS] Can read from ${dbId}`);
    return true;
  } catch (err) {
    console.error(`[ERROR] Failed to read from ${dbId}: ${err.message}`);
    return false;
  }
}

async function run() {
  await testDB("(default)");
  await testDB("ymcc-vii");
  process.exit(0);
}

run();
