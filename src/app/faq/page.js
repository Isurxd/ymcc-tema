"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFaqs = async () => {
      const unsub = onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "desc")), (snap) => {
        setFaqs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
      return () => unsub();
    };
    loadFaqs();
  }, []);

  const toggleFaq = (e) => {
    const btn = e.currentTarget;
    const answer = btn.nextElementSibling;
    const icon = btn.querySelector(".vertical-line");
    if (answer.style.maxHeight) {
      answer.style.maxHeight = null;
      if (icon) icon.style.transform = "rotate(0deg)";
    } else {
      answer.style.maxHeight = answer.scrollHeight + "px";
      if (icon) icon.style.transform = "rotate(90deg)";
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6 font-poppins">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-gray-500 hover:text-black mb-8 transition-colors">
          <FaChevronLeft /> BACK TO HOMEPAGE
        </Link>
        
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-anton uppercase text-[#111] mb-4">
          FREQUENTLY ASKED QUESTIONS
        </h1>
        <p className="text-gray-600 font-medium text-lg mb-12">
          Comprehensive guide to YMCC VII Registration, Technical Specifications, and General Inquiries.
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin w-12 h-12 border-4 border-[#c1ff00] border-t-black rounded-full"></div>
          </div>
        ) : (
          <div className="bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[8px_8px_0_0_#000]">
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <div key={faq.id || index} className="faq-item group">
                  <button className="w-full flex justify-between items-center font-poppins font-bold text-base md:text-xl cursor-pointer py-6 text-[#111] hover:text-gray-500 transition-colors text-left focus:outline-none" onClick={toggleFaq}>
                    <span className="pr-8">{faq.q}</span>
                    <span className="faq-icon text-gray-400 font-light text-2xl transition-transform duration-300 w-4 h-4 flex items-center justify-center shrink-0 relative">
                      <span className="absolute w-full h-[2px] bg-current"></span>
                      <span className="absolute h-full w-[2px] bg-current transition-transform duration-300 vertical-line"></span>
                    </span>
                  </button>
                  <div className="faq-answer max-h-0 overflow-hidden transition-all duration-400 ease-in-out">
                    <div className="pb-6 text-gray-600 font-poppins text-base leading-relaxed pr-8">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
              {faqs.length === 0 && <p className="py-6 text-gray-500 text-center font-poppins">No FAQs available at the moment.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
