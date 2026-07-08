import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import path from 'path';
import sharp from 'sharp';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    console.log("Starting Multiple Image Upload (ALL GJX)...");

    // 1. Wearpack Images (GJX) - All 6
    const wearpackImages = [
      await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "GJX DSC01632.jpg"), 'merch/wearpack_gjx_1.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "GJX Salinan 1D7C383C-FFA8-4177-8436-1BA0D0653778.jpeg"), 'merch/wearpack_gjx_2.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "GJX Salinan 3F1F5F5A-DA18-4B76-AB4D-87FAE1FF6942.jpeg"), 'merch/wearpack_gjx_3.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "GJX Salinan 4B704216-9E6A-432B-B44F-FC88BA5A93A3.jpeg"), 'merch/wearpack_gjx_4.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "GJX Salinan 6A9B9B3D-38CB-4D81-BE51-78022B6DF33E.jpeg"), 'merch/wearpack_gjx_5.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Wearpack Safety Nav07", "GJX Salinan E12C5322-FA66-41E5-86C0-30EBD3F24FB9.jpeg"), 'merch/wearpack_gjx_6.webp')
    ];

    // 2. Vest Images (GJX) - All 5
    const vestImages = [
      await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "GJX DSC01643.jpg"), 'merch/vest_gjx_1.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "GJX Salinan 0A119E1A-DBFC-4465-9D0E-0AD122878C58.jpeg"), 'merch/vest_gjx_2.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "GJX Salinan 2EB458B5-929A-4F0C-B31A-BB71E47C73E4.jpeg"), 'merch/vest_gjx_3.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "GJX Salinan 5F6D01B1-4C5C-4FFA-B5B2-6ACC4073AE50.jpeg"), 'merch/vest_gjx_4.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Vest Nav07 MaroonBlue", "GJX Salinan 8A2DED1E-5488-4E2D-8230-1801C290EF83.jpeg"), 'merch/vest_gjx_5.webp')
    ];

    // 3. Banner Images (GJX Group Photos) - All 6
    const bannerImages = [
      await processAndUploadImage(path.join(ASSET_DIR, "Foto Katalog Group 2 Person", "GJX Salinan 22CC3AFF-C33F-4CC2-88CC-2EAA62A4BFD5(1).jpeg"), 'merch/banner_gjx_1.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Foto Katalog Group 2 Person", "GJX Salinan 2BFC70F6-2B32-4FC2-8AC2-EA903C78D464.jpeg"), 'merch/banner_gjx_2.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Foto Katalog Group 4person", "GJX 6E4CBDFA-040A-46B7-91BD-80563430190F.jpg"), 'merch/banner_gjx_3.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Foto Katalog Group 4person", "GJX Salinan 9638B44C-F9B9-40F0-AC76-16938E3F1759.jpeg"), 'merch/banner_gjx_4.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Foto Katalog Group 4person", "GJX Salinan A615A50D-7C89-4EEE-9CE1-182AFF7FD45D.jpeg"), 'merch/banner_gjx_5.webp'),
      await processAndUploadImage(path.join(ASSET_DIR, "Foto Katalog Group 4person", "GJX Salinan E4D64185-0757-4146-B7BC-E9AEA0E14C4C.jpeg"), 'merch/banner_gjx_6.webp')
    ];

    // Update Merchandise
    console.log("Updating Merchandise...");
    const wearpackRef = db.collection('merchandise').doc('wearpack-official');
    await wearpackRef.set({
      image: wearpackImages[0],
      additionalImages: wearpackImages.slice(1)
    }, { merge: true });

    const vestRef = db.collection('merchandise').doc('vest-official');
    await vestRef.set({
      image: vestImages[0],
      additionalImages: vestImages.slice(1)
    }, { merge: true });

    // Update Banners
    console.log("Updating Banners...");
    
    // Clear existing banners
    const existingBanners = await db.collection('merch_banners').get();
    const batch = db.batch();
    existingBanners.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Add 6 new unclickable banners
    for (let i = 0; i < bannerImages.length; i++) {
      await db.collection('merch_banners').doc(`banner-gjx-${i+1}`).set({
        image: bannerImages[i],
        linkUrl: "",
        title: `YMCC VII Catalog ${i+1}`,
        active: true,
        createdAt: new Date(Date.now() - (1000 * (6 - i)))
      });
    }

    console.log("All tasks completed successfully.");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
