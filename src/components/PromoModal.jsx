"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaXmark, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function PromoModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const pathname = usePathname();

  useEffect(() => {
    // Fetch real merch data
    const fetchMerch = async () => {
      try {
        const snap = await getDocs(collection(db, "merchandise"));
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (items.length > 0) {
          const formattedSlides = items.map((item, idx) => ({
            rank: `#${idx + 1} - ${item.category || "GEAR"}`,
            title: item.name,
            description: item.description,
            specs: item.tagline || "Limited Edition",
            image: item.image,
            id: item.id
          }));
          setSlides(formattedSlides);
        }
      } catch (err) {
        console.error("Error fetching merch for promo:", err);
      }
    };
    fetchMerch();
  }, []);

  useEffect(() => {
    const hasSeenPromo = localStorage.getItem("ymcc_promo_seen");
    if (!hasSeenPromo) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isVisible || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const isPortalRoute = ["/admin", "/operator", "/fundraising", "/master", "/portal", "/login", "/register", "/staff-register", "/staff"].some(route => pathname?.startsWith(route));
  if (isPortalRoute) return null;

  const handleDismiss = () => {
    localStorage.setItem("ymcc_promo_seen", "true");
    setIsVisible(false);
  };

  const nextSlide = () => {
    if (slides.length > 0) setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  const prevSlide = () => {
    if (slides.length > 0) setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (!isVisible || slides.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border-2 border-black rounded-[2rem] shadow-[12px_12px_0px_0px_rgba(17,17,17,1)] w-full max-w-5xl overflow-hidden relative flex flex-col lg:flex-row">
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <FaXmark className="text-xl text-[#111]" />
        </button>

        {/* Visual Anchor (Left Side) */}
        <div className="w-full lg:w-1/2 relative min-h-[300px] lg:min-h-[500px] bg-gray-100">
          <Image 
            src={slides[currentSlide].image} 
            alt={slides[currentSlide].title}
            fill
            className="object-cover transition-opacity duration-500"
          />
          {/* Ribbon Tag */}
          <div className="absolute top-6 left-0 bg-[var(--color-grass)] border-y-2 border-r-2 border-black py-2 px-6 rounded-r-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] z-10">
            <span className="font-anton text-lg tracking-wide text-[#111] uppercase">POPULAR GEAR / 76 PILLARS SPECIAL</span>
          </div>

          {/* Slide Navigation Buttons */}
          <div className="absolute bottom-6 left-6 flex gap-2 z-10">
            <button onClick={prevSlide} className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-[var(--color-grass)] transition-colors shadow-sm">
              <FaChevronLeft className="text-sm" />
            </button>
            <button onClick={nextSlide} className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-[var(--color-grass)] transition-colors shadow-sm">
              <FaChevronRight className="text-sm" />
            </button>
          </div>
        </div>

        {/* Content (Right Side) */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-[#fafafa]">
          <h4 className="font-poppins font-bold text-gray-500 text-xs tracking-widest uppercase mb-2">PRO-GRADE INDUSTRIAL CO-APPARATUS</h4>
          
          <div className="mb-4">
            <span className="inline-block bg-[#111] text-white font-poppins font-bold text-[10px] px-3 py-1 rounded-sm uppercase tracking-widest mb-3">
              RANK {slides[currentSlide].rank}
            </span>
            <h2 className="font-anton text-3xl lg:text-4xl leading-tight uppercase text-[#111] mb-4">
              {slides[currentSlide].title}
            </h2>
          </div>

          <p className="font-poppins text-sm text-gray-600 leading-relaxed mb-6">
            {slides[currentSlide].description}
          </p>

          <div className="bg-[#eefcf0] border-l-2 border-[var(--color-grass)] p-4 rounded-r-lg mb-10">
            <p className="font-poppins text-xs font-medium text-[#111]"><span className="font-bold">Specs:</span> {slides[currentSlide].specs}</p>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            <Link href={`/merch?id=${slides[currentSlide].id}`} onClick={handleDismiss}>
              <button className="btn-brutal w-full bg-[var(--color-grass)] text-[#111] font-anton text-xl tracking-wide py-4 rounded-xl uppercase">
                SECURE MY GEAR &rarr;
              </button>
            </Link>
            <button 
              onClick={handleDismiss}
              className="w-full bg-transparent text-gray-500 font-poppins font-bold text-xs py-3 hover:text-[#111] transition-colors"
            >
              Dismiss Offer & Browse Website
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

