"use server";

import { db } from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";

// --- FAQ ACTIONS ---
export async function getFaqs() {
  if (!db) return [];
  try {
    const snapshot = await db.collection("faqs").orderBy("createdAt", "asc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}

export async function addFaq(question, answer) {
  if (!db) throw new Error("Firebase Admin not initialized");
  try {
    await db.collection("faqs").add({
      q: question,
      a: answer,
      createdAt: new Date().toISOString()
    });
    revalidatePath("/operator");
    revalidatePath("/contact");
    return { success: true };
  } catch (error) {
    console.error("Error adding FAQ:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteFaq(id) {
  if (!db) throw new Error("Firebase Admin not initialized");
  try {
    await db.collection("faqs").doc(id).delete();
    revalidatePath("/operator");
    revalidatePath("/contact");
    return { success: true };
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return { success: false, error: error.message };
  }
}

// --- SPONSOR ACTIONS ---
export async function getSponsors() {
  if (!db) return [];
  try {
    const snapshot = await db.collection("sponsors").orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return [];
  }
}

export async function addSponsor(name, tier, imageUrl) {
  if (!db) throw new Error("Firebase Admin not initialized");
  try {
    await db.collection("sponsors").add({
      name,
      tier,
      imageUrl: imageUrl || "/LOGO YMCC RASIO 1X1.png", // fallback
      createdAt: new Date().toISOString()
    });
    revalidatePath("/operator");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding sponsor:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSponsor(id) {
  if (!db) throw new Error("Firebase Admin not initialized");
  try {
    await db.collection("sponsors").doc(id).delete();
    revalidatePath("/operator");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    return { success: false, error: error.message };
  }
}

// --- NEWS ACTIONS ---
export async function getNews() {
  if (!db) return [];
  try {
    const snapshot = await db.collection("news").orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export async function addNews(title, category, content, author, imageUrl) {
  if (!db) throw new Error("Firebase Admin not initialized");
  try {
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    await db.collection("news").add({
      title,
      category: category || "NEWS",
      content,
      desc: content.substring(0, 150) + "...", // Auto-generate description
      author,
      imageUrl: imageUrl || "/EVENTS_COMP/IMG_8741.jpg", // fallback
      date,
      createdAt: new Date().toISOString()
    });
    revalidatePath("/operator");
    revalidatePath("/news");
    return { success: true };
  } catch (error) {
    console.error("Error adding news:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteNews(id) {
  if (!db) throw new Error("Firebase Admin not initialized");
  try {
    await db.collection("news").doc(id).delete();
    revalidatePath("/operator");
    revalidatePath("/news");
    return { success: true };
  } catch (error) {
    console.error("Error deleting news:", error);
    return { success: false, error: error.message };
  }
}

// --- OPERATOR MANAGEMENT ACTIONS ---
export async function getOperators() {
  if (!db) return [];
  try {
    const snapshot = await db.collection("operators").orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching operators:", error);
    return [];
  }
}

export async function addOperator(email, password) {
  if (!db) throw new Error("Firebase Admin not initialized");
  try {
    await db.collection("operators").add({
      email,
      password, // Note: In production, never store plaintext passwords. Use Firebase Auth instead.
      createdAt: new Date().toISOString()
    });
    revalidatePath("/operator");
    return { success: true };
  } catch (error) {
    console.error("Error adding operator:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteOperator(id) {
  if (!db) throw new Error("Firebase Admin not initialized");
  try {
    await db.collection("operators").doc(id).delete();
    revalidatePath("/operator");
    return { success: true };
  } catch (error) {
    console.error("Error deleting operator:", error);
    return { success: false, error: error.message };
  }
}
