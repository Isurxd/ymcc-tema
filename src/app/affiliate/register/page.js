"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FaUserPlus, FaArrowLeft } from "react-icons/fa";

export default function AffiliateRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    socialLink: "",
    bankDetails: "",
    reason: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "affiliate_applications"), {
        ...formData,
        status: "PENDING",
        createdAt: serverTimestamp()
      });
      toast.success("Application submitted successfully!");
      router.push("/merch");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit application.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center pt-24 pb-24 px-6 md:px-12 font-sans">
      <div className="max-w-4xl w-full">
        
        <button onClick={() => router.push("/merch")} className="inline-flex items-center gap-2 font-bold uppercase hover:text-[#c1ff00] transition-colors bg-white px-6 py-3 rounded-full border-2 border-black mb-8 shadow-[4px_4px_0_0_#000]">
          <FaArrowLeft /> Back to Shop
        </button>

        <div className="bg-white border-2 border-black rounded-[2rem] p-8 md:p-16 shadow-[8px_8px_0_0_#000]">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 bg-[#c1ff00] rounded-full border-2 border-black flex items-center justify-center text-3xl mb-4">
              <FaUserPlus />
            </div>
            <h1 className="font-anton text-4xl md:text-5xl uppercase text-center mb-2">Affiliate Registration</h1>
            <p className="font-poppins text-gray-500 text-center font-bold max-w-2xl">
              Join the YMCC VII Affiliate Program. Promote our merchandise and earn commissions for every successful sale using your referral code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Full Name</label>
                <input required type="text" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" placeholder="Your full name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Address</label>
                <input required type="email" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" placeholder="Valid email for login" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <p className="text-[10px] text-gray-400 mt-1 font-bold">*This email will be used to login to the Affiliate Portal.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">WhatsApp Number</label>
                <input required type="tel" pattern="^[0-9\-\+]+$" title="Only numbers, +, or - are allowed" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" placeholder="e.g. 08123456789" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Instagram / TikTok Link</label>
                <input required type="url" pattern="https?://.+" title="Include http:// or https://" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" placeholder="https://instagram.com/..." value={formData.socialLink} onChange={e => setFormData({...formData, socialLink: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Bank Details (For Commission)</label>
              <input required type="text" minLength="10" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" placeholder="e.g. BCA 123456789 John Doe" value={formData.bankDetails} onChange={e => setFormData({...formData, bankDetails: e.target.value})} />
            </div>

            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Reason for Joining</label>
              <textarea required minLength="20" rows="3" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold resize-none" placeholder="Why do you want to join? (min 20 characters)" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#c1ff00] border-2 border-black rounded-full py-4 text-black font-bold uppercase tracking-widest text-lg hover:bg-black hover:text-[#c1ff00] hover:border-black transition-all disabled:opacity-50 mt-8 shadow-[4px_4px_0_0_#000]">
              {loading ? "SUBMITTING..." : "SUBMIT APPLICATION"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
