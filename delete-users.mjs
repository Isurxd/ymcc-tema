import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ymcc-vii");

async function deleteUsers() {
  const snap = await getDocs(collection(db, "users"));
  let deletedCount = 0;
  
  for (const d of snap.docs) {
    const data = d.data();
    // Protect Superadmin
    if (data.email === "m.fairuzadhimularifin@gmail.com" || data.fullName === "MUHAMMAD FAIRUZ ADHIMUL ARIFIN") {
      console.log("Skipping Superadmin:", d.id);
      continue;
    }
    
    console.log("Deleting User:", d.id, data.fullName);
    await deleteDoc(doc(db, "users", d.id));
    deletedCount++;
  }
  
  console.log(`Successfully deleted ${deletedCount} users.`);
}

deleteUsers().then(() => process.exit(0)).catch(console.error);
