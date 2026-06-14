import { NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];

    if (!auth) return NextResponse.json({ error: "Admin auth not initialized" }, { status: 500 });
    try {
      await auth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    // Fetch user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Delete user
    await auth.deleteUser(userRecord.uid);
    
    return NextResponse.json({ success: true, message: "User auth deleted" });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // It's okay if user doesn't exist in auth, maybe they only existed in firestore
      return NextResponse.json({ success: true, message: "User not found in auth, but that is fine" });
    }
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
