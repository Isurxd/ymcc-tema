"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, loginWithGoogle, logoutUser, getFriendlyErrorMessage, resetUserPassword } from "@/lib/auth";
import { FaGoogle, FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Silakan masukkan email Anda.");
      return;
    }
    setIsResetting(true);
    try {
      const { success, error } = await resetUserPassword(resetEmail.trim());
      if (!success) throw new Error(error);
      toast.success("Link reset password berhasil dikirim ke email Anda! Silakan cek folder inbox atau spam.");
      setShowResetModal(false);
      setResetEmail("");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsResetting(false);
    }
  };

  const isMasterEmail = (email) => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    return cleanEmail === "m.fairuzadhimularifin@gmail.com" || cleanEmail === "suryatripatih@gmail.com" || cleanEmail === "noreply@ymccvii.com";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user, error } = await loginUser(email, password);
      if (error) throw new Error(error);

      if (isMasterEmail(user.email)) {
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
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { user, error: authError } = await loginWithGoogle();
      if (authError) throw new Error(authError);
      if (isMasterEmail(user.email)) {
        router.push("/master");
        return;
      }

      // Check if user is staff/operator
      const staffDocRef = doc(db, "staff_applications", user.email);
      const staffSnap = await getDoc(staffDocRef);

      if (staffSnap.exists()) {
        if (staffSnap.data().status === "APPROVED") {
          const role = (staffSnap.data().role || staffSnap.data().department || "").toLowerCase();
          if (role.includes("admin")) router.push("/admin");
          else if (role.includes("fundraising") || role.includes("dana usaha")) router.push("/fundraising");
          else router.push("/operator");
        } else {
          toast.error(`Your staff application is currently: ${staffSnap.data().status}`);
          await logoutUser();
        }
        return;
      }

      // Check participant user document
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        router.push("/portal");
      } else {
        toast.error("Account not registered. Please register first.");
        await logoutUser();
        router.push("/register");
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen pt-32 px-6 flex items-center justify-center bg-[#fafafa]">
      <div className="max-w-md w-full bg-white border-2 border-black rounded-3xl p-6 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
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
            <div className="flex justify-between items-center mb-2">
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111]">Password</label>
              <button 
                type="button" 
                onClick={() => setShowResetModal(true)}
                className="text-xs font-poppins font-bold text-gray-500 hover:text-black underline transition-colors focus:outline-none"
              >
                Lupa Password?
              </button>
            </div>
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
              className="absolute right-4 top-[38px] text-gray-500 hover:text-black transition-colors"
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

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-4 border-black p-8 rounded-[2rem] max-w-md w-full shadow-[8px_8px_0_0_#000] relative">
            <button 
              onClick={() => setShowResetModal(false)}
              className="absolute right-6 top-6 text-gray-500 hover:text-black transition-colors focus:outline-none"
            >
              <FaTimes className="text-xl" />
            </button>
            <h3 className="font-anton text-3xl uppercase mb-2">Reset Password</h3>
            <p className="font-poppins text-gray-600 mb-6 font-semibold text-sm leading-relaxed">
              Masukkan alamat email Anda yang terdaftar. Kami akan mengirimkan tautan untuk menyetel ulang kata sandi Anda.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)} 
                  required 
                  className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all lowercase"
                />
              </div>
              <button 
                type="submit"
                disabled={isResetting}
                className="w-full bg-[var(--color-grass)] text-[#111] font-anton text-xl uppercase tracking-widest py-3.5 rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
              >
                {isResetting ? "SENDING LINK..." : "Kirim Tautan Reset"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
