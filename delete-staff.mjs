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

async function deleteStaff() {
  const snap = await getDocs(collection(db, "staff_applications"));
  let deletedCount = 0;
  
  for (const d of snap.docs) {
    const data = d.data();
    // Protect Superadmin
    if (data.email === "m.fairuzadhimularifin@gmail.com" || d.id === "m.fairuzadhimularifin@gmail.com") {
      console.log("Skipping Superadmin:", d.id);
      continue;
    }
    
    console.log("Deleting Staff:", d.id, data.name || data.email);
    await deleteDoc(doc(db, "staff_applications", d.id));
    deletedCount++;
  }
  
  console.log(`Successfully deleted ${deletedCount} staff applications.`);
}

deleteStaff().then(() => process.exit(0)).catch(console.error);
