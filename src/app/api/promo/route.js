import { NextResponse } from "next/server";
import { db as dbAdmin } from "@/lib/firebaseAdmin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const promosSnap = await dbAdmin.collection("promos").where("code", "==", code.toUpperCase()).get();
    
    if (promosSnap.empty) {
      return NextResponse.json({ promo: null });
    }

    const doc = promosSnap.docs[0];
    const data = doc.data();
    
    if (data.isActive === false) {
      return NextResponse.json({ promo: null });
    }

    return NextResponse.json({ promo: { id: doc.id, ...data } });

  } catch (error) {
    console.error("Promo API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
