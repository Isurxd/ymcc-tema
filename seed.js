const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-admin-key.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(); // default database

async function seed() {
  const products = [
    {
      name: "YMCC VII Safety Vest",
      tagline: "High-Visibility Premium Vest",
      description: "Official Safety Vest for YMCC VII delegates.",
      category: "SAFETY WEAR",
      price: "150K",
      priceNumber: 150000,
      image: "/merch/VEST_DSC01482.jpg",
      additionalImages: ["/merch/VEST_DSC01750.jpg", "/merch/VEST_DSC02132.jpg"],
      stockType: "READY",
      stockAmount: 100,
      weight: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      name: "YMCC VII Official Wearpack",
      tagline: "Premium Field Wearpack",
      description: "Official Wearpack for YMCC VII field activities.",
      category: "APPAREL",
      price: "250K",
      priceNumber: 250000,
      image: "/merch/WEARPACK_DSC01632.jpg",
      additionalImages: ["/merch/WEARPACK_DSC02146.jpg", "/merch/WEARPACK_DSC02316.jpg"],
      stockType: "PO",
      stockAmount: 50,
      weight: 800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const p of products) {
    await db.collection('merchandise').add(p);
  }
  console.log("Seeding complete");
}

seed().catch(console.error);
