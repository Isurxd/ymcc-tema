"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaXmark, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const SLIDES = [
  {
    rank: "#1 - MOST POPULAR",
    title: "YMCC VII OFFICIAL SAFETY JACKET (WEARPACK)",
    description: "The gold standard of field engineering apparel. Constructed with heavyweight, industrial-grade American Drill fabric, featuring high-reflectivity safety striping, a tactical radio pocket, and double-stitching. Built for both administrative authority and field resilience.",
    specs: "Limited Release | Material: Heavy American Drill.",
    image: "/merch/DSC01632.jpg"
  },
  {
    rank: "#2 - HIGH DEMAND",
    title: "YMCC VII PREMIUM UTILITY VEST",
    description: "Optimized for high-mobility exploration. Features a dual-pane chest zipper, breathable mesh lining, and high-visibility reflective safety bands ensuring prominence and utility in low-light environments.",
    specs: "Field Surveyor Edition | Material: Water-resistant Hybrid.",
    image: "/merch/DSC01482.jpg"
  },
  {
    rank: "#3 - COLLECTIBLES",
    title: "PREMIUM STEEL KEYCHAIN & TACTICAL STICKERS",
    description: "Laser-engraved brushed stainless steel keychain paired with premium, UV-resistant, scratchproof industrial stickers designed for helmets, laptops, and field equipment.",
    specs: "304 Stainless Steel | Weatherproof Matte Vinyl.",
    image: "/HERO FOTO.jpg"
  }
];

export default function PromoModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const pathname = usePathname();

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
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const isPortalRoute = ["/admin", "/operator", "/fundraising", "/master", "/portal", "/login", "/register", "/staff-register", "/staff"].some(route => pathname?.startsWith(route));
  if (isPortalRoute) return null;

  const handleDismiss = () => {
    localStorage.setItem("ymcc_promo_seen", "true");
    setIsVisible(false);
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/75 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4 md:p-6">
        <div className="bg-white border-2 border-black rounded-[2rem] shadow-[12px_12px_0px_0px_rgba(17,17,17,1)] w-full max-w-5xl overflow-hidden relative flex flex-col lg:flex-row">
          
          {/* Close Button */}
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-md"
          >
            <FaXmark className="text-xl text-[#111]" />
          </button>

          {/* Visual Anchor (Left Side) */}
          <div className="w-full lg:w-1/2 relative min-h-[250px] lg:min-h-[420px] bg-gray-100 shrink-0">
            <Image 
              src={SLIDES[currentSlide].image} 
              alt={SLIDES[currentSlide].title}
              fill
              className="object-cover transition-opacity duration-500"
            />
            {/* Ribbon Tag */}
            <div className="absolute top-6 left-0 bg-[var(--color-grass)] border-y-2 border-r-2 border-black py-2 px-6 rounded-r-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] z-10">
              <span className="font-anton text-sm md:text-base tracking-wide text-[#111] uppercase">POPULAR GEAR / SPECIALS</span>
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
          <div className="w-full lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center bg-[#fafafa]">
            <h4 className="font-poppins font-bold text-gray-500 text-[10px] md:text-xs tracking-widest uppercase mb-2">PRO-GRADE INDUSTRIAL CO-APPARATUS</h4>
            
            <div className="mb-3">
              <span className="inline-block bg-[#111] text-white font-poppins font-bold text-[9px] px-2.5 py-0.5 rounded-sm uppercase tracking-widest mb-2.5">
                RANK {SLIDES[currentSlide].rank}
              </span>
              <h2 className="font-anton text-2xl lg:text-3xl leading-tight uppercase text-[#111] mb-2.5">
                {SLIDES[currentSlide].title}
              </h2>
            </div>

            <p className="font-poppins text-xs md:text-sm text-gray-600 leading-relaxed mb-4">
              {SLIDES[currentSlide].description}
            </p>

            <div className="bg-[#eefcf0] border-l-2 border-[var(--color-grass)] p-3 rounded-r-lg mb-6">
              <p className="font-poppins text-[11px] md:text-xs font-medium text-[#111]"><span className="font-bold">Technical Specs:</span> {SLIDES[currentSlide].specs}</p>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <Link href="/merch" onClick={handleDismiss}>
                <button className="btn-brutal w-full bg-[var(--color-grass)] text-[#111] font-anton text-lg tracking-wide py-3 rounded-xl uppercase">
                  SECURE MY GEAR &rarr;
                </button>
              </Link>
              <button 
                onClick={handleDismiss}
                className="w-full bg-transparent text-gray-400 font-poppins font-bold text-[11px] py-1.5 hover:text-[#111] transition-colors"
              >
                Dismiss Offer & Browse Website
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

