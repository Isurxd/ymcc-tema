"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function TrackOrder() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackingNumber) return;
    
    setIsLoading(true);
    // Simulate API Call for Logistics tracking
    setTimeout(() => {
      setIsLoading(false);
      setStatus("IN_TRANSIT"); // Mock response
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6 md:px-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/merch">
          <button className="flex items-center gap-2 border-2 border-black rounded-full px-6 py-2 font-poppins font-bold text-sm uppercase mb-8 hover:bg-[#111] hover:text-white transition-colors bg-white shadow-brutal-sm">
            ← BACK TO SHOP
          </button>
        </Link>

        <div className="bg-white border-2 border-black rounded-[2rem] p-8 md:p-12 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-4 mb-6">
            <span className="bg-[#c1ff00] border-2 border-black px-4 py-1 rounded-full text-sm font-bold uppercase">
              Logistics
            </span>
            <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">
              Real-time tracking
            </span>
          </div>

          <h1 className="font-anton text-5xl md:text-6xl uppercase tracking-wide mb-4">
            TRACK YOUR GEAR
          </h1>
          <p className="font-poppins text-gray-600 mb-8 leading-relaxed">
            Enter your Air Waybill (AWB) number below to track the delivery status of your official merchandise. Tracking information is updated automatically through our shipping partner.
          </p>

          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 mb-12">
            <input 
              type="text" 
              placeholder="e.g. YMCC-789234" 
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="flex-grow border-2 border-black rounded-full py-4 px-6 font-poppins text-lg outline-none focus:bg-gray-50 uppercase placeholder-gray-400"
            />
            <button 
              type="submit"
              disabled={isLoading || !trackingNumber}
              className="bg-black text-[#c1ff00] px-10 py-4 rounded-full font-bold uppercase tracking-widest text-lg hover:bg-[#c1ff00] hover:text-black hover:border-2 hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
            >
              {isLoading ? "TRACKING..." : "TRACK"}
            </button>
          </form>

          {/* MOCK TRACKING STATUS */}
          {status && (
            <div className="border-2 border-black rounded-2xl p-8 bg-gray-50 animate-fade-in">
              <h3 className="font-anton text-3xl uppercase mb-6">Shipment Status</h3>
              
              <div className="relative border-l-2 border-black ml-4 space-y-8 pb-4">
                
                {/* Step 1: Manifested */}
                <div className="relative">
                  <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full border-2 border-black bg-[#c1ff00]" />
                  <div className="pl-8">
                    <h4 className="font-bold text-lg uppercase">Manifested (Warehouse)</h4>
                    <p className="text-sm text-gray-500 font-semibold mb-1">May 28, 2026 - 14:00 WIB</p>
                    <p className="text-gray-700">Package has been scanned and processed within 24 hours.</p>
                  </div>
                </div>

                {/* Step 2: In Transit */}
                <div className="relative">
                  <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full border-2 border-black bg-[#c1ff00]" />
                  <div className="pl-8">
                    <h4 className="font-bold text-lg uppercase">In Transit (Logistics Hub)</h4>
                    <p className="text-sm text-gray-500 font-semibold mb-1">May 29, 2026 - 08:30 WIB</p>
                    <p className="text-gray-700">Package is en route to the destination sorting center.</p>
                  </div>
                </div>

                {/* Step 3: Delivered (Pending) */}
                <div className="relative">
                  <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full border-2 border-black bg-white" />
                  <div className="pl-8">
                    <h4 className="font-bold text-lg uppercase text-gray-400">Delivered</h4>
                    <p className="text-gray-400">Waiting for receiver confirmation.</p>
                  </div>
                </div>

              </div>

              <div className="mt-8 pt-6 border-t-[3px] border-black flex justify-between items-center">
                <p className="text-sm font-bold text-gray-500">
                  Got a damaged product?
                </p>
                <Link href="/merch/rma">
                  <button className="underline font-bold hover:text-[#c1ff00] transition-colors">
                    Open RMA Portal
                  </button>
                </Link>
              </div>

              <div className="mt-4 pt-4 flex gap-4 flex-col sm:flex-row">
                <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="flex-1 text-center bg-[#25D366] text-white font-bold uppercase py-3 border-2 border-black rounded-xl hover:scale-105 transition-transform shadow-[2px_2px_0_0_#000]">
                  Chat Admin
                </a>
                <button onClick={() => toast.info("Downloading Invoice...")} className="flex-1 bg-black text-[#c1ff00] font-bold uppercase py-3 border-2 border-black rounded-xl hover:scale-105 transition-transform shadow-[2px_2px_0_0_#000]">
                  Download Bukti Pembelian
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

