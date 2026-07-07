"use client";

import Image from "next/image";
import FadeInImage from "@/components/FadeInImage";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function NewsArticles() {
  const [activeFilter, setActiveFilter] = useState("ALL DISPATCHES");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const filters = ["ALL DISPATCHES", "ANNOUNCEMENTS", "TECHNICAL", "PRESS RELEASES"];

  useEffect(() => {
    const fetchNews = async () => {
      const unsub = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), (snap) => {
        setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(a => !a.status || a.status === "PUBLISHED"));
        setLoading(false);
      });
      return () => unsub();
    };
    fetchNews();
  }, []);

  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState(""); // "", "loading", "success", "error"

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribeStatus("loading");
    try {
      const { addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "subscribers"), { 
        email, 
        subscribedAt: new Date().toISOString() 
      });
      setSubscribeStatus("success");
      setEmail("");
    } catch (err) {
      console.error(err);
      setSubscribeStatus("error");
    }
  };

  // First article is featured if there's any
  const featuredPost = articles.length > 0 ? articles[0] : null;
  // Use all articles for the grid so it doesn't look empty
  const otherArticles = articles;

  // Filter regular articles
  const filteredArticles = activeFilter === "ALL DISPATCHES" 
    ? otherArticles 
    : otherArticles.filter(a => (a.category || "").toUpperCase().includes(activeFilter.replace(/S$/, "")));

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-24">
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12 text-center">
        <h1 className="font-anton text-3xl md:text-5xl lg:text-7xl uppercase tracking-wider mb-6">
          THE LATEST OPERATIONS
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-800">
          Get in touch with our official media and support center for immediate assistance regarding registration, technical issues, and general competition guidelines.
        </p>
      </div>

      {/* FEATURED POST */}
      <div className="max-w-6xl mx-auto px-6 mb-20">
        {loading ? (
          <div className="h-96 w-full border-2 border-black rounded-[2rem] bg-gray-100 animate-pulse flex items-center justify-center shadow-[4px_4px_0_0_#000]">
            <p className="font-poppins font-bold text-gray-500">Loading Featured Dispatch...</p>
          </div>
        ) : featuredPost ? (
          <div className="flex flex-col md:flex-row border-2 border-black rounded-[2rem] overflow-hidden shadow-[4px_4px_0_0_#000] bg-white">
            {/* Image */}
            <div className="md:w-1/2 h-80 md:h-auto relative border-b-[3px] md:border-b-0 md:border-r-[3px] border-black">
              {featuredPost.imageUrl && (
                <FadeInImage 
                  src={featuredPost.imageUrl}
                  alt={featuredPost.title}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              )}
            </div>
            {/* Content */}
            <div className="md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-[#c1ff00] border-2 border-black px-4 py-1 rounded-full text-sm font-bold">
                  {featuredPost.category}
                </span>
                <span className="text-gray-600 font-semibold">{featuredPost.date}</span>
              </div>
              <h2 className="font-anton text-2xl md:text-3xl lg:text-5xl uppercase leading-tight mb-6">
                {featuredPost.title}
              </h2>
              <p className="text-lg text-gray-800 mb-8 leading-relaxed">
                {featuredPost.desc}
              </p>
              <div>
                <Link href={`/news/${featuredPost.slug || featuredPost.id}`}>
                  <button className="bg-black text-white px-8 py-3 rounded-full font-bold uppercase hover:bg-[#c1ff00] hover:text-black hover:border-2 hover:border-black transition-colors">
                    READ FULL REPORT
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 w-full border-2 border-black rounded-[2rem] bg-white flex items-center justify-center shadow-[4px_4px_0_0_#000]">
            <p className="font-poppins font-bold text-gray-500">No dispatches available.</p>
          </div>
        )}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="relative mb-6">
          <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search dispatches..." 
            className="w-full border-2 border-black rounded-full py-4 pl-16 pr-6 text-lg outline-none focus:bg-gray-50 transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-full font-bold border-2 border-black transition-colors ${
                activeFilter === filter 
                  ? "bg-black text-white" 
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <hr className="border-t-[3px] border-black" />
      </div>

      {/* NEWS GRID */}
      <div className="max-w-6xl mx-auto px-6 mb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 border-2 border-black rounded-3xl bg-gray-100 animate-pulse shadow-[4px_4px_0_0_#000]"></div>
            ))}
          </>
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <div key={article.id} className="border-2 border-black rounded-3xl overflow-hidden bg-white shadow-[4px_4px_0_0_#000] flex flex-col">
              <div className="h-56 relative border-b-[3px] border-black">
                {article.imageUrl && (
                  <FadeInImage 
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="border-2 border-black rounded-full px-3 py-1 text-xs font-bold uppercase">
                    {article.category}
                  </span>
                  <span className="text-sm font-semibold text-gray-600">{article.date}</span>
                </div>
                <h3 className="font-anton text-xl md:text-2xl uppercase mb-4 leading-snug line-clamp-3">
                  {article.title}
                </h3>
                <p className="text-gray-700 flex-grow mb-6 line-clamp-4">
                  {article.desc}
                </p>
                <Link href={`/news/${article.slug || article.id}`} className="font-bold uppercase tracking-wide hover:text-[#c1ff00] transition-colors flex items-center gap-2">
                  READ DISPATCH <span className="text-xl">→</span>
                </Link>
              </div>
            </div>
          ))
        ) : !loading && (
          <div className="col-span-full text-center py-12">
            <p className="font-poppins text-xl text-gray-500">No dispatches match the selected filter.</p>
          </div>
        )}
      </div>

      {/* SUBSCRIBE BLOCK */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="bg-[#c1ff00] border-2 border-black rounded-[3rem] p-6 md:p-16 shadow-[12px_12px_0_0_#000] flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="md:w-1/2">
            <span className="bg-white border-2 border-black px-6 py-2 rounded-full text-sm font-bold inline-block mb-6">
              STAY INFORMED
            </span>
            <h2 className="font-anton text-3xl md:text-5xl lg:text-7xl uppercase leading-none mb-6">
              SUBSCRIBE TO THE DISPATCH
            </h2>
            <p className="text-xl font-medium">
              Get the latest intelligence on competition guidelines, rulebook updates, and earth science engineering trends delivered directly to your inbox.
            </p>
          </div>
          <div className="md:w-1/2 w-full flex flex-col items-end justify-center">
            <form onSubmit={handleSubscribe} className="w-full flex flex-col sm:flex-row gap-4 mb-4">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..." 
                className="flex-grow border-2 border-black rounded-full py-4 px-6 text-lg outline-none"
                required
              />
              <button 
                type="submit" 
                disabled={subscribeStatus === "loading"}
                className="bg-black text-white px-10 py-4 rounded-full font-bold uppercase text-lg hover:bg-white hover:text-black hover:border-2 hover:border-black transition-all disabled:opacity-50"
              >
                {subscribeStatus === "loading" ? "..." : "SUBSCRIBE"}
              </button>
            </form>
            <div className="w-full text-right h-6">
              {subscribeStatus === "success" && <span className="text-sm font-bold text-green-700">✓ Successfully subscribed!</span>}
              {subscribeStatus === "error" && <span className="text-sm font-bold text-red-600">⚠ Failed to subscribe. Try again.</span>}
            </div>
            <p className="text-sm font-semibold text-gray-800 text-right w-full mt-2">
              By subscribing, you agree to our <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

