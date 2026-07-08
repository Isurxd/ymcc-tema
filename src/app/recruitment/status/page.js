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
        <div className="min-h-screen bg-[#0066cc] text-white flex flex-col items-center justify-center p-6 animate-fade-in-up">
          <div className="max-w-2xl w-full bg-white text-black p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-[#c1ff00]"></div>
            <FaCheckCircle className="text-7xl text-[#0066cc] mx-auto mb-6" />
            <p className="font-poppins text-sm md:text-base font-bold text-gray-500 mb-2">PENGUMUMAN SELEKSI PANITIA BATCH 2</p>
            <h1 className="font-anton text-4xl md:text-5xl uppercase tracking-wide text-[#0066cc] mb-6">SELAMAT! ANDA DINYATAKAN LULUS</h1>
            
            <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 text-left mb-8">
              <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Nama Lengkap</p>
              <p className="font-bold text-xl mb-4">{result.fullName}</p>
              <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Nomor Induk Mahasiswa (NIM)</p>
              <p className="font-bold text-xl">{result.nim}</p>
            </div>

            <p className="font-poppins text-sm md:text-base mb-6 font-medium">Selamat bergabung sebagai bagian dari The Green Compass YMCC VII 2027! Silakan bergabung ke grup WhatsApp resmi melalui tautan di bawah ini.</p>
            
            <a href="https://chat.whatsapp.com/H4txE9KTit33amyJFsryks" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-xl font-bold uppercase hover:bg-[#128C7E] transition-colors shadow-lg w-full md:w-auto">
              <FaWhatsapp className="text-2xl" /> Gabung Grup WhatsApp Resmi
            </a>
          </div>
          <button onClick={handleBack} className="mt-8 text-white/80 hover:text-white font-bold flex items-center gap-2">
            <FaChevronLeft /> Kembali ke Pencarian
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
            <p className="font-poppins text-sm md:text-base font-bold text-gray-500 mb-2">PENGUMUMAN SELEKSI PANITIA BATCH 2</p>
            <h1 className="font-anton text-4xl md:text-5xl uppercase tracking-wide text-[#cc0000] mb-6">MOHON MAAF, ANDA TIDAK LULUS</h1>
            
            <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 text-left mb-8">
              <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Nama Lengkap</p>
              <p className="font-bold text-xl mb-4">{result.fullName}</p>
              <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Nomor Induk Mahasiswa (NIM)</p>
              <p className="font-bold text-xl">{result.nim}</p>
            </div>

            <p className="font-poppins text-sm md:text-base mb-6 font-medium">Jangan berkecil hati. Masih banyak kesempatan lain untuk berkarya. Tetap semangat dan terima kasih atas partisipasi Anda di YMCC VII 2027.</p>
          </div>
          <button onClick={handleBack} className="mt-8 text-white/80 hover:text-white font-bold flex items-center gap-2">
            <FaChevronLeft /> Kembali ke Pencarian
          </button>
        </div>
      );
    }

    // Pending or Interview
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 animate-fade-in-up">
        <div className="max-w-xl w-full bg-white text-black p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-yellow-400"></div>
          <FaInfoCircle className="text-7xl text-yellow-500 mx-auto mb-6" />
          <p className="font-poppins text-sm md:text-base font-bold text-gray-500 mb-2">STATUS SELEKSI PANITIA BATCH 2</p>
          <h1 className="font-anton text-3xl uppercase tracking-wide text-black mb-6">TAHAP SELEKSI MASIH BERLANGSUNG</h1>
          
          <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 text-left mb-8">
            <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Nama Lengkap</p>
            <p className="font-bold text-lg mb-4">{result.fullName}</p>
            <p className="font-poppins text-xs font-bold text-gray-500 uppercase">Status Saat Ini</p>
            <p className="font-bold text-lg text-yellow-600">
              {result.status === "INTERVIEW" ? "LOLOS KE TAHAP WAWANCARA" : "SEDANG DALAM PROSES VERIFIKASI"}
            </p>
          </div>

          <p className="font-poppins text-sm mb-6 font-medium text-gray-600">Pengumuman akhir kelulusan belum dirilis untuk data Anda. Silakan cek kembali secara berkala atau pantau informasi di Grup WhatsApp Calon Panitia.</p>
        </div>
        <button onClick={handleBack} className="mt-8 text-white/50 hover:text-white font-bold flex items-center gap-2">
          <FaChevronLeft /> Kembali ke Pencarian
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
          <h1 className="font-anton text-3xl uppercase tracking-wide text-[#111] mb-2">CEK HASIL KELULUSAN</h1>
          <h2 className="font-poppins font-bold text-gray-500 text-sm">Staff Recruitment Batch 2 - YMCC VII</h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-600 p-4 rounded-lg mb-6 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleCheck} className="space-y-6">
          <div>
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Nomor Induk Mahasiswa (NIM)</label>
            <input 
              type="text" 
              value={formData.nim} 
              onChange={e => setFormData({...formData, nim: e.target.value.replace(/\D/g, '')})} 
              placeholder="Contoh: 11223344" 
              required 
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-black" 
            />
          </div>
          <div>
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Pendaftaran</label>
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
            {loading ? "Memeriksa Data..." : "LIHAT HASIL"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-bold text-gray-400 hover:text-black">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
