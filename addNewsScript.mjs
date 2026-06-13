import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAN1MraMferwJYveRRxDfyORH8NkChqjpg",
  authDomain: "ymcc-vii.firebaseapp.com",
  projectId: "ymcc-vii",
  storageBucket: "ymcc-vii.firebasestorage.app",
  messagingSenderId: "40431608620",
  appId: "1:40431608620:web:2c56cbed4123bca6428289"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ymcc-vii");

async function injectNews() {
  try {
    const newsCol = collection(db, "news");
    await addDoc(newsCol, {
      title: "YMCC VII Luncurkan Platform Web Canggih Didukung oleh ARC Studio",
      category: "PRESS RELEASES",
      date: new Date().toISOString().split('T')[0],
      desc: "Youth Mining Camp Competition (YMCC) VII secara resmi meluncurkan portal website terbaru yang dilengkapi dengan berbagai fitur interaktif dan Exam Engine canggih, bekerja sama dengan ARC Studio (PT Arsitama Cakrawala Indonesia).",
      content: "Yogyakarta — Menyambut gelaran kompetisi tambang mahasiswa terbesar, Youth Mining Camp Competition (YMCC) VII dengan bangga mengumumkan peluncuran portal website resmi terbaru mereka.\n\nDalam mewujudkan platform digital yang responsif, modern, dan dilengkapi dengan Exam Engine yang proctoring-ready, YMCC VII menjalin kerja sama strategis dengan ARC Studio (arc-indonesia.site) dari PT Arsitama Cakrawala Indonesia.\n\nARC Studio bertindak sebagai Official Technology Partner yang mendesain arsitektur web dari nol menggunakan teknologi mutakhir Next.js dan Firebase. Fitur unggulan dari website ini termasuk portal registrasi dinamis, live dispatch berita, hingga sistem ujian online berkecepatan tinggi yang dirancang khusus untuk menangani ribuan peserta secara real-time.\n\n\"Kolaborasi dengan ARC Studio memastikan bahwa delegasi dari seluruh ASEAN, China, dan Australia mendapatkan pengalaman pengguna (User Experience) kelas dunia yang mencerminkan standar tinggi kompetisi YMCC itu sendiri,\" ungkap perwakilan panitia YMCC VII.\n\nMari sambut masa depan teknologi kompetisi bersama ARC Studio dan YMCC VII!",
      imageUrl: "https://arc-indoensia.site/wp-content/uploads/2024/02/LOGO-ARC-1.png", // Example logo or you can leave blank
      author: "Superadmin",
      createdAt: new Date().toISOString()
    });
    console.log("Success adding ARC Studio news!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

injectNews();
