"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function PaymentSimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const [status, setStatus] = useState("WAITING");

  const simulatePayment = async () => {
    setStatus("PROCESSING");
    
    // Simulate Network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const res = await fetch("/api/webhooks/xendit-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "PAID" })
      });

      if (res.ok) {
        setStatus("SUCCESS");
        setTimeout(() => {
          router.push(`/merch/track?orderId=${orderId}`);
        }, 3000);
      } else {
        setStatus("FAILED");
      }
    } catch (e) {
      setStatus("FAILED");
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] p-8 md:p-12 rounded-[2rem] max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h1 className="font-anton text-3xl uppercase mb-2">Xendit Simulation</h1>
        <p className="text-gray-500 font-bold mb-6">Order: {orderId}</p>
        
        <div className="bg-gray-100 p-4 rounded-xl border-2 border-black mb-8">
          <span className="block text-sm font-bold uppercase text-gray-500">Amount Due</span>
          <span className="font-anton text-4xl">Rp {Number(amount).toLocaleString("id-ID")}</span>
        </div>

        {status === "WAITING" && (
          <button 
            onClick={simulatePayment}
            className="w-full bg-black text-[#c1ff00] font-bold uppercase text-xl py-4 rounded-full border-2 border-black hover:bg-[#c1ff00] hover:text-black transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-y-1"
          >
            Simulate Payment Success
          </button>
        )}

        {status === "PROCESSING" && (
          <div className="font-bold text-xl animate-pulse">Processing Payment...</div>
        )}

        {status === "SUCCESS" && (
          <div className="text-green-600 font-bold text-xl">
            Payment Successful! Redirecting...
          </div>
        )}

        {status === "FAILED" && (
          <div className="text-red-600 font-bold text-xl">
            Payment Failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSimulation() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center font-bold">Loading...</div>}>
      <PaymentSimulationContent />
    </Suspense>
  );
}

