"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaCheckCircle, FaChevronRight, FaChevronLeft, FaFileUpload, FaInfoCircle, FaLock, FaCalendarAlt } from "react-icons/fa";
import Link from "next/link";

export default function Recruitment() {
  const router = useRouter();
  
  const [recruitmentStatus, setRecruitmentStatus] = useState("LOADING"); // LOADING, UPCOMING, OPEN, CLOSED
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const docRef = doc(db, "site_settings", "recruitment");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRecruitmentStatus(docSnap.data().status || "OPEN");
        } else {
          setRecruitmentStatus("OPEN");
        }
      } catch (err) {
        console.error(err);
        setRecruitmentStatus("OPEN");
      }
    };
    fetchStatus();
  }, []);

  const divisions = [
    "Board of Directors - Secretary II",
    "Competition Department - Intellectual Challenges",
    "Competition Department - Mining Games",
    "Competition Department - Mining Strategy & Innovation Competition",
    "Competition Department - Paper Competition",
    "Event Department - Minexplo",
    "Event Department - Mining Camp",
    "Event Department - Opening & Closing",
    "Event Department - Seminar Nasional",
    "Event Department - Society Project",
    "Event Department - Studium General",
    "Fundraising Department - Entrepreneurship",
    "Fundraising Department - Sponsorship",
    "Media Department - Branding & Public Relation",
    "Media Department - Creative Production",
    "Media Department - Secretariat",
    "Operational Department - Consumption",
    "Operational Department - General Affair",
    "Operational Department - Liaison Officer",
    "Operational Department - Logistic",
    "Operational Department - Safety, Security, Health, and Care"
  ];

  const [formData, setFormData] = useState({
    protocolConsent: false,
    fullName: "",
    nim: "",
    ktaLink: "",
    email: "",
    whatsapp: "",
    domicile: "",
    organizationExp: "",
    achievementDesc: "",
    academicCommitment: "",
    division1: "",
    division2: "",
    specificContribution: "",
    documentLink: ""
  });

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    if (name === "fullName" || name === "domicile") {
      value = value.toUpperCase();
    }
    if (name === "email") {
      value = value.toLowerCase();
    }
    if (name === "nim" || name === "whatsapp") {
      value = value.replace(/\D/g, "");
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    setError("");
    // Basic validation before next
    if (step === 1 && !formData.protocolConsent) {
      setError("You must agree to the filling protocol.");
      return;
    }
    if (step === 2) {
      if (!formData.fullName || !formData.nim || !formData.ktaLink || !formData.email || !formData.whatsapp || !formData.domicile) {
        setError("All fields in this section are required.");
        return;
      }
      if (!formData.ktaLink.includes("drive.google.com")) {
        setError("The KTA/KTM/KRP link must be a valid Google Drive shareable link.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.organizationExp || !formData.achievementDesc || !formData.academicCommitment) {
        setError("All experience and commitment fields are required.");
        return;
      }
    }
    if (step === 4) {
      if (!formData.division1 || !formData.division2 || !formData.specificContribution) {
        setError("Division choices and specific contribution are required.");
        return;
      }
      if (formData.division1 === formData.division2) {
        setError("Division Choice 1 and Division Choice 2 cannot be the same.");
        return;
      }
    }

    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.documentLink && !formData.documentLink.includes("drive.google.com")) {
      setError("If providing supporting documents, please ensure it is a valid Google Drive link.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/recruitment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }
      
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "A system error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#fafafa]">
        <div className="max-w-xl w-full bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden text-center animate-fade-in-up">
          <div className="absolute top-0 left-0 w-full h-3 bg-black"></div>
          <FaCheckCircle className="text-6xl text-[#c1ff00] mx-auto mb-6 drop-shadow-md" />
          <h1 className="font-anton text-4xl uppercase tracking-wide text-[#111] mb-4">APPLICATION SUBMITTED</h1>
          <p className="font-poppins text-sm text-gray-600 mb-8 font-medium">Thank you for registering as a YMCC VII Staff. We have successfully received your documents and they will be reviewed shortly. The Green Compass Starts With You!</p>
          <Link href="/" className="inline-block bg-black text-[#c1ff00] px-8 py-3 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00]">
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (recruitmentStatus === "LOADING") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-12 h-12 border-4 border-[#c1ff00] border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (recruitmentStatus === "UPCOMING") {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#fafafa]">
        <div className="max-w-xl w-full bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-center animate-fade-in-up">
          <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-6 drop-shadow-sm" />
          <h1 className="font-anton text-4xl uppercase tracking-wide text-[#111] mb-2">COMING SOON</h1>
          <h2 className="font-poppins font-bold text-gray-500 text-sm mb-6">Staff Recruitment Batch 2 - YMCC VII</h2>
          <p className="font-poppins text-sm text-gray-600 mb-8 font-medium">Registration for YMCC VII Batch 2 Staff will be open soon. Prepare your documents and stay tuned for official updates on our Instagram @ymcc_upnvyk!</p>
          <Link href="/" className="inline-block bg-black text-[#c1ff00] px-8 py-3 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00]">
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (recruitmentStatus === "CLOSED") {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#fafafa]">
        <div className="max-w-xl w-full bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-center animate-fade-in-up">
          <FaLock className="text-6xl text-red-500 mx-auto mb-6 drop-shadow-sm" />
          <h1 className="font-anton text-4xl uppercase tracking-wide text-[#111] mb-2">RECRUITMENT CLOSED</h1>
          <h2 className="font-poppins font-bold text-gray-500 text-sm mb-6">Staff Recruitment Batch 2 - YMCC VII</h2>
          <p className="font-poppins text-sm text-gray-600 mb-8 font-medium">Thank you for your enthusiasm. The registration period for YMCC VII Batch 2 Staff has closed. Next announcements will be notified via Email or WhatsApp Group.</p>
          <Link href="/" className="inline-block bg-black text-[#c1ff00] px-8 py-3 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00]">
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#fafafa]">
      <div className="max-w-2xl w-full bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-[#c1ff00] border-b-2 border-black"></div>

        <div className="mb-8">
          <h1 className="font-anton text-3xl uppercase tracking-wide text-[#111] mb-2">OFFICIAL REGISTRATION: GENERAL STAFF</h1>
          <h2 className="font-poppins font-bold text-gray-500 text-sm mb-4">BATCH 2 | YMCC VII 2027</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full border border-black ${step >= s ? 'bg-[#c1ff00]' : 'bg-gray-100'}`}></div>
            ))}
          </div>
          <p className="text-xs font-bold text-right mt-2 text-gray-400">Section {step} of 5</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-600 p-4 rounded-xl mb-6 font-bold text-sm flex items-center gap-2 shadow-[2px_2px_0_0_#ef4444]">
            <FaInfoCircle className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <h3 className="font-anton text-2xl uppercase mb-4 bg-black text-[#c1ff00] inline-block px-3 py-1">Protocol & Integrity Validation</h3>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 space-y-4">
                <p className="text-sm font-medium text-gray-700">Welcome to the registration gateway for the strategic pillars of YMCC VII. We seek individuals who are precise, adaptive, and aligned with the vision of Sustainable Future Mining.</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                  <p className="font-bold text-sm mb-2 text-yellow-800">IMPORTANT: Filling Protocol (Must Read):</p>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-yellow-900">
                    <li><strong>Name Standardization:</strong> Use UPPERCASE letters according to official identity card (No Titles).</li>
                    <li><strong>Email Standardization:</strong> Use lowercase letters (all lowercase).</li>
                    <li><strong>File Format:</strong> All supporting documents must be combined into 1 PDF file (Max 5MB) named: <em>[CHOICE 1] _ [Full Name] _ [NIM]</em>.</li>
                    <li><strong>Data Validity:</strong> The data you enter will be automatically processed by the system. Any input errors are entirely the responsibility of the applicant.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-4 border-2 border-black rounded-xl">
                <input 
                  type="checkbox" 
                  id="protocolConsent" 
                  name="protocolConsent"
                  checked={formData.protocolConsent}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 accent-[#c1ff00] border-2 border-black rounded cursor-pointer shrink-0"
                />
                <label htmlFor="protocolConsent" className="text-sm font-bold cursor-pointer">
                  Before proceeding, you must understand that YMCC VII values technical precision.<br/>
                  I have read the Handbook and understand all technical filling procedures (Name, Email, and File Naming Formats). Yes, I understand and am ready to be responsible for the validity of my data.
                </label>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-fade-in-up space-y-6">
              <h3 className="font-anton text-2xl uppercase mb-4 bg-black text-[#c1ff00] inline-block px-3 py-1">A. Personal Branding & Core Data</h3>
              
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">1. Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Use UPPERCASE letters according to official ID card" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00] uppercase" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">2. NIM <span className="text-red-500">*</span></label>
                  <input type="text" name="nim" value={formData.nim} onChange={handleChange} placeholder="No dots/separators. Example: 112XXXXXX" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00]" />
                </div>
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">3. Active Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="youremail@gmail.com" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00] lowercase" />
                </div>
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Upload Proof of KTA / KTM / KRP <span className="text-red-500">*</span></label>
                <input type="url" name="ktaLink" value={formData.ktaLink} onChange={handleChange} placeholder="Google Drive Link (URL)..." required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00]" />
                <p className="text-xs text-gray-500 mt-2 font-medium">Upload photo to your personal Google Drive. Ensure the sharing settings are set to <strong>&apos;Anyone with the link&apos;</strong>.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">4. WhatsApp Number <span className="text-red-500">*</span></label>
                  <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Format: 628xxxxxxxxxx (without +)" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00]" />
                </div>
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">5. Current Domicile <span className="text-red-500">*</span></label>
                  <input type="text" name="domicile" value={formData.domicile} onChange={handleChange} placeholder="CITY/REGENCY" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00] uppercase" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-fade-in-up space-y-6">
              <h3 className="font-anton text-2xl uppercase mb-4 bg-black text-[#c1ff00] inline-block px-3 py-1">B. Academic & Org. Track Record</h3>
              
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">6. Latest Organizational Experience <span className="text-red-500">*</span></label>
                <textarea name="organizationExp" value={formData.organizationExp} onChange={handleChange} rows="3" placeholder="List 1-2 experiences (Position & Year)" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00]" />
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">7. Description of Greatest Achievement / Challenge <span className="text-red-500">*</span></label>
                <textarea name="achievementDesc" value={formData.achievementDesc} onChange={handleChange} rows="4" placeholder="Tell us about your greatest challenge (max ±150 words)..." required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00]" />
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">8. Academic Commitment 2026-2027 <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-500 mb-3">Are there any plans for Internship / Community Service (KKN) during Jan - Jun 2027?</p>
                <div className="flex gap-4">
                  {["Yes", "No", "Still Tentative"].map(opt => (
                    <label key={opt} className={`flex-1 text-center py-3 px-2 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all ${formData.academicCommitment === opt ? 'bg-black text-[#c1ff00] border-black shadow-[2px_2px_0_0_#c1ff00]' : 'bg-gray-50 border-gray-300 hover:border-black text-gray-600'}`}>
                      <input type="radio" name="academicCommitment" value={opt} onChange={handleChange} className="hidden" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="animate-fade-in-up space-y-6">
              <h3 className="font-anton text-2xl uppercase mb-4 bg-black text-[#c1ff00] inline-block px-3 py-1">C. Strategic Alignment</h3>
              
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">9. Division Choice 1 (Priority) <span className="text-red-500">*</span></label>
                <select name="division1" value={formData.division1} onChange={handleChange} required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm font-semibold focus:ring-[#c1ff00] cursor-pointer">
                  <option value="">-- Select First Choice Priority --</option>
                  {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">10. Division Choice 2 (Alternative) <span className="text-red-500">*</span></label>
                <select name="division2" value={formData.division2} onChange={handleChange} required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm font-semibold focus:ring-[#c1ff00] cursor-pointer">
                  <option value="">-- Select Second Choice Priority --</option>
                  {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">11. Specific Contribution to YMCC VII <span className="text-red-500">*</span></label>
                <textarea name="specificContribution" value={formData.specificContribution} onChange={handleChange} rows="4" placeholder="What is your concrete contribution to the selected division?" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00]" />
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="animate-fade-in-up space-y-6">
              <h3 className="font-anton text-2xl uppercase mb-4 bg-black text-[#c1ff00] inline-block px-3 py-1">D. Document Submission</h3>
              
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                <FaFileUpload className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-700 mb-2">All documents must be combined into <strong>1 PDF file (Max 5MB)</strong>.</p>
                <p className="text-xs text-gray-500 mb-6">File name format: <strong className="text-black">[CHOICE 1] _ [Full Name] _ [NIM]</strong></p>
                
                <div className="text-left">
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">12. Supporting Documents Choice 1 [OPTIONAL]</label>
                  <input type="url" name="documentLink" value={formData.documentLink} onChange={handleChange} placeholder="Google Drive Link (URL)..." className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm focus:ring-[#c1ff00]" />
                  <p className="text-xs text-gray-500 mt-2">Ensure the sharing settings are set to <strong>&apos;Anyone with the link&apos;</strong>. Leave blank if there are no supporting documents.</p>
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="px-6 py-3 border-2 border-black rounded-xl font-bold uppercase text-sm hover:bg-gray-100 transition-colors">
                <FaChevronLeft className="inline mr-2" /> Back
              </button>
            )}
            
            {step < 5 ? (
              <button type="submit" className="flex-1 bg-black text-[#c1ff00] px-6 py-3 rounded-xl font-bold uppercase text-sm shadow-[4px_4px_0_0_rgba(17,17,17,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
                Next <FaChevronRight />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="flex-1 bg-[#c1ff00] text-black border-2 border-black px-6 py-3 rounded-xl font-bold uppercase text-sm shadow-[4px_4px_0_0_rgba(17,17,17,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
                {loading ? "Saving Data..." : "Submit Form"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
