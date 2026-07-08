"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function AttendanceForm({ sessionId, token, sessionData }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    instansi: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Validate Token Expiry (30s strict, allow 45s for network delay)
  const isValidToken = () => {
    if (!token) return false;
    const tokenTime = parseInt(token);
    const now = Date.now();
    const diff = (now - tokenTime) / 1000;
    return diff <= 45; // 45 seconds tolerance
  };

  const [tokenValid, setTokenValid] = useState(isValidToken());

  useEffect(() => {
    // If invalid immediately, don't set interval
    if (!tokenValid) return;

    const interval = setInterval(() => {
      if (!isValidToken()) {
        setTokenValid(false);
        toast.error("QR Code Session Expired. Please scan again.");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidToken()) {
      toast.error("QR Code Session Expired. Please scan again.");
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, "attendance_logs"), {
        sessionId: sessionId,
        guestData: formData,
        scannedAt: serverTimestamp(),
        scannedBy: "SELF"
      });
      setSubmitted(true);
      toast.success("Attendance marked!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit attendance.");
    }
    setLoading(false);
  };

  if (!tokenValid && !submitted) {
    return (
      <div className="bg-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_0_#000] text-center max-w-md w-full">
        <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-6" />
        <h2 className="font-anton text-4xl uppercase mb-4">QR Expired</h2>
        <p className="font-bold text-gray-500 mb-8">This QR code has expired. Please look at the projector screen and scan the newest QR code to check in.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_0_#000] text-center max-w-md w-full">
        <FaCheckCircle className="text-6xl text-[#c1ff00] mx-auto mb-6" />
        <h2 className="font-anton text-4xl uppercase mb-4">Check-in Success!</h2>
        <p className="font-bold text-gray-500">Your attendance has been recorded. Look at the screen, your name should appear shortly.</p>
        <div className="mt-8 p-4 bg-gray-50 border-2 border-black rounded-xl">
           <p className="font-bold text-lg">{formData.name}</p>
           <p className="text-sm font-bold text-gray-400">{formData.instansi}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_0_#000] max-w-md w-full">
      <div className="text-center mb-8">
        <span className="bg-[#c1ff00] px-4 py-1 rounded-full font-bold uppercase text-xs border-2 border-black shadow-[2px_2px_0_0_#000]">
          {sessionData.activityName}
        </span>
        <h2 className="font-anton text-4xl uppercase mt-4 mb-2">{sessionData.name}</h2>
        <p className="font-bold text-gray-500">Self-Service Check-In</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
          <input 
            type="text" 
            required 
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-black rounded-xl font-bold focus:ring-4 focus:ring-[#c1ff00] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email</label>
          <input 
            type="email" 
            required 
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-black rounded-xl font-bold focus:ring-4 focus:ring-[#c1ff00] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Institution / Univ / Company</label>
          <input 
            type="text" 
            required 
            placeholder="UPN Veteran Yogyakarta"
            value={formData.instansi}
            onChange={(e) => setFormData({...formData, instansi: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-black rounded-xl font-bold focus:ring-4 focus:ring-[#c1ff00] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Phone (WhatsApp)</label>
          <input 
            type="text" 
            required 
            placeholder="08123456789"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-black rounded-xl font-bold focus:ring-4 focus:ring-[#c1ff00] transition-all"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading || !tokenValid}
          className="w-full mt-4 bg-[#c1ff00] text-black font-anton tracking-wider text-xl py-4 rounded-xl border-4 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all disabled:opacity-50"
        >
          {loading ? "SUBMITTING..." : "CHECK IN"}
        </button>
      </form>
    </div>
  );
}

function AttendanceContent(props) {
  const params = use(props.params);
  const { sessionId } = params;
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const snap = await getDoc(doc(db, "attendance_sessions", sessionId));
      if (snap.exists()) {
        setSessionData(snap.data());
      }
      setLoading(false);
    };
    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#c1ff00] flex items-center justify-center font-poppins">
        <div className="animate-spin w-16 h-16 border-8 border-black border-t-white rounded-full"></div>
      </div>
    );
  }

  if (!sessionData || sessionData.status !== "OPEN" || sessionData.method !== "SELF_SERVICE") {
    return (
      <div className="min-h-screen bg-[#c1ff00] flex items-center justify-center p-6 font-poppins">
        <div className="bg-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_0_#000] text-center max-w-md w-full">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-6" />
          <h2 className="font-anton text-4xl uppercase mb-4">Invalid Session</h2>
          <p className="font-bold text-gray-500 mb-8">This attendance session is either closed or does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#c1ff00] flex items-center justify-center p-6 font-poppins bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] bg-opacity-20">
      <AttendanceForm sessionId={sessionId} token={token} sessionData={sessionData} />
    </div>
  );
}

export default function PublicAttendancePage(props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#c1ff00]" />}>
      <AttendanceContent {...props} />
    </Suspense>
  );
}
