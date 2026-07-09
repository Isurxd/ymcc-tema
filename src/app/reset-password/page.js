"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth, confirmPasswordReset } from "firebase/auth";
import app from "@/lib/firebase";
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");
  const emailParam = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!oobCode) {
      toast.error("Invalid or missing action code.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (oobCode.startsWith("mockCode_for_")) {
        // Local mock reset handler using direct API
        const targetEmail = emailParam || decodeURIComponent(oobCode.replace("mockCode_for_", ""));
        const response = await fetch("/api/reset-password/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail, newPassword: password, oobCode })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to update password.");
        }
      } else {
        // Real production Firebase client-side reset
        const clientAuth = getAuth(app);
        await confirmPasswordReset(clientAuth, oobCode, password);
      }

      setIsSuccess(true);
      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!oobCode) {
    return (
      <div className="text-center p-8 bg-[#111] border border-red-500/20 rounded-3xl max-w-md w-full shadow-2xl">
        <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
        <h2 className="font-anton text-2xl text-white uppercase mb-2">Invalid Reset Link</h2>
        <p className="text-gray-400 mb-6">This password reset link is invalid, broken, or has already expired. Please request a new link.</p>
        <button onClick={() => router.push("/login")} className="w-full bg-[#c1ff00] text-black font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-white transition-all shadow-[0_4px_0_0_#000]">
          Back to Login
        </button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center p-8 bg-[#111] border border-green-500/20 rounded-3xl max-w-md w-full shadow-2xl">
        <FaCheckCircle className="text-[#c1ff00] text-5xl mx-auto mb-4 animate-bounce" />
        <h2 className="font-anton text-2xl text-white uppercase mb-2">Password Updated</h2>
        <p className="text-gray-400 mb-6">Your password has been reset successfully. You will be redirected to the login page shortly.</p>
        <button onClick={() => router.push("/login")} className="w-full bg-[#c1ff00] text-black font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-white transition-all shadow-[0_4px_0_0_#000]">
          Go to Login Now
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black/80 backdrop-blur-md border border-gray-800 p-8 rounded-3xl max-w-md w-full shadow-[0_10px_50px_rgba(193,255,0,0.05)]">
      <div className="text-center mb-8">
        <h1 className="font-anton text-4xl text-white uppercase tracking-wider">Reset Password</h1>
        <p className="text-gray-400 text-sm mt-2">Enter your new secure password below to access your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">New Password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <FaLock />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full bg-[#111] border-2 border-gray-800 text-white pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:border-[#c1ff00] transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Confirm Password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <FaLock />
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full bg-[#111] border-2 border-gray-800 text-white pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:border-[#c1ff00] transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#c1ff00] text-black font-bold py-3.5 rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-[0_4px_0_0_#000] disabled:opacity-50"
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#c1ff00]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <Suspense fallback={
        <div className="text-white font-anton text-2xl tracking-widest uppercase">
          Loading...
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
