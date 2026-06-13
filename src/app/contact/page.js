"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function ContactFAQ() {
  const [openFaq, setOpenFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      const unsub = onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "asc")), (snap) => {
        setFaqs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
      return () => unsub();
    };
    fetchFaqs();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          <h1 className="font-anton text-5xl md:text-6xl uppercase tracking-wide text-[#111] mb-6">
            How Can We Help?
          </h1>
          <p className="font-poppins text-gray-600 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
            Get in touch with our official media and support center for immediate assistance regarding registration, technical issues, and general competition guidelines.
          </p>
        </div>

        {/* Contact Support Card */}
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 mb-32">
          {/* Left: Logo Graphic */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-pointer drop-shadow-2xl">
            <Image 
              src="/LOGO YMCC RASIO 1X1.png" 
              alt="YMCC Logo Graphic" 
              fill 
              className="object-contain drop-shadow-xl" 
            />
          </div>

          {/* Right: Support Card */}
          <div className="flex-grow bg-white border-2 border-black rounded-[2rem] p-8 md:p-10 shadow-brutal w-full hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] transition-all duration-300">
            <h2 className="font-anton text-3xl md:text-4xl uppercase tracking-wide text-[#111] mb-2">
              Central Support & Call Center
            </h2>
            <p className="font-poppins text-sm text-gray-600 mb-8">
              Integrated Helpdesk & Administrative Assistance
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#c1ff00] border-2 border-black rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#111]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span className="font-poppins text-lg md:text-xl text-[#111]">+62 882-0050-08443</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#c1ff00] border-2 border-black rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#111]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <span className="font-poppins text-lg md:text-xl text-[#111]">contact@ymccvii.com</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="https://wa.me/62882005008443" target="_blank" rel="noopener noreferrer" className="bg-[#c1ff00] border-2 border-black rounded-full px-6 py-3 font-poppins font-bold text-sm text-[#111] hover:bg-black hover:text-white transition-colors flex items-center gap-2">
                Chat on WhatsApp <span>→</span>
              </a>
              <a href="mailto:contact@ymccvii.com" className="bg-white border-2 border-black rounded-full px-6 py-3 font-poppins font-bold text-sm text-[#111] hover:bg-gray-100 transition-colors flex items-center gap-2">
                Send an Email <span>→</span>
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="font-anton text-4xl md:text-5xl uppercase tracking-wide text-[#111] text-center mb-12">
            FREQUENTLY ASKED QUESTIONS
          </h2>

          <div className="border-t-2 border-gray-200 pt-4">
            {loading ? (
              <p className="text-center font-poppins text-gray-500 animate-pulse mt-8">Loading Data...</p>
            ) : faqs.length === 0 ? (
              <div className="text-center mt-12 mb-8">
                <p className="font-poppins font-medium text-gray-400 text-lg">No data available at this moment.</p>
              </div>
            ) : (
              faqs.map((faq, index) => (
                <div key={index} className="border-b-2 border-gray-200">
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left py-6 flex items-center justify-between group"
                  >
                    <h3 className="font-poppins font-bold text-lg md:text-xl text-[#111] pr-8 group-hover:text-gray-600 transition-colors">
                      {faq.q}
                    </h3>
                    <span className="text-3xl font-light text-gray-400 group-hover:text-black transition-colors">
                      {openFaq === index ? "−" : "+"}
                    </span>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFaq === index ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="font-poppins text-gray-600 text-sm md:text-base leading-relaxed pr-12">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-center font-poppins text-sm md:text-base text-[#111] mt-12">
            Have more questions? Initiate communication via our <span className="underline cursor-pointer font-medium" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Coordination Center</span> above.
          </p>
        </div>

      </div>
    </div>
  );
}

