"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const hasConsented = localStorage.getItem("ymcc_cookie_consent");
    if (!hasConsented) {
      // Small delay before showing
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("ymcc_cookie_consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] p-4 pointer-events-none">
      <div className="bg-[#18181b] border-2 border-black rounded-3xl p-5 md:p-6 max-w-4xl mx-auto shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex flex-col md:flex-row items-center gap-6 pointer-events-auto transform translate-y-0 opacity-100 transition-all duration-500 ease-out relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-2 h-full bg-[var(--color-grass)]"></div>
        
        <div className="flex-grow pl-2">
          <h3 className="font-anton text-xl text-white uppercase tracking-wide mb-2">
            [SECURITY & TELEMETRY PROTOCOL]
          </h3>
          <p className="font-poppins text-xs text-gray-300 leading-normal text-justify md:text-left">
            This Platform utilizes strictly functional and telemetry cookies to secure your dashboard session, prevent multi-device authentication fraud, manage local exam state caches, and execute PCI-DSS compliant transactions via Xendit. We do not engage in advertising or third-party data monetization. By continuing to navigate the compass, you consent to our technical data parameters as detailed in our Cookie Policy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
          <button 
            onClick={handleAccept}
            className="bg-[var(--color-grass)] text-[#111] font-poppins font-bold text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-widest border border-black hover:bg-white transition-colors active:translate-y-px whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:shadow-none"
          >
            ACCEPT ALL PROTOCOLS
          </button>
          <button 
            className="bg-transparent text-white font-poppins font-bold text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-widest border border-gray-600 hover:border-white hover:bg-white hover:text-[#111] transition-colors whitespace-nowrap"
          >
            CUSTOMIZE
          </button>
        </div>
      </div>
    </div>
  );
}

