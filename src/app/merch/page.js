import { db } from "@/lib/firebaseAdmin";
import MerchClient from "@/components/merch/MerchClient";

// 1. Generate Metadata dynamically based on searchParams
export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams; // Next.js 15+ searchParams is a Promise
  
  if (!id) {
    return {
      title: "Merchandise | YMCC VII",
      description: "Equip yourself with the official, premium-grade apparel of YMCC VII. Built for the modern earth science professional.",
      openGraph: {
        title: "Merchandise | YMCC VII",
        description: "Equip yourself with the official, premium-grade apparel of YMCC VII.",
        url: "https://ymccvii.com/merch",
      }
    };
  }

  try {
    const docRef = db.collection("merchandise").doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const product = docSnap.data();
      const title = `${product.name} | YMCC VII Merchandise`;
      const desc = product.description || "Equip yourself with the official YMCC VII apparel.";
      
      return {
        title: title,
        description: desc,
        openGraph: {
          title: title,
          description: desc,
          url: `https://ymccvii.com/merch?id=${id}`,
          images: [
            {
              url: product.image,
              width: 1080,
              height: 1080,
              alt: product.name,
            }
          ]
        }
      };
    }
  } catch (err) {
    console.error("Error fetching merch metadata:", err);
  }

  // Fallback if product not found
  return {
    title: "Merchandise | YMCC VII",
  };
}

// 2. Server Component rendering the Client Component
export default async function MerchShopPage({ searchParams }) {
  // We can pass the initial ID to the client if needed, or let client read URL directly
  // The client uses useSearchParams so it will read the URL automatically.
  return <MerchClient />;
}
