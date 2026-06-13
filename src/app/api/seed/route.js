import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
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

    let added = 0;
    for (const p of products) {
      await db.collection("merchandise").add(p);
      added++;
    }

    return NextResponse.json({ success: true, added });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
