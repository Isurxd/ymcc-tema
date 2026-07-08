import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ymcc-vii.firebasestorage.app'
  });
}

const app = getApps()[0];
const db = getFirestore(app, "ymcc-vii");
const bucket = getStorage(app).bucket();

const ASSET_DIR = "C:\\Users\\ASUS\\Documents\\YMCC VII\\ASSET FOTO\\KATALOG YMCC";
const WEARPACK_IMG = path.join(ASSET_DIR, "Wearpack Safety Nav07", "DSC02482.jpg");
const VEST_IMG = path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "DSC02142.jpg");
const BANNER_IMG = path.join(ASSET_DIR, "Foto Katalog Group 4person", "Salinan A615A50D-7C89-4EEE-9CE1-182AFF7FD45D.jpeg");

async function processAndUploadImage(localPath, destinationPath) {
  console.log(`Processing ${localPath}...`);
  const compressedBuffer = await sharp(localPath)
    .resize({ width: 1080, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  
  const file = bucket.file(destinationPath);
  await file.save(compressedBuffer, {
    metadata: { contentType: 'image/webp' },
    public: true
  });
  
  // Make public
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
  console.log(`Uploaded to ${publicUrl}`);
  return publicUrl;
}

async function wipeDatabase() {
  console.log("Starting Global Wipe...");
  const collections = await db.listCollections();
  
  for (const collection of collections) {
    const colName = collection.id;
    let wiped = 0;
    
    const snap = await collection.get();
    const batch = db.batch();
    
    snap.forEach(doc => {
      const docId = doc.id;
      // Wipe completely for these 3 collections
      if (['merchandise', 'Orders', 'merch_orders'].includes(colName)) {
        batch.delete(doc.ref);
        wiped++;
      } 
      // Wipe only dummy data for others
      else if (docId.includes('dummy')) {
        batch.delete(doc.ref);
        wiped++;
      }
    });
    
    if (wiped > 0) {
      await batch.commit();
      console.log(`Wiped ${wiped} documents from ${colName}`);
    }
  }
}

async function seedDatabase(wearpackUrl, vestUrl, bannerUrl) {
  console.log("Seeding Merchandise...");
  
  const wearpackRef = db.collection('merchandise').doc('wearpack-official');
  await wearpackRef.set({
    name: "YMCC VII Official Wearpack",
    category: "APPAREL",
    price: "Rp 270.000",
    priceNumber: 270000,
    stockType: "STOCK",
    stockAmount: 1, // Wearpack sisa 1 ukuran M
    sizes: ["M"],   // Only M available
    image: wearpackUrl,
    weight: 1000,
    description: "Official Wearpack YMCC VII dengan desain eksklusif, kuat, dan nyaman. Cocok digunakan untuk kegiatan lapangan, praktikum, maupun aktivitas luar ruangan lainnya. Dilengkapi dengan reflective tape untuk keamanan. Sisa ukuran M saja, sangat terbatas!",
    createdAt: new Date()
  });

  const vestRef = db.collection('merchandise').doc('vest-official');
  await vestRef.set({
    name: "YMCC VII Official Vest",
    category: "APPAREL",
    price: "Rp 150.000",
    priceNumber: 150000,
    stockType: "STOCK",
    stockAmount: 0, // Vest habis
    sizes: [],      // Habis
    image: vestUrl,
    weight: 500,
    description: "Vest Official YMCC VII berwarna kombinasi Maroon dan Navy yang stylish dan fungsional. Sangat cocok dipakai di acara kepanitiaan atau acara santai. Sayangnya, produk ini telah habis terjual (Out of Stock).",
    createdAt: new Date()
  });

  console.log("Seeding Banner...");
  const bannerRef = db.collection('merch_banners').doc('main-catalog-banner');
  await bannerRef.set({
    image: bannerUrl,
    linkUrl: "?id=wearpack-official",
    title: "Katalog Resmi YMCC VII",
    active: true,
    createdAt: new Date()
  });

  console.log("Seeding Complete!");
}

async function run() {
  try {
    await wipeDatabase();
    const wearpackUrl = await processAndUploadImage(WEARPACK_IMG, 'merch/wearpack.webp');
    const vestUrl = await processAndUploadImage(VEST_IMG, 'merch/vest.webp');
    const bannerUrl = await processAndUploadImage(BANNER_IMG, 'merch/banner.webp');
    await seedDatabase(wearpackUrl, vestUrl, bannerUrl);
    console.log("All tasks completed successfully.");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
