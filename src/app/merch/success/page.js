"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { FaCheckCircle, FaShoppingBag, FaTruck, FaArrowRight } from "react-icons/fa";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 flex items-center justify-center bg-[#fafafa] px-6 font-poppins">
      <div className="max-w-xl w-full bg-white border-2 border-black rounded-[2.5rem] p-8 md:p-12 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden text-center">
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 w-full h-3 bg-[#c1ff00] border-b-2 border-black"></div>

        {/* Success Icon */}
        <div className="w-20 h-20 bg-[#c1ff00] border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 mt-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
          <FaCheckCircle className="text-4xl text-black" />
        </div>

        <h1 className="font-anton text-4xl md:text-5xl uppercase tracking-wider text-black mb-2">
          ORDER CONFIRMED
        </h1>
        <p className="text-gray-500 font-semibold text-sm tracking-widest uppercase mb-8">
          TRANSACTION COMPLETED SUCCESSFULLY
        </p>

        {orderId ? (
          <div className="bg-gray-50 border-2 border-black rounded-2xl p-6 mb-8 text-left relative">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Order ID Referral
            </span>
            <div className="flex justify-between items-center gap-4">
              <span className="font-mono font-bold text-lg text-black break-all">{orderId}</span>
              <button 
                onClick={copyToClipboard}
                className="bg-black text-[#c1ff00] text-xs font-bold px-3 py-2 rounded-lg border border-black hover:bg-white hover:text-black transition-colors shrink-0"
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-black rounded-2xl p-6 mb-8 text-center">
            <p className="text-sm text-gray-500 font-semibold">Your payment has been registered. You can verify your invoice in the Participant Portal.</p>
          </div>
        )}

        <div className="text-gray-600 font-medium text-sm leading-relaxed mb-10 max-w-sm mx-auto">
          Thank you for securing your official YMCC VII gear! A confirmation email and purchase receipt are being prepared. Your inventory allocation has been finalized.
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {orderId && (
            <Link href={`/merch/track?orderId=${orderId}`}>
              <button className="w-full bg-[#c1ff00] text-black font-anton text-xl tracking-wider py-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3">
                <FaTruck /> TRACK SHIPMENT <FaArrowRight className="text-sm" />
              </button>
            </Link>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <Link href="/merch">
              <button className="w-full bg-white text-black font-bold uppercase text-xs py-3.5 rounded-xl border-2 border-black hover:bg-gray-50 transition-colors">
                <FaShoppingBag className="inline mr-2" /> Back to Shop
              </button>
            </Link>
            <Link href="/portal">
              <button className="w-full bg-black text-white font-bold uppercase text-xs py-3.5 rounded-xl border-2 border-black hover:bg-gray-900 transition-colors">
                Go to Portal
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center font-bold">Loading order details...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
