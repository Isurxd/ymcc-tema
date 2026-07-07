const { initializeApp } = require("firebase/app");
const { getFirestore, writeBatch, doc, collection } = require("firebase/firestore");

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

async function seedSubmissions() {
  console.log("Seeding dummy submissions data using Client SDK...");

  try {
    const batch = writeBatch(db);
    const subRef = collection(db, 'competition_documents');

    for (let i = 1; i <= 15; i++) {
      batch.set(doc(subRef, `dummy_submission_${i}`), {
        teamName: `Dummy Team ${i}`,
        studentId: `STD${i}00000`,
        competitionType: i % 2 === 0 ? "BCC" : "PAPER",
        documentUrl: "https://example.com/document.pdf",
        status: i % 3 === 0 ? "GRADED" : "PENDING",
        grade: i % 3 === 0 ? 85 + i : null,
        submittedAt: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
        email: `participant${i}@dummy.com`
      });
    }

    await batch.commit();
    
    console.log("✅ Dummy submissions seeded successfully via Client SDK!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding submissions:", error);
    process.exit(1);
  }
}

seedSubmissions();
