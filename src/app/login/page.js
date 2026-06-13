"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, loginWithGoogle } from "@/lib/auth";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user, error } = await loginUser(email, password);
      if (error) throw new Error(error);

      if (user.email === "m.fairuzadhimularifin@gmail.com") {
        router.push("/master");
        return;
      }

      const staffDocRef = doc(db, "staff_applications", user.email);
      const staffSnap = await getDoc(staffDocRef);

      if (staffSnap.exists() && staffSnap.data().status === "APPROVED") {
         const role = (staffSnap.data().role || staffSnap.data().department || "").toLowerCase();
         if (role.includes("admin")) router.push("/admin");
         else if (role.includes("fundraising") || role.includes("dana usaha")) router.push("/fundraising");
         else router.push("/operator");
      } else {
         router.push("/portal");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { user, error: authError } = await loginWithGoogle();
      if (authError) throw new Error(authError);
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          fullName: user.displayName || "Unknown Participant",
          role: "participant",
          registrationStatus: "UNVERIFIED",
          createdAt: serverTimestamp()
        });
      }
      if (user.email === "m.fairuzadhimularifin@gmail.com") {
        router.push("/master");
        return;
      }

      const staffDocRef = doc(db, "staff_applications", user.email);
      const staffSnap = await getDoc(staffDocRef);

      if (staffSnap.exists() && staffSnap.data().status === "APPROVED") {
         const role = (staffSnap.data().role || staffSnap.data().department || "").toLowerCase();
         if (role.includes("admin")) router.push("/admin");
         else if (role.includes("fundraising") || role.includes("dana usaha")) router.push("/fundraising");
         else router.push("/operator");
      } else {
         router.push("/portal");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen pt-32 px-6 flex items-center justify-center bg-[#fafafa]">
      <div className="max-w-md w-full bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-3 bg-[var(--color-grass)] border-b-2 border-black"></div>

        <div className="text-center mb-10 mt-2">
          <h1 className="font-anton text-4xl uppercase tracking-wide text-[#111] mb-2">SECURE LOG IN</h1>
          <p className="font-poppins text-sm text-gray-500">Access your dashboard, exam center, and tracking logs.</p>
        </div>

        <div className="mb-6">
          <button type="button" onClick={handleGoogleLogin} className="w-full bg-white text-black border-2 border-black py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:shadow-none">
            <FaGoogle /> SIGN IN WITH GOOGLE
          </button>
          
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="font-poppins text-xs font-bold text-gray-400 uppercase tracking-widest">OR USE EMAIL</span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Registered Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all lowercase"
            />
          </div>

          <div className="relative">
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 pr-12 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[34px] text-gray-500 hover:text-black transition-colors"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button 
            type="submit" 
            className="btn-brutal w-full mt-4 bg-[var(--color-grass)] text-[#111] font-anton text-2xl uppercase tracking-widest py-4 rounded-xl"
          >
            DECRYPT ACCESS & ENTER
          </button>
        </form>

        <p className="text-center font-poppins text-sm text-gray-500 mt-8">
          Need security clearance? <Link href="/register" className="font-bold text-[#111] underline hover:text-[var(--color-grass)] transition-colors">Join Force here</Link>
        </p>
      </div>
    </div>
  );
}
