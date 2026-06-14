"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaShieldAlt, FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        checkAccess(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  async function checkAccess(user) {
    setLoading(true);
    try {
      // Superadmin bypass
      if (user.email === "m.fairuzadhimularifin@gmail.com") {
        router.push("/operator");
        return;
      }

      const staffDoc = await getDoc(doc(db, "staff_applications", user.email));
      if (staffDoc.exists()) {
        const data = staffDoc.data();
        if (data.status === "APPROVED") {
          if (data.role === "Operator") {
            router.push("/operator");
          } else if (data.role === "Admin") {
            router.push("/admin");
          } else {
            setErrorMsg("Role unassigned. Contact Superadmin.");
            await signOut(auth);
          }
        } else {
          setErrorMsg(`Your staff application is currently: ${data.status}`);
          await signOut(auth);
        }
      } else {
        setErrorMsg("Access Denied: You have not applied as staff.");
        await signOut(auth);
      }
    } catch (err) {
      setErrorMsg("Failed to verify access: " + err.message);
      await signOut(auth);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // checkAccess will be triggered by onAuthStateChanged
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // checkAccess will be triggered by onAuthStateChanged
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4 font-poppins pt-32 pb-24">
      <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-3xl shadow-[4px_4px_0_0_#000] border-2 border-black relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-3 bg-black border-b-2 border-black"></div>

        <div className="text-center mb-8 mt-2">
          <div className="mx-auto w-16 h-16 bg-[#c1ff00] border-2 border-black rounded-xl flex items-center justify-center shadow-sm mb-4">
            <FaShieldAlt className="text-3xl text-black" />
          </div>
          <h1 className="font-anton text-4xl uppercase text-black">STAFF PORTAL</h1>
          <p className="text-gray-500 font-medium text-sm tracking-widest uppercase mt-2">Unified Access Gateway</p>
        </div>
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 font-semibold text-center border-2 border-red-200">
             {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-5 mb-6">
          <div>
            <label className="block font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@ymcc.com"
              required 
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold"
            />
          </div>
          <div className="relative">
            <label className="block font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required 
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold"
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
            disabled={loading}
            className="w-full bg-[var(--color-grass)] text-[#111] py-4 rounded-xl font-anton text-xl tracking-widest uppercase hover:bg-black hover:text-[#c1ff00] transition-colors border-2 border-black shadow-[2px_2px_0_0_rgba(17,17,17,1)] hover:shadow-none disabled:opacity-50 mt-2"
          >
            {loading ? "AUTHENTICATING..." : "LOGIN WITH EMAIL"}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors border-2 border-black shadow-[2px_2px_0_0_rgba(17,17,17,1)] hover:shadow-none disabled:opacity-50"
        >
          <FaGoogle />
          {loading ? "PROCESSING..." : "SECURE LOGIN WITH GOOGLE"}
        </button>

        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <a href="/staff-register" className="text-sm text-gray-500 hover:text-black font-semibold underline transition-colors">Apply as New Staff</a>
        </div>
      </div>
    </div>
  );
}
