"use client";

import { useState } from "react";
import Link from "next/link";
import { FaCheckCircle, FaTimesCircle, FaSearch, FaChevronLeft, FaInfoCircle, FaWhatsapp } from "react-icons/fa";

export default function RecruitmentStatus() {
  const [formData, setFormData] = useState({ nim: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { fullName, nim, status }

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/recruitment/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan sistem");
      }
      
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setResult(null);
    setFormData({ nim: "", email: "" });
  };

  // RENDER RESULT PAGE (SNBP/SNBT STYLE)
  if (result) {
    if (result.status === "ACCEPTED") {
      return (
        <div className="min-h-screen bg-[#fafafa] text-black flex flex-col items-center justify-center p-6 animate-fade-in-up">
          <div className="max-w-2xl w-full bg-white p-8 md:p-12 rounded-3xl border-2 border-black shadow-[4px_4px_0_0_#000] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-[#c1ff00]"></div>
            <FaCheckCircle className="text-7xl text-[#c1ff00] drop-shadow-sm mx-auto mb-6" />
            <p className="font-poppins text-sm md:text-base font-bold text-gray-500 mb-2">RECRUITMENT SELECTION RESULT</p>
            <h1 className="font-anton text-4xl md:text-5xl uppercase tracking-wide text-[#111] mb-6">CONGRATULATIONS! YOU PASSED</h1>
            
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-black text-left mb-8">
              <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Full Name</p>
              <p className="font-bold text-xl mb-4">{result.fullName}</p>
              <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Student ID Number (NIM)</p>
              <p className="font-bold text-xl mb-4">{result.nim}</p>
              
              {result.acceptedDivision && (
                <>
                  <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Accepted Division</p>
                  <p className="font-bold text-xl text-[#85b300] bg-[#eeffcc] inline-block px-3 py-1 border border-[#c1ff00] rounded mt-1">{result.acceptedDivision}</p>
                </>
              )}
            </div>

            <p className="font-poppins text-sm md:text-base mb-6 font-medium">Welcome to The Green Compass YMCC VII 2027! Please join the official WhatsApp group using the link below.</p>
            
            <a href="https://chat.whatsapp.com/H4txE9KTit33amyJFsryks" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white border-2 border-black px-8 py-4 rounded-xl font-bold uppercase hover:bg-[#128C7E] transition-all shadow-[2px_2px_0_0_#000] w-full md:w-auto">
              <FaWhatsapp className="text-2xl" /> Join WhatsApp Group
            </a>
          </div>
          <button onClick={handleBack} className="mt-8 text-black/60 hover:text-black font-bold flex items-center gap-2">
            <FaChevronLeft /> Back to Search
          </button>
        </div>
      );
    }

    if (result.status === "REJECTED") {
      return (
        <div className="min-h-screen bg-[#cc0000] text-white flex flex-col items-center justify-center p-6 animate-fade-in-up">
          <div className="max-w-2xl w-full bg-white text-black p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-gray-800"></div>
            <FaTimesCircle className="text-7xl text-[#cc0000] mx-auto mb-6" />
            <p className="font-poppins text-sm md:text-base font-bold text-gray-500 mb-2">RECRUITMENT SELECTION RESULT</p>
            <h1 className="font-anton text-4xl md:text-5xl uppercase tracking-wide text-[#111] mb-6">WE ARE SORRY</h1>
            
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-black text-left mb-8">
              <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Full Name</p>
              <p className="font-bold text-xl mb-4">{result.fullName}</p>
              <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Student ID Number (NIM)</p>
              <p className="font-bold text-xl">{result.nim}</p>
            </div>

            <p className="font-poppins text-sm md:text-base mb-6 font-medium text-gray-600">We regret to inform you that you have not passed this selection stage. Thank you for your enthusiasm and participation. Keep your spirit up and don&apos;t give up!</p>
            
            <button onClick={handleBack} className="text-black/60 hover:text-black font-bold flex items-center justify-center gap-2 mx-auto">
              <FaChevronLeft /> Back to Search
            </button>
          </div>
        </div>
      );
    }

    // Pending or Interview
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 animate-fade-in-up">
        <div className="max-w-xl w-full bg-white text-black p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-yellow-400"></div>
          <FaInfoCircle className="text-7xl text-yellow-500 mx-auto mb-6" />
          <p className="font-poppins text-sm md:text-base font-bold text-gray-500 mb-2">RECRUITMENT SELECTION STATUS</p>
          <h1 className="font-anton text-3xl uppercase tracking-wide text-black mb-6">SELECTION PROCESS ONGOING</h1>
          
          <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 text-left mb-8">
            <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Full Name</p>
            <p className="font-bold text-lg mb-4">{result.fullName}</p>
            <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Current Status</p>
            <p className="font-bold text-lg text-yellow-600">
              {result.status === "INTERVIEW" ? "PASSED TO INTERVIEW STAGE" : "CURRENTLY UNDER VERIFICATION"}
            </p>
          </div>

          <p className="font-poppins text-sm mb-6 font-medium text-gray-600">The final announcement has not been released yet. Please check back periodically or monitor information in the Recruitment WhatsApp Group.</p>
        </div>
        <button onClick={handleBack} className="mt-8 text-white/50 hover:text-white font-bold flex items-center gap-2">
          <FaChevronLeft /> Back to Search
        </button>
      </div>
    );
  }

  // SEARCH PAGE
  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#fafafa]">
      <div className="max-w-md w-full bg-white border-2 border-black rounded-3xl p-8 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-black"></div>

        <div className="text-center mb-8">
          <FaSearch className="text-4xl text-gray-300 mx-auto mb-4" />
          <h1 className="font-anton text-3xl uppercase tracking-wide text-[#111] mb-2">CHECK RESULT</h1>
          <h2 className="font-poppins font-bold text-gray-500 text-sm">Staff Recruitment Batch 2 - YMCC VII</h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-600 p-4 rounded-lg mb-6 text-sm font-bold">
            {error}
          </div>
        )}

        <p className="text-sm font-medium text-gray-600 mb-8 max-w-sm mx-auto">Enter your Student ID Number (NIM) and Email to check your recruitment result.</p>

        <form onSubmit={handleCheck} className="space-y-6">
          <div>
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Student ID Number (NIM)</label>
            <input 
              type="text" 
              value={formData.nim} 
              onChange={e => setFormData({...formData, nim: e.target.value.replace(/\D/g, '')})} 
              placeholder="e.g. 11223344" 
              required 
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-black" 
            />
          </div>
          <div>
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Address</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="email@domain.com" 
              required 
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-black lowercase" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !formData.nim || !formData.email} 
            className="w-full bg-black text-[#c1ff00] px-6 py-4 rounded-xl font-bold uppercase shadow-[4px_4px_0_0_#c1ff00] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? "CHECKING..." : "CHECK RESULT"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-bold text-gray-400 hover:text-black">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
