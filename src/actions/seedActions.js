"use server";

import { db } from "@/lib/firebaseAdmin";
import { FEATURED_POST, NEWS_ARTICLES } from "@/data/newsData";

export async function seedDatabase() {
  if (!db) return { success: false, error: "Firebase Admin not initialized" };

  try {
    // 1. Seed News
    const newsBatch = db.batch();
    const newsCollection = db.collection("news");

    // Add Featured Post
    const fpRef = newsCollection.doc();
    newsBatch.set(fpRef, {
      title: FEATURED_POST.title,
      category: FEATURED_POST.category,
      date: FEATURED_POST.date,
      desc: FEATURED_POST.desc,
      content: FEATURED_POST.content,
      imageUrl: FEATURED_POST.image,
      author: "Superadmin",
      createdAt: new Date().toISOString()
    });

    // Add other articles
    NEWS_ARTICLES.forEach(article => {
      const ref = newsCollection.doc();
      newsBatch.set(ref, {
        title: article.title,
        category: article.category,
        date: article.date,
        desc: article.desc,
        content: article.content,
        imageUrl: article.image,
        author: "Superadmin",
        createdAt: new Date().toISOString()
      });
    });

    await newsBatch.commit();

    // 2. Seed FAQs
    const faqs = [
      {
        q: "Can high school students from any region register for the Intellectual Challenge?",
        a: "Yes. The High School tier of the Intellectual Challenge is open nationally across Indonesia. Registrants must submit active Kartu Pelajar (Student ID) for validation."
      },
      {
        q: "Does the Web Exam Engine require a webcam or additional software installations?",
        a: "No additional software installations are required. The Exam Engine runs natively inside your Next.js browser window. However, the system actively monitors focus changes via the Tab Visibility API. Participants are required to join a separate proctoring Zoom session via a second device (smartphone/camera) as an essential secondary verification layer."
      },
      {
        q: "What payment methods are supported by the YMCC VII Platform?",
        a: "Our integration with the Xendit Payment Gateway supports a wide variety of secure payment methods, including Virtual Accounts (VA) from major national banks, QRIS (automatic scanning), and major e-wallets."
      },
      {
        q: "How long does the administrative verification process take?",
        a: "Once you upload your student credentials and registration fees, the Secretariat team executes a manual audit. Verification status updates will be logged on your /dashboard within 1x24 hours."
      },
      {
        q: "Are there additional shipping costs for merchandise delivery?",
        a: "Yes. Shipping costs are dynamically calculated via the Biteship API, which retrieves real-time rates based on parcel weight and your destination postal code. The exact shipping fee is added to your transaction total at the checkout screen."
      }
    ];

    const faqBatch = db.batch();
    const faqCollection = db.collection("faqs");
    faqs.forEach(faq => {
      const ref = faqCollection.doc();
      faqBatch.set(ref, {
        q: faq.q,
        a: faq.a,
        createdAt: new Date().toISOString()
      });
    });

    await faqBatch.commit();

    return { success: true, message: "Database seeded successfully!" };
  } catch (error) {
    console.error("Seeding error:", error);
    return { success: false, error: error.message };
  }
}
