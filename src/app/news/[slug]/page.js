import Image from "next/image";
import FadeInImage from "@/components/FadeInImage";
import ShareButton from "@/components/ShareButton";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import FeedbackWidget from "@/components/FeedbackWidget";

// Metadata Generation for SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  let article = null;
  try {
    // Try to get by document ID first (for legacy links)
    const docRef = doc(db, "news", slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      article = { id: docSnap.id, ...docSnap.data() };
    } else {
      // If not found by ID, query by slug
      const q = query(collection(db, "news"), where("slug", "==", slug));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        article = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
    }
  } catch (error) {
    console.error("Error fetching article for metadata:", error);
  }

  if (!article) {
    return {
      title: "Dispatch Not Found | YMCC VII",
      description: "The requested dispatch or article could not be found.",
    };
  }

  const articleTitle = `${article.title} | YMCC VII Dispatches`;
  const articleDesc = article.desc || article.content?.substring(0, 160) || "Read the latest updates and dispatches from YMCC VII.";

  return {
    title: articleTitle,
    description: articleDesc,
    openGraph: {
      title: articleTitle,
      description: articleDesc,
      url: `https://ymccvii.com/news/${slug}`,
      images: [
        {
          url: article.imageUrl || "https://ymccvii.com/opengraph-image.jpg",
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      type: "article",
      publishedTime: article.createdAt,
      authors: [article.author || "YMCC VII"],
    },
    twitter: {
      card: "summary_large_image",
      title: articleTitle,
      description: articleDesc,
      images: [article.imageUrl || "https://ymccvii.com/opengraph-image.jpg"],
    },
  };
}

export default async function NewsArticleDetail({ params }) {
  const { slug } = await params;
  
  let article = null;
  try {
    // Try to get by document ID first (for legacy links)
    const docRef = doc(db, "news", slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      article = { id: docSnap.id, ...docSnap.data() };
    } else {
      // If not found by ID, query by slug
      const q = query(collection(db, "news"), where("slug", "==", slug));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        article = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
    }
  } catch (error) {
    console.error("Error fetching article:", error);
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
        <h1 className="font-anton text-4xl md:text-6xl mb-4 text-center">404 - DISPATCH NOT FOUND</h1>
        <p className="font-poppins mb-8 text-gray-500">The article you are looking for has been archived or does not exist.</p>
        <Link href="/news">
          <button className="border-2 border-black px-8 py-3 bg-[#c1ff00] font-bold uppercase shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-none transition-all">
            RETURN TO ARCHIVE
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        
        <Link href="/news" className="inline-flex items-center gap-2 font-bold uppercase mb-12 hover:text-[#c1ff00] transition-colors border-2 border-black px-4 py-2 rounded-full shadow-[2px_2px_0_0_#000]">
          ← BACK TO DISPATCHES
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <span className="bg-[#c1ff00] border-2 border-black px-4 py-1 rounded-full text-sm font-bold uppercase">
              {article.category}
            </span>
            <span className="text-gray-600 font-semibold">{article.date}</span>
            <ShareButton title={article.title} />
          </div>
          
          <h1 className="font-anton text-3xl md:text-5xl lg:text-7xl uppercase leading-tight mb-8">
            {article.title}
          </h1>
        </div>

        <div className="relative w-full h-[400px] md:h-[600px] mb-12 border-2 border-black rounded-[2rem] overflow-hidden shadow-[4px_4px_0_0_#000]">
          <FadeInImage 
            src={article.imageUrl || "/EVENTS_COMP/IMG_8741.jpg"}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>

        <div className="prose prose-lg prose-headings:font-anton prose-headings:uppercase max-w-none prose-p:font-poppins prose-p:text-gray-800 prose-p:leading-relaxed prose-a:text-[#c1ff00] prose-a:bg-black prose-a:px-1 prose-a:no-underline hover:prose-a:bg-[#c1ff00] hover:prose-a:text-black hover:prose-a:border-black">
          <ReactMarkdown>{article.content || article.desc}</ReactMarkdown>
        </div>
        
        <hr className="border-t-2 border-black my-16" />
        
        <FeedbackWidget slug={slug} />

      </div>
    </div>
  );
}
