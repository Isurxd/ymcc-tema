import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
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

// Helper to compress and upload
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
  
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
  console.log(`Uploaded to ${publicUrl}`);
  return publicUrl;
}

async function run() {
  try {
    console.log("Starting Multiple Image Upload...");

    // 1. Process Wearpack Images
    const wearpackImg1 = await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "DSC02482.jpg"), 'merch/wearpack_1.webp');
    const wearpackImg2 = await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "DSC02461.jpg"), 'merch/wearpack_2.webp');
    const wearpackImg3 = await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "DSC02468.jpg"), 'merch/wearpack_3.webp');
    const wearpackImg4 = await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "DSC02463.jpg"), 'merch/wearpack_4.webp');

    // 2. Process Vest Images
    const vestImg1 = await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "DSC02142.jpg"), 'merch/vest_1.webp');
    const vestImg2 = await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "DSC02137.jpg"), 'merch/vest_2.webp');
    const vestImg3 = await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "DSC02123.jpg"), 'merch/vest_3.webp');
    const vestImg4 = await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "DSC02132.jpg"), 'merch/vest_4.webp');

    // 3. Process Banner Images
    const bannerImg1 = await processAndUploadImage(path.join(ASSET_DIR, "Foto Katalog Group 4person", "Salinan A615A50D-7C89-4EEE-9CE1-182AFF7FD45D.jpeg"), 'merch/banner_main.webp');
    const bannerImg2 = await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "DSC02466.jpg"), 'merch/banner_2.webp');
    const bannerImg3 = await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "DSC02139.jpg"), 'merch/banner_3.webp');

    // Update Merchandise
    console.log("Updating Merchandise...");
    const wearpackRef = db.collection('merchandise').doc('wearpack-official');
    await wearpackRef.set({
      name: "YMCC VII Official Wearpack",
      category: "APPAREL",
      price: "Rp 270.000",
      priceNumber: 270000,
      stockType: "STOCK",
      stockAmount: 1, // Wearpack sisa 1 ukuran M
      sizes: ["M"],
      image: wearpackImg1,
      additionalImages: [wearpackImg2, wearpackImg3, wearpackImg4],
      weight: 1000,
      description: "Official Wearpack YMCC VII dengan desain eksklusif, kuat, dan nyaman. Cocok digunakan untuk kegiatan lapangan, praktikum, maupun aktivitas luar ruangan lainnya. Dilengkapi dengan reflective tape untuk keamanan. Sisa ukuran M saja, sangat terbatas!",
      createdAt: new Date() // Keeping it simple
    }, { merge: true });

    const vestRef = db.collection('merchandise').doc('vest-official');
    await vestRef.set({
      name: "YMCC VII Official Vest",
      category: "APPAREL",
      price: "Rp 150.000",
      priceNumber: 150000,
      stockType: "STOCK",
      stockAmount: 0, // Vest habis
      sizes: [],
      image: vestImg1,
      additionalImages: [vestImg2, vestImg3, vestImg4],
      weight: 500,
      description: "Vest Official YMCC VII berwarna kombinasi Maroon dan Navy yang stylish dan fungsional. Sangat cocok dipakai di acara kepanitiaan atau acara santai. Sayangnya, produk ini telah habis terjual (Out of Stock).",
      createdAt: new Date()
    }, { merge: true });

    // Update Banners
    console.log("Updating Banners...");
    
    // Clear existing banners
    const existingBanners = await db.collection('merch_banners').get();
    const batch = db.batch();
    existingBanners.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Add 3 new banners
    await db.collection('merch_banners').doc('banner-1').set({
      image: bannerImg1,
      linkUrl: "?id=wearpack-official",
      title: "Katalog Resmi YMCC VII",
      active: true,
      createdAt: new Date(Date.now() - 3000)
    });

    await db.collection('merch_banners').doc('banner-2').set({
      image: wearpackImg3,
      linkUrl: "?id=wearpack-official",
      title: "Wearpack Exclusive",
      active: true,
      createdAt: new Date(Date.now() - 2000)
    });

    await db.collection('merch_banners').doc('banner-3').set({
      image: bannerImg3,
      linkUrl: "?id=vest-official",
      title: "Vest YMCC VII",
      active: true,
      createdAt: new Date(Date.now() - 1000)
    });

    console.log("All tasks completed successfully.");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
