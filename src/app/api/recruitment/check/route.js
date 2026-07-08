import { NextResponse } from 'next/server';
import { db } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { nim, email } = await req.json();

    if (!nim || !email) {
      return NextResponse.json({ error: "Student ID (NIM) and Email are required." }, { status: 400 });
    }

    // Since we're using admin SDK, we can query safely without rules.
    const snapshot = await db.collection("recruitment_submissions")
      .where("nim", "==", nim)
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Applicant data not found. Please ensure your Student ID (NIM) and Email match your application details." }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // To prevent scraping other people's data, we only return what is needed.
    return NextResponse.json({
      success: true,
      result: {
        fullName: data.fullName,
        nim: data.nim,
        status: data.status || "PENDING_REVIEW",
        acceptedDivision: data.acceptedDivision || ""
      }
    });

  } catch (error) {
    console.error("Recruitment Check API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
