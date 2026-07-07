"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, loginWithGoogle } from "@/lib/auth";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    educationLevel: "Undergraduate",
    country: "Indonesia",
    province: "",
    provinceId: "",
    city: "",
    cityId: "",
    district: "",
    districtId: "",
    village: "",
    villageId: "",
    institution: "",
    studentId: "",
    email: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
    agreed: false
  });
  
  const [countriesList, setCountriesList] = useState(["Indonesia", "Malaysia", "Singapore", "Thailand", "Philippines", "Australia", "Japan", "South Korea", "China", "United States", "United Kingdom", "Other"]);
  const [universityResults, setUniversityResults] = useState([]);
  const [isSearchingUniv, setIsSearchingUniv] = useState(false);
  
  const [provincesList, setProvincesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [googleUid, setGoogleUid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Fetch all countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        const names = data.map(c => c.name.common).sort();
        if (names.length > 0) {
           const filtered = names.filter(n => n !== "Indonesia" && n !== "Other");
           setCountriesList(["Indonesia", ...filtered]);
        }
      } catch (err) {
        console.warn("Failed to fetch countries, using default list");
      }
    };
    fetchCountries();

    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
        if (res.ok) {
          const data = await res.json();
          setProvincesList(data);
        }
      } catch (err) { console.warn(err); }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (formData.provinceId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.provinceId}.json`)
        .then(res => res.json())
        .then(data => setCitiesList(data))
        .catch(console.warn);
    } else {
      setTimeout(() => {
        setCitiesList([]);
        setDistrictsList([]);
        setVillagesList([]);
      }, 0);
    }
  }, [formData.provinceId]);

  useEffect(() => {
    if (formData.cityId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${formData.cityId}.json`)
        .then(res => res.json())
        .then(data => setDistrictsList(data))
        .catch(console.warn);
    } else {
      setTimeout(() => {
        setDistrictsList([]);
        setVillagesList([]);
      }, 0);
    }
  }, [formData.cityId]);

  useEffect(() => {
    if (formData.districtId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${formData.districtId}.json`)
        .then(res => res.json())
        .then(data => setVillagesList(data))
        .catch(console.warn);
    } else {
      setTimeout(() => {
        setVillagesList([]);
      }, 0);
    }
  }, [formData.districtId]);

  // Search universities dynamically
  useEffect(() => {
    if (formData.educationLevel === "Undergraduate" && formData.institution.length > 2) {
      const fetchUnivs = async () => {
        setIsSearchingUniv(true);
        try {
          const countryQuery = formData.country !== "Other" ? `&country=${encodeURIComponent(formData.country)}` : "";
          const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(formData.institution)}${countryQuery}`);
          const data = await res.json();
          // limit to 10 results
          setUniversityResults(data.slice(0, 10).map(u => u.name));
        } catch (err) {
          console.error(err);
        }
        setIsSearchingUniv(false);
      };
      const delayDebounceFn = setTimeout(() => {
        fetchUnivs();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setTimeout(() => {
        setUniversityResults([]);
      }, 0);
    }
  }, [formData.institution, formData.educationLevel, formData.country]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (name === "whatsapp" || name === "studentId") {
       // Only allow digits
       finalValue = finalValue.replace(/\D/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setFormData(prev => ({
      ...prev,
      country: newCountry,
      province: newCountry !== "Indonesia" ? "" : prev.province,
      provinceId: newCountry !== "Indonesia" ? "" : prev.provinceId,
      city: newCountry !== "Indonesia" ? "" : prev.city,
      cityId: newCountry !== "Indonesia" ? "" : prev.cityId,
      district: newCountry !== "Indonesia" ? "" : prev.district,
      districtId: newCountry !== "Indonesia" ? "" : prev.districtId,
      village: newCountry !== "Indonesia" ? "" : prev.village,
      villageId: newCountry !== "Indonesia" ? "" : prev.villageId,
    }));
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const { user, error: authError } = await loginWithGoogle();
      if (authError) throw new Error(authError);
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        router.push("/portal");
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        email: user.email,
        fullName: user.displayName ? user.displayName.toUpperCase() : ""
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
    if (!formData.agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      let uid = googleUid;
      if (!isGoogleAuth) {
        const { user, error: authError } = await registerUser(formData.email.toLowerCase(), formData.password);
        if (authError) {
          // If email is already registered (maybe as Staff), try to sign them in so they can add a Participant profile
          if (authError.includes("email-already-in-use")) {
            try {
              const userCred = await signInWithEmailAndPassword(auth, formData.email.toLowerCase(), formData.password);
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
      
      await setDoc(doc(db, "users", uid), {
        uid: uid,
        fullName: formData.fullName,
        educationLevel: formData.educationLevel,
        country: formData.country,
        province: formData.country === "Indonesia" ? formData.province : "",
        institution: formData.institution,
        studentId: formData.studentId,
        email: formData.email.toLowerCase(),
        whatsapp: formData.whatsapp,
        role: "participant",
        registrationStatus: "UNVERIFIED",
        createdAt: serverTimestamp()
      });

      router.push("/portal");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#fafafa]">
      <div className="max-w-3xl w-full bg-white border-2 border-black rounded-3xl p-6 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-3 bg-[var(--color-grass)] border-b-2 border-black"></div>

        <div className="text-center mb-10 mt-2">
          <h1 className="font-anton text-4xl md:text-5xl uppercase tracking-wide text-[#111] mb-2">PARTICIPANT REGISTRATION</h1>
          <p className="font-poppins text-sm text-gray-500 font-medium">Create your secure credentials to enter the YMCC VII Command Portal.</p>
        </div>

        {!isGoogleAuth && (
          <div className="mb-8">
            <button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full bg-white text-black border-2 border-black py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:shadow-none mb-4">
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
            <input type="text" name="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value.toUpperCase()})} placeholder="ENTER FULL NAME AS PER ID CARD" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all uppercase font-semibold text-[#111]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Country of Origin</label>
              <select 
                value={formData.country} 
                onChange={handleCountryChange} 
                required 
                className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all font-semibold"
              >
                <option value="">-- Select Country --</option>
                {countriesList.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {formData.country === "Indonesia" && (
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Province</label>
                <select name="provinceId" required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm font-poppins focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" value={formData.provinceId} onChange={(e) => {
                  const sel = provincesList.find(p => p.id === e.target.value);
                  setFormData({...formData, provinceId: sel?.id||"", province: sel?.name||"", cityId: "", city: "", districtId: "", district: "", villageId: "", village: ""});
                }}>
                  <option value="">-- Select Province --</option>
                  {provincesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {formData.country === "Indonesia" && formData.provinceId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">City / Regency</label>
                <select required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm font-poppins focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" value={formData.cityId} onChange={(e) => {
                  const sel = citiesList.find(p => p.id === e.target.value);
                  setFormData({...formData, cityId: sel?.id||"", city: sel?.name||"", districtId: "", district: "", villageId: "", village: ""});
                }}>
                  <option value="">-- Select City --</option>
                  {citiesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">District (Kecamatan)</label>
                <select required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm font-poppins focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" value={formData.districtId} onChange={(e) => {
                  const sel = districtsList.find(p => p.id === e.target.value);
                  setFormData({...formData, districtId: sel?.id||"", district: sel?.name||"", villageId: "", village: ""});
                }}>
                  <option value="">-- Select District --</option>
                  {districtsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Village (Desa)</label>
                <select required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm font-poppins focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold" value={formData.villageId} onChange={(e) => {
                  const sel = villagesList.find(p => p.id === e.target.value);
                  setFormData({...formData, villageId: sel?.id||"", village: sel?.name||""});
                }}>
                  <option value="">-- Select Village --</option>
                  {villagesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Educational Level</label>
              <select name="educationLevel" value={formData.educationLevel} onChange={handleChange} className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all font-semibold cursor-pointer">
                <option value="Undergraduate">Undergraduate (University)</option>
                <option value="High School">High School / Equivalent</option>
              </select>
            </div>
            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Student ID (NPM / NIM / NISN)</label>
              <input 
                type="text" 
                name="studentId" 
                value={formData.studentId} 
                onChange={handleChange} 
                required 
                pattern="^[0-9]+$"
                title="Must contain numbers only"
                placeholder="Official Identification Number" 
                className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all font-semibold" 
              />
            </div>
          </div>

          <div className="relative">
            <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">
              {formData.educationLevel === "High School" ? "High School Name" : "Institution / University Name"}
            </label>
            <input 
              type="text" 
              name="institution"
              value={formData.institution} 
              onChange={handleChange} 
              required 
              placeholder={formData.educationLevel === "High School" ? "Start typing your High School name..." : "Start typing your university..."}
              className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all uppercase font-semibold text-[#111]"
            />
            {isSearchingUniv && <p className="text-xs text-gray-500 mt-1 font-semibold">Searching database...</p>}
            {universityResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border-2 border-black mt-1 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {universityResults.map((univ, idx) => (
                  <li 
                    key={idx} 
                    className="px-4 py-2 hover:bg-[#c1ff00] cursor-pointer text-sm font-poppins font-bold border-b border-gray-100 last:border-0"
                    onClick={() => {
                      setFormData(prev => ({...prev, institution: univ.toUpperCase()}));
                      setUniversityResults([]);
                    }}
                  >
                    {univ}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})} placeholder="active.email@domain.com" required disabled={isGoogleAuth} className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all lowercase font-semibold disabled:opacity-60 disabled:cursor-not-allowed" />
            </div>
            <div>
              <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Active WhatsApp Number</label>
              <input 
                type="tel" 
                name="whatsapp" 
                value={formData.whatsapp} 
                onChange={handleChange} 
                placeholder="08..." 
                pattern="^08[0-9]{8,12}$"
                title="WhatsApp number must start with 08 and contain 10-14 digits"
                required 
                className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all font-semibold" 
              />
            </div>
          </div>

          {!isGoogleAuth && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Secure Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  minLength={8} 
                  placeholder="Minimum 8 characters" 
                  className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 pr-12 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)] transition-all font-semibold" 
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
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 pr-12 font-poppins text-sm focus:outline-none focus:ring-2 transition-all font-semibold ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-black focus:ring-[var(--color-grass)]"
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

          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 mt-2 hover:border-black transition-colors">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange} className="mt-1 w-5 h-5 accent-black cursor-pointer" />
              <span className="font-poppins text-xs text-gray-600 leading-relaxed font-medium">
                I hereby declare that all information provided is accurate and corresponds to my official identification. I agree to the <Link href="/tos" className="font-bold text-black underline hover:text-[var(--color-grass)]">Terms of Service</Link> and <Link href="/privacy" className="font-bold text-black underline hover:text-[var(--color-grass)]">Privacy Policy</Link>.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-brutal w-full mt-4 bg-[var(--color-grass)] text-[#111] font-anton text-2xl uppercase tracking-widest py-4 rounded-xl disabled:opacity-50">
            {loading ? "PROCESSING..." : "INITIALIZE MY ACCOUNT"}
          </button>
        </form>

        <p className="text-center font-poppins text-sm text-gray-500 mt-8">
          Already have clearance? <Link href="/login" className="font-bold text-[#111] underline hover:text-[var(--color-grass)] transition-colors">Log In here</Link>
        </p>
      </div>
    </div>
  );
}
