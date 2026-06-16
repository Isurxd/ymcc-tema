"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser, loginWithGoogle } from "@/lib/auth";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FaGoogle, FaUpload, FaEye, FaEyeSlash } from "react-icons/fa";

export default function StaffRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    nim: "",
    department: "",
    division: "",
    position: "Staff",
    driveLink: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const departmentData = {
    "COMPETITION": [
      "Mining Games",
      "Mining Strategy & Innovation Competition",
      "Intellectual Challenges",
      "Paper Competition"
    ],
    "FUNDRAISING": [
      "Entrepreneurship",
      "Sponsorship"
    ],
    "EVENT": [
      "Mining Camp",
      "Opening & Closing",
      "Studium General",
      "Society Project",
      "Seminar Nasional",
      "Minexplo"
    ],
    "OPERATIONAL": [
      "General Affair",
      "Logistic",
      "Consumption",
      "Safety, Security, Health, and Care",
      "Laison Officer"
    ],
    "MEDIA": [
      "Branding & Public Relation",
      "Creative Production",
      "Secretariat"
    ]
  };

  const bodData = [
    "Executive Director",
    "Vice Executive Director",
    "Secretary I",
    "Secretary II",
    "Finance Director I",
    "Finance Director II"
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [googleUid, setGoogleUid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const { user, error: authError } = await loginWithGoogle();
      if (authError) throw new Error(authError);
      
      const docRef = doc(db, "staff_applications", user.email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        throw new Error("You have already submitted an application with this email.");
      }
      
      setFormData(prev => ({
        ...prev,
        email: user.email,
        fullName: user.displayName || ""
      }));
      setIsGoogleAuth(true);
      setGoogleUid(user.uid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isGoogleAuth && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      let uid = googleUid;
      let email = formData.email.toLowerCase();

      if (!isGoogleAuth) {
        const { user, error: authError } = await registerUser(email, formData.password);
        if (authError) {
          // If email is already registered (maybe as Participant), try to sign them in so they can add a Staff profile
          if (authError.includes("email-already-in-use")) {
            try {
              const userCred = await signInWithEmailAndPassword(auth, email, formData.password);
              uid = userCred.user.uid;
            } catch (signInErr) {
              throw new Error("This email is already registered. Please use your existing password to link this account, or use Google Sign-In.");
            }
          } else {
            throw new Error(authError);
          }
        } else {
          uid = user.uid;
        }
      }

      // Check application after authentication
      const docRef = doc(db, "staff_applications", email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        throw new Error("You have already submitted an application with this email.");
      }

      await setDoc(docRef, {
        email: email,
        name: formData.fullName,
        uid: uid,
        nim: formData.nim,
        department: formData.department,
        division: formData.division,
        position: formData.position,
        driveLink: formData.driveLink,
        status: "PENDING",
        role: null, // Role will be assigned by Superadmin
        appliedAt: serverTimestamp()
      });

      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: 'Pendaftaran Staf YMCC VII Diterima',
            text: `Halo ${formData.fullName},\n\nTerima kasih telah mendaftar sebagai staf YMCC VII.\n\nAplikasi Anda untuk divisi ${formData.division} di departemen ${formData.department} telah kami terima dan saat ini sedang dalam status menunggu persetujuan (PENDING).\n\nAdmin kami akan segera meninjau aplikasi Anda. Anda akan menerima email pemberitahuan lebih lanjut setelah aplikasi disetujui.\n\nSalam hangat,\nTim YMCC VII`
          })
        });
      } catch (emailErr) {
        console.error("Failed to send application received email:", emailErr);
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === "nim") {
       value = value.replace(/\D/g, '');
    }

    if (name === "position") {
       // If changing position to BOD or Head, clear division
       if (value === "BOD" || value === "Head") {
         setFormData({ ...formData, position: value, division: "" });
       } else {
         setFormData({ ...formData, position: value });
       }
    } else if (name === "department") {
       setFormData({ ...formData, department: value, division: "" });
    } else {
       setFormData({ ...formData, [name]: value });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6">
        <div className="max-w-md w-full bg-white p-8 border-2 border-black rounded-3xl text-center shadow-[4px_4px_0_0_#000]">
          <h2 className="font-anton text-3xl uppercase mb-4 text-[#c1ff00] bg-black inline-block px-4 py-2">APPLICATION RECEIVED</h2>
          <p className="font-poppins text-sm text-gray-600 mb-6">Your staff application has been submitted successfully. The Superadmin will verify your KTA/KTM via the Google Drive link and assign your role (Admin/Operator). You will be notified once approved.</p>
          <button onClick={() => router.push("/")} className="font-bold underline uppercase text-sm">RETURN TO HOME</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#fafafa]">
      <div className="max-w-xl w-full bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-black"></div>

        <div className="text-center mb-10 mt-2">
          <h1 className="font-anton text-4xl uppercase tracking-wide text-[#111] mb-2">STAFF ACCOUNT REGISTRATION</h1>
          <p className="font-poppins text-sm text-gray-500">Register your official Operator or Admin account.</p>
        </div>

        {!isGoogleAuth && (
          <div className="mb-8">
            <button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full bg-white text-black border-2 border-black py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:shadow-none uppercase tracking-widest text-sm disabled:opacity-50">
              <FaGoogle /> CONTINUE WITH GOOGLE
            </button>
            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="font-poppins text-xs font-bold text-gray-400 uppercase tracking-widest">OR REGISTER MANUALLY</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
          </div>
        )}

        {error && <div className="bg-red-100 text-red-600 p-4 rounded-xl border border-red-300 font-poppins text-sm mb-6 font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Full Legal Name</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName} 
              onChange={handleChange}
              placeholder="As written on ID/KTM" 
              required 
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all" 
            />
          </div>

          <div>
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              value={formData.email} 
              onChange={handleChange}
              placeholder="active.email@domain.com" 
              required 
              disabled={isGoogleAuth}
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
            />
          </div>

          {!isGoogleAuth && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password} 
                  onChange={handleChange}
                  required 
                  minLength={8}
                  placeholder="Minimum 8 characters" 
                  className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 pr-12 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[34px] text-gray-500 hover:text-black transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="relative">
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Confirm Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword"
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  required 
                  minLength={8}
                  placeholder="Verify password" 
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 pr-12 font-poppins text-sm focus:outline-none focus:ring-2 transition-all ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-black focus:ring-[#c1ff00]"
                  }`} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[34px] text-gray-500 hover:text-black transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-xs mt-2 font-bold font-poppins">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Student ID (NIM)</label>
              <input 
                type="text" 
                name="nim"
                value={formData.nim} 
                onChange={handleChange}
                placeholder="NIM / NPM" 
                required 
                pattern="^[0-9]+$"
                title="Must contain numbers only"
                className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all" 
              />
            </div>
            
            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Position in YMCC</label>
              <select 
                name="position"
                value={formData.position} 
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer"
              >
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Head">Head of Department</option>
                <option value="BOD">Board of Directors (BOD)</option>
              </select>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${formData.position === "BOD" || formData.position === "Head" ? "" : "md:grid-cols-2"} gap-6`}>
            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">
                {formData.position === "BOD" ? "Board of Directors Role" : "YMCC Department"}
              </label>
              {formData.position === "BOD" ? (
                <select 
                  name="department"
                  value={formData.department} 
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer"
                >
                  <option value="">-- Select BOD Role --</option>
                  {bodData.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              ) : (
                <select 
                  name="department"
                  value={formData.department} 
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer"
                >
                  <option value="">-- Select Department --</option>
                  {Object.keys(departmentData).map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              )}
            </div>
            
            {formData.position !== "BOD" && formData.position !== "Head" && (
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">YMCC Division</label>
                <select 
                  name="division"
                  value={formData.division} 
                  onChange={handleChange}
                  required
                  disabled={!formData.department}
                  className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer disabled:opacity-50"
                >
                  <option value="">-- Select Division --</option>
                  {formData.department && departmentData[formData.department] && departmentData[formData.department].map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Google Drive Link (KTA / KTM)</label>
            <input 
              type="url" 
              name="driveLink"
              value={formData.driveLink} 
              onChange={handleChange}
              placeholder="https://drive.google.com/..." 
              required 
              pattern="^https?:\/\/(drive\.google\.com|docs\.google\.com)\/.*$"
              title="Must be a valid Google Drive link"
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all" 
            />
            <p className="text-xs text-gray-500 mt-2 font-poppins">Technical limit: We cannot auto-verify if the link is public. <span className="font-bold text-red-500">Please ensure the link is set to &quot;Anyone with the link can view&quot;.</span></p>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full mt-4 bg-black text-[#c1ff00] border-2 border-black shadow-[4px_4px_0_0_rgba(17,17,17,1)] py-4 rounded-xl font-poppins font-bold uppercase tracking-widest hover:bg-[#c1ff00] hover:text-black hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? "PROCESSING..." : "REGISTER ACCOUNT"}
          </button>
        </form>
        
        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <a href="/staff" className="text-sm text-gray-500 hover:text-black font-semibold underline transition-colors">Already registered? Go to Login</a>
        </div>
      </div>
    </div>
  );
}
