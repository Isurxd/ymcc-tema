"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { FaUserCircle, FaTrophy, FaFileAlt, FaArrowLeft, FaSignOutAlt, FaSpinner, FaDownload, FaEnvelope } from "react-icons/fa";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import QRCodeLib from "qrcode";
import jsPDF from "jspdf";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Portal() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driveLink, setDriveLink] = useState("");
  const [submittingLink, setSubmittingLink] = useState(false);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "" });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  
  const [editProfileModal, setEditProfileModal] = useState({ isOpen: false, data: {} });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  
  // APIs for dynamic dropdowns
  const [countriesList, setCountriesList] = useState(["Indonesia", "Malaysia", "Singapore", "Thailand", "Philippines", "Australia", "Japan", "South Korea", "China", "United States", "United Kingdom", "Other"]);
  const [universityResults, setUniversityResults] = useState([]);
  const [isSearchingUniv, setIsSearchingUniv] = useState(false);
  
  // Indonesian Region APIs
  const [provincesList, setProvincesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);

  // Profile completion fields
  const profileFields = [
    "fullName", "studentId", "whatsapp", "institution", "educationLevel",
    "country", "province", "city"
  ];

  const calculateProgress = () => {
    if (!userData) return 0;
    const filled = profileFields.filter(field => userData[field] && userData[field].toString().trim() !== "").length;
    return Math.round((filled / profileFields.length) * 100);
  };

  const progress = calculateProgress();

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
    
    // Fetch Provinces
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

  // Fetch Cities when Province changes
  useEffect(() => {
    if (editProfileModal.data.provinceId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${editProfileModal.data.provinceId}.json`)
        .then(res => res.json())
        .then(data => setCitiesList(data))
        .catch(console.warn);
    } else {
      setCitiesList([]);
      setDistrictsList([]);
      setVillagesList([]);
    }
  }, [editProfileModal.data.provinceId]);

  // Fetch Districts when City changes
  useEffect(() => {
    if (editProfileModal.data.cityId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${editProfileModal.data.cityId}.json`)
        .then(res => res.json())
        .then(data => setDistrictsList(data))
        .catch(console.warn);
    } else {
      setDistrictsList([]);
      setVillagesList([]);
    }
  }, [editProfileModal.data.cityId]);

  // Fetch Villages when District changes
  useEffect(() => {
    if (editProfileModal.data.districtId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${editProfileModal.data.districtId}.json`)
        .then(res => res.json())
        .then(data => setVillagesList(data))
        .catch(console.warn);
    } else {
      setVillagesList([]);
    }
  }, [editProfileModal.data.districtId]);

  useEffect(() => {
    if (editProfileModal.isOpen && editProfileModal.data.educationLevel === "Undergraduate" && editProfileModal.data.institution && editProfileModal.data.institution.length > 2) {
      const fetchUnivs = async () => {
        setIsSearchingUniv(true);
        try {
          const countryQuery = editProfileModal.data.country && editProfileModal.data.country !== "Other" ? `&country=${encodeURIComponent(editProfileModal.data.country)}` : "";
          const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(editProfileModal.data.institution)}${countryQuery}`);
          const data = await res.json();
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
      setUniversityResults([]);
    }
  }, [editProfileModal.data.institution, editProfileModal.data.educationLevel, editProfileModal.data.country, editProfileModal.isOpen]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      
      // Check if user is staff/operator
      if (currentUser.email) {
        const staffDocRef = doc(db, "staff_applications", currentUser.email);
        const staffSnap = await getDoc(staffDocRef);
        if (["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(currentUser.email) || 
           (staffSnap.exists() && staffSnap.data().status === "APPROVED" && (staffSnap.data().role === "Operator" || staffSnap.data().role === "Admin"))) {
          setIsStaff(true);
        }
      }

      try {
        // Fetch user metadata real-time
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubUserData = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            router.push("/register");
          }
        });

        // Fetch competitions
        const q = query(collection(db, "activities"), where("type", "==", "COMPETITIONS"));
        const snapshot = await getDocs(q);
        const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompetitions(comps);

        // Fetch User Orders
        const qOrders = query(collection(db, "Orders"), where("userDetails.email", "==", currentUser.email));
        const unsubOrders = onSnapshot(qOrders, (snap) => {
            setUserOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Fetch Support Tickets
        const qTickets = query(collection(db, "support_tickets"), where("email", "==", currentUser.email));
        const unsubTickets = onSnapshot(qTickets, (snap) => {
            setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.createdAt - a.createdAt));
        });

      } catch (err) {
        console.error("Error fetching portal data:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleCheckout = async (comp) => {
    try {
      const payload = {
        items: [{ id: comp.id, name: comp.title, price: 150000, quantity: 1 }], // Assuming standard fee
        userDetails: { name: userData?.fullName, email: userData?.email, phone: userData?.whatsapp },
        deliveryMethod: "digital"
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success && data.checkoutUrl) {
        router.push(data.checkoutUrl);
      } else {
        toast.error("Checkout failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error initiating checkout.");
    }
  };

  const handleSubmitDriveLink = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
        toast.error("Please select a file to upload.");
        return;
    }
    if (submissionFile.size > 25 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 25MB.");
        return;
    }

    setSubmittingLink(true);
    const toastId = toast.loading("Uploading submission to cloud...");
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `competition_submissions/${user.uid}_${Date.now()}_${submissionFile.name}`);
      await uploadBytes(storageRef, submissionFile);
      const downloadUrl = await getDownloadURL(storageRef);

      await setDoc(doc(db, "competition_documents", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: userData?.fullName,
        studentId: userData?.studentId,
        driveLink: downloadUrl,
        fileName: submissionFile.name,
        status: "PENDING_VERIFICATION",
        submittedAt: new Date().toISOString()
      }, { merge: true });

      toast.dismiss(toastId);
      toast.success("Document submitted successfully! Waiting for Admin verification.");
      
      setUserData(prev => ({ ...prev, documentLink: downloadUrl, documentStatus: "PENDING_VERIFICATION" }));
      setSubmissionFile(null);
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Failed to submit document.");
    } finally {
        setSubmittingLink(false);
    }
  };

  const handleSubmitTicket = async (e) => {
      e.preventDefault();
      if (!ticketForm.subject || !ticketForm.message) return;
      setSubmittingTicket(true);
      try {
          await setDoc(doc(collection(db, "support_tickets")), {
              uid: user.uid,
              email: user.email,
              subject: ticketForm.subject,
              message: ticketForm.message,
              status: "OPEN",
              createdAt: new Date().toISOString()
          });
          toast.success("Support ticket submitted!");
          setTicketForm({ subject: "", message: "" });
      } catch (err) {
          toast.error("Failed to submit ticket.");
      }
      setSubmittingTicket(false);
  };

  const generateCertificate = () => {
      const toastId = toast.loading("Generating E-Certificate...");
      try {
          const pdf = new jsPDF({
              orientation: "landscape",
              unit: "mm",
              format: "a4"
          });
          
          pdf.setFillColor("#000000");
          pdf.rect(0, 0, 297, 210, "F");
          
          pdf.setFillColor("#c1ff00");
          pdf.rect(0, 0, 20, 210, "F");
          
          pdf.setTextColor("#c1ff00");
          pdf.setFontSize(40);
          pdf.setFont("helvetica", "bold");
          pdf.text("CERTIFICATE OF PARTICIPATION", 30, 50);
          
          pdf.setTextColor("#ffffff");
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "normal");
          pdf.text("This is proudly presented to:", 30, 80);
          
          pdf.setTextColor("#ffffff");
          pdf.setFontSize(32);
          pdf.setFont("helvetica", "bold");
          pdf.text(userData?.fullName?.toUpperCase() || "PARTICIPANT", 30, 100);
          
          pdf.setTextColor("#888888");
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "normal");
          pdf.text(`For attending and actively participating in YMCC VII.`, 30, 120);
          pdf.text(`Institution: ${userData?.institution || "N/A"}`, 30, 130);
          
          pdf.save(`YMCC_Certificate_${userData?.fullName?.replace(/\s+/g, '_')}.pdf`);
          toast.dismiss(toastId);
          toast.success("E-Certificate downloaded successfully!");
      } catch (err) {
          toast.dismiss(toastId);
          toast.error("Failed to generate certificate.");
      }
  };

  const generateInvoice = (order) => {
      const toastId = toast.loading("Generating Invoice PDF...");
      try {
          const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(24);
          pdf.setTextColor(0, 0, 0);
          pdf.text("YMCC VII INVOICE", 105, 30, { align: "center" });

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "normal");
          pdf.text(`Order ID: ${order.id}`, 20, 50);
          pdf.text(`Date: ${order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : "-"}`, 20, 58);
          pdf.text(`Status: ${order.status}`, 20, 66);

          pdf.setFont("helvetica", "bold");
          pdf.text("Customer Details", 20, 80);
          pdf.setFont("helvetica", "normal");
          pdf.text(`Name: ${order.userDetails?.name || "-"}`, 20, 88);
          pdf.text(`Email: ${order.userDetails?.email || "-"}`, 20, 96);
          pdf.text(`Phone: ${order.userDetails?.phone || "-"}`, 20, 104);

          let y = 120;
          pdf.setFont("helvetica", "bold");
          pdf.text("Item", 20, y);
          pdf.text("Qty", 120, y);
          pdf.text("Price", 150, y);
          pdf.text("Total", 180, y);
          
          pdf.line(20, y + 2, 190, y + 2);
          y += 10;

          pdf.setFont("helvetica", "normal");
          let totalCalc = 0;
          order.items?.forEach(item => {
              const itemTotal = item.price * item.quantity;
              totalCalc += itemTotal;
              pdf.text(item.name + (item.size ? ` (Size: ${item.size})` : ""), 20, y);
              pdf.text(item.quantity.toString(), 120, y);
              pdf.text(`Rp ${item.price.toLocaleString()}`, 150, y);
              pdf.text(`Rp ${itemTotal.toLocaleString()}`, 180, y);
              y += 10;
          });

          pdf.line(20, y, 190, y);
          y += 10;

          if (order.shippingCost > 0) {
              pdf.text("Shipping Fee", 20, y);
              pdf.text(`Rp ${order.shippingCost.toLocaleString()}`, 180, y);
              totalCalc += order.shippingCost;
              y += 10;
          }

          pdf.setFont("helvetica", "bold");
          pdf.text("Grand Total", 20, y);
          pdf.text(`Rp ${totalCalc.toLocaleString()}`, 180, y);

          pdf.save(`YMCC_Invoice_${order.id}.pdf`);
          toast.dismiss(toastId);
          toast.success("Invoice downloaded successfully!");
      } catch (err) {
          toast.dismiss(toastId);
          toast.error("Failed to generate invoice.");
      }
  };

  const downloadIdCard = async () => {
    try {
      const toastId = toast.loading("Generating VIP ID Card...");

      // Ensure fonts are loaded before calculating dimensions
      await document.fonts.ready;

      // Prefetch images as base64 to avoid html2canvas CORS issues
      const fetchBase64 = (url) => new Promise((resolve) => {
        if (!url) return resolve("");
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const cvs = document.createElement("canvas");
          cvs.width = img.width; cvs.height = img.height;
          cvs.getContext("2d").drawImage(img, 0, 0);
          resolve(cvs.toDataURL("image/png"));
        };
        img.onerror = () => {
          if (url.startsWith('/api/proxy-image') || url.startsWith('/')) {
             return resolve("");
          }
          const proxyImg = new Image();
          proxyImg.crossOrigin = "Anonymous";
          proxyImg.onload = () => {
            const cvs = document.createElement("canvas");
            cvs.width = proxyImg.width; cvs.height = proxyImg.height;
            cvs.getContext("2d").drawImage(proxyImg, 0, 0);
            resolve(cvs.toDataURL("image/png"));
          };
          proxyImg.onerror = () => resolve("");
          proxyImg.src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        };
        img.src = url;
      });

      const logoB64 = await fetchBase64("/logo.png");
      let photoB64 = "";
      if (userData?.profilePhotoUrl) {
        photoB64 = await fetchBase64(userData.profilePhotoUrl);
      }

      // Generate QR
      const verifyUrl = `https://ymccvii.com/verify?id=${user?.uid || "invalid"}`;
      const qrDataUrl = await QRCodeLib.toDataURL(verifyUrl, { margin: 0, width: 300, color: { dark: '#000000', light: '#ffffff' } });

      // Create a hidden container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      
      const html = `
        <div id="id-card-render" style="width: 860px; height: 540px; background-color: #fff; border-radius: 20px; overflow: hidden; position: relative; font-family: var(--font-poppins), sans-serif;">
          
          <!-- Base Pattern Background -->
          <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0; z-index: 0;">
            <defs>
              <pattern id="bg-pattern" width="80" height="120" patternUnits="userSpaceOnUse">
                <rect width="80" height="120" fill="#ff4d00" />
                <polygon points="0,60 80,0 80,60 0,120" fill="#c1ff00" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-pattern)" />
          </svg>

          <!-- White Overlay Shape -->
          <svg viewBox="0 0 860 540" style="position: absolute; top: 0; left: 0; z-index: 1;">
            <path d="M-10,250 L390,250 C480,250 560,130 650,130 L870,130 L870,550 L-10,550 Z" fill="#ffffff" />
          </svg>
          
          <!-- Content Container (Z-Index 2) -->
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2;">
            
            <!-- Top Right Circle -->
            <div style="position: absolute; right: 40px; top: 25px; width: 30px; height: 30px; background: #c1ff00; border-radius: 50%; border: 4px solid #111; box-shadow: 4px 4px 0 #111;"></div>

            <!-- Logo -->
            ${logoB64 ? `<img src="${logoB64}" style="position: absolute; right: 60px; top: 160px; height: 35px; object-fit: contain;" />` : ''}

            <!-- Photo -->
            <div style="position: absolute; left: 50px; top: 45px; width: 170px; height: 230px; border-radius: 20px; border: 4px solid #111; background: #5a22e6; overflow: hidden; display: flex; justify-content: center; align-items: center; z-index: 3;">
              ${photoB64 ? `<img src="${photoB64}" style="width: 100%; height: 100%; object-fit: cover;" />` : '<span style="color: #fff; font-weight: bold;">NO PHOTO</span>'}
            </div>

            <!-- Role Badge -->
            <div style="position: absolute; left: 235px; top: 215px; width: 150px; height: 28px; z-index: 3;">
              <svg width="100%" height="100%" viewBox="0 0 150 28" style="position: absolute; top: 0; left: 0; z-index: 0;">
                <rect width="150" height="28" rx="14" ry="14" fill="#c1ff00" />
              </svg>
              <div style="position: absolute; top: 5px; left: 0; width: 100%; text-align: center; z-index: 1;">
                <p style="font-family: var(--font-poppins), sans-serif; font-size: 14px; font-weight: 800; color: #111; margin: 0; line-height: 1;">Official Delegate</p>
              </div>
            </div>

            <!-- Name -->
            <div style="position: absolute; left: 235px; top: 260px; width: 575px;">
              <h2 id="card-name" style="font-family: var(--font-anton), sans-serif; font-size: 42px; margin: 0; padding: 10px 0; line-height: 1.4; color: #111; text-transform: uppercase; white-space: nowrap; width: 100%;">
                ${userData?.fullName || 'PARTICIPANT'}
              </h2>
            </div>

            <!-- Details: Col 1 -->
            <div style="position: absolute; left: 235px; top: 335px; width: 270px;">
              <p style="font-family: var(--font-poppins), sans-serif; font-size: 14px; color: #777; font-weight: 700; margin: 0; line-height: 1.2;">ID Number</p>
              <p id="card-id" style="font-family: var(--font-poppins), sans-serif; font-size: 20px; color: #111; font-weight: 600; margin: 0; padding: 2px 0; white-space: nowrap; width: 100%; line-height: 1.4;">${userData?.studentId || '-'}</p>
            </div>
            
            <div style="position: absolute; left: 235px; top: 395px; width: 270px;">
              <p style="font-family: var(--font-poppins), sans-serif; font-size: 14px; color: #777; font-weight: 700; margin: 0; line-height: 1.2;">Institution</p>
              <p id="card-institution" style="font-family: var(--font-poppins), sans-serif; font-size: 16px; color: #111; font-weight: 600; margin: 0; padding: 2px 0; width: 100%; text-transform: uppercase; line-height: 1.3;">${userData?.institution || '-'}</p>
            </div>

            <!-- Details: Col 2 -->
            <div style="position: absolute; left: 530px; top: 335px; width: 270px;">
              <p style="font-family: var(--font-poppins), sans-serif; font-size: 14px; color: #777; font-weight: 700; margin: 0; line-height: 1.2;">Phone</p>
              <p id="card-phone" style="font-family: var(--font-poppins), sans-serif; font-size: 20px; color: #111; font-weight: 600; margin: 0; padding: 2px 0; white-space: nowrap; width: 100%; line-height: 1.4;">${userData?.whatsapp || '-'}</p>
            </div>

            <div style="position: absolute; left: 530px; top: 395px; width: 270px;">
              <p style="font-family: var(--font-poppins), sans-serif; font-size: 14px; color: #777; font-weight: 700; margin: 0; line-height: 1.2;">Country</p>
              <p id="card-country" style="font-family: var(--font-poppins), sans-serif; font-size: 20px; color: #111; font-weight: 600; margin: 0; padding: 2px 0; white-space: nowrap; width: 100%; text-transform: uppercase; line-height: 1.4;">${userData?.country || 'Indonesia'}</p>
            </div>

            <!-- QR Code -->
            <div style="position: absolute; left: 50px; top: 290px; width: 170px; height: 170px;">
              <img id="qr-target" src="${qrDataUrl}" style="width: 100%; height: 100%; border: 4px solid #111; border-radius: 16px; padding: 8px; background: white;" />
            </div>

            <!-- Signature -->
            <div style="position: absolute; right: 50px; bottom: 30px;">
              <p style="font-family: var(--font-poppins), sans-serif; font-size: 12px; color: #111; font-weight: 800; margin: 0;">Yours Sincerely, YMCC Committee</p>
            </div>
          </div>
        </div>
      `;
      container.innerHTML = html;
      document.body.appendChild(container);

      // Auto-scale fonts to fit container
      const shrinkText = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        let fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        while (el.scrollWidth > el.clientWidth && fontSize > 10) {
          fontSize -= 1;
          el.style.fontSize = fontSize + "px";
        }
      };

      // Give the DOM a tiny fraction of a second to render layout before shrinking
      await new Promise(resolve => setTimeout(resolve, 50));
      
      shrinkText("card-name");
      shrinkText("card-id");
      // We do NOT shrink card-institution because it is allowed to wrap to multiple lines!
      shrinkText("card-phone");
      shrinkText("card-country");

      // Small delay for stability
      await new Promise(resolve => setTimeout(resolve, 50));

      const html2canvas = (await import("html2canvas")).default;
      const cardElement = document.getElementById("id-card-render");
      const canvas = await html2canvas(cardElement, {
        scale: 2, // Retain high resolution for printing
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      document.body.removeChild(container);
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [86, 54]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 86, 54);
      
      const cleanName = (userData?.fullName || 'Participant').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Delegate_Pass_YMCCVII_2026_${cleanName}.pdf`);
      toast.dismiss(toastId);
      toast.success("ID Card downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Failed to generate ID card");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    let finalPhotoUrl = editProfileModal.data.profilePhotoUrl || null;
    
    if (profilePhotoFile) {
      if (profilePhotoFile.size > 200 * 1024) {
        toast.error("Profile photo must be under 200KB!");
        return;
      }
      setSavingProfile(true);
      try {
        const toastId = toast.loading("Uploading formal photo...");
        const photoRef = ref(storage, `profiles/${user.uid}_${Date.now()}`);
        await uploadBytes(photoRef, profilePhotoFile);
        finalPhotoUrl = await getDownloadURL(photoRef);
        toast.dismiss(toastId);
      } catch (err) {
        setSavingProfile(false);
        toast.error("Failed to upload photo.");
        return;
      }
    }

    setSavingProfile(true);
    try {
      const updatedData = { ...editProfileModal.data, profilePhotoUrl: finalPhotoUrl };
      await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
      setUserData(updatedData);
      setEditProfileModal({ isOpen: false, data: {} });
      setProfilePhotoFile(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    }
    setSavingProfile(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col p-6 items-center">
        <div className="w-full max-w-6xl flex justify-between items-center bg-gray-200 animate-pulse h-16 rounded-lg mb-8 mt-16"></div>
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl">
          <div className="w-full lg:w-1/3 h-96 bg-gray-200 animate-pulse rounded-3xl"></div>
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="w-full h-40 bg-gray-200 animate-pulse rounded-2xl"></div>
            <div className="w-full h-40 bg-gray-200 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* CUSTOM PORTAL HEADER */}
      <nav className="bg-black text-white px-6 py-4 flex justify-between items-center border-b-4 border-[#c1ff00] sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-anton text-2xl tracking-widest text-[#c1ff00] hover:text-white transition-colors">YMCC VII</Link>
          <span className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold uppercase tracking-widest hidden sm:inline-block">Participant Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/">
            <button className="text-xs font-bold uppercase text-gray-300 hover:text-[#c1ff00] transition-colors flex items-center gap-2">
              <FaArrowLeft /> Back to Home
            </button>
          </Link>
          <button onClick={() => auth.signOut()} className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center gap-2">
            <FaSignOutAlt /> <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </div>
      </nav>

      {/* STAFF ROLE SWITCHER BANNER */}
      {isStaff && (
        <div className="bg-[#c1ff00] text-black px-6 py-3 flex flex-col sm:flex-row justify-between items-center border-b-4 border-black font-poppins gap-3">
          <p className="font-bold text-sm uppercase tracking-widest"><FaTrophy className="inline mb-1 mr-2"/> You have Operator / Admin Clearance</p>
          <Link href="/operator">
            <button className="bg-black text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-gray-800 shadow-[2px_2px_0_0_rgba(255,255,255,0.3)] border border-gray-700">
              Switch to Operator Dashboard
            </button>
          </Link>
        </div>
      )}

      <div className="flex-1 max-w-6xl w-full mx-auto p-6 pt-8 space-y-8">
        
        {/* Title */}
        <div className="border-b-2 border-black pb-6">
          <h1 className="font-anton text-5xl uppercase tracking-wide">Command Center</h1>
          <p className="font-poppins text-gray-500 font-medium mt-2">Manage your complete profile, registrations, and competition documents here.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile & Event Pass */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white border-2 border-black rounded-3xl p-6 md:p-8 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-4 mb-6">
                <FaUserCircle size={48} className="text-gray-300" />
                <div>
                  <h2 className="font-poppins font-bold text-lg leading-tight uppercase">{userData?.fullName || "UNKNOWN PARTICIPANT"}</h2>
                  <p className="text-xs text-gray-500">{userData?.studentId}</p>
                </div>
              </div>

              {/* Status and Notes */}
              {userData?.registrationStatus === "NEEDS REVISION" && (
                <div className="mb-6 bg-orange-100 border-2 border-orange-500 p-4 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-1">Status: Needs Revision</p>
                  <p className="text-sm text-orange-900 font-medium"><strong>Admin Note:</strong> {userData?.verificationNote || "Please update your profile data."}</p>
                </div>
              )}
              {userData?.registrationStatus === "VERIFIED" && (
                <div className="mb-6 bg-green-100 border-2 border-green-500 p-4 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">Status: Verified</p>
                  <p className="text-sm text-green-900 font-medium">Your profile has been fully verified.</p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  <span>Profile Completion</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-200">
                  <div className="bg-[#c1ff00] h-2 rounded-full transition-all duration-500 border-r border-black" style={{ width: `${progress}%` }}></div>
                </div>
                {progress < 100 && <p className="text-xs text-orange-500 font-medium mt-2">Complete your profile to unlock all features.</p>}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Institution</p>
                  <p className="font-semibold text-sm">{userData?.institution} ({userData?.educationLevel})</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Country</p>
                  <p className="font-semibold text-sm">{userData?.country}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                  <span className="inline-block px-2 py-1 mt-1 bg-[#c1ff00] text-black text-xs font-bold rounded">
                    {userData?.registrationStatus || "UNVERIFIED"}
                  </span>
                </div>
              </div>

              <button onClick={() => setEditProfileModal({ isOpen: true, data: userData || {} })} className="w-full mt-8 bg-black text-white font-bold uppercase py-3 rounded-xl text-sm hover:bg-gray-800 transition-colors">
                Edit Complete Biodata
              </button>
            </div>

            {/* Event Pass & Certificate Card */}
            {userData?.registrationStatus === "VERIFIED" ? (
              <div className="bg-[#c1ff00] border-2 border-black rounded-3xl p-6 md:p-8 shadow-[4px_4px_0_0_#000] text-center flex flex-col items-center">
                <h3 className="font-anton text-2xl uppercase mb-4 tracking-wide">My Event Pass</h3>
                <div className="bg-white p-4 rounded-2xl border-2 border-black inline-block mb-4">
                  <QRCode value={user?.uid || "invalid"} size={160} />
                </div>
                <p className="font-poppins text-xs font-bold uppercase tracking-widest mb-4">Show this QR Code at the venue</p>
                {userData?.attendance && (
                  <div className="mb-4 bg-black text-[#c1ff00] px-4 py-2 rounded-xl text-sm font-bold uppercase w-full">
                    Status: Checked In
                  </div>
                )}
                
                <div className="w-full flex flex-col gap-3">
                  <button onClick={downloadIdCard} className="w-full flex items-center justify-center gap-2 bg-white text-black border-2 border-black font-bold uppercase py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                    <FaDownload /> Download ID Card (PDF)
                  </button>
                  {userData?.attendance && (
                    <button onClick={generateCertificate} className="w-full flex items-center justify-center gap-2 bg-black text-[#c1ff00] border-2 border-black font-bold uppercase py-3 rounded-xl text-sm hover:bg-gray-900 transition-colors">
                      <FaDownload /> Download E-Certificate
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-3xl p-6 md:p-8 text-center flex flex-col items-center">
                <h3 className="font-anton text-xl text-gray-400 uppercase mb-2">Event Pass Locked</h3>
                <p className="font-poppins text-xs text-gray-500 font-medium">Your profile must be VERIFIED by the admin to unlock your QR Event Pass.</p>
              </div>
            )}
          </div>

          {/* Competitions */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-anton text-3xl uppercase tracking-wide flex items-center gap-3">
              <FaTrophy /> Available Competitions
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {competitions.map((comp) => (
                <div key={comp.id} className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0_0_#000] flex flex-col justify-between">
                  <div>
                    {comp.icon && <img src={comp.icon} alt={comp.title} className="w-12 h-12 mb-4" />}
                    <h3 className="font-poppins font-bold text-xl uppercase mb-2 leading-tight">{comp.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{comp.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleCheckout(comp)} 
                    className="w-full bg-black text-white font-bold uppercase py-3 rounded-xl hover:bg-[#c1ff00] hover:text-black transition-colors"
                  >
                    Register & Pay
                  </button>
                </div>
              ))}
              {competitions.length === 0 && (
                <div className="col-span-2 bg-[#111] text-white border-2 border-black rounded-3xl p-6 sm:p-12 shadow-[4px_4px_0_0_#000] flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-[#c1ff00]"></div>
                  <FaTrophy className="text-6xl text-[#c1ff00] mb-6 opacity-80" />
                  <h3 className="font-anton text-4xl uppercase tracking-wide mb-3">Compete Globally</h3>
                  <p className="font-poppins text-sm text-gray-400 max-w-md">Our international competitions are currently being prepared. Stay tuned for the biggest mining challenge of the year.</p>
                  <div className="mt-8 inline-block bg-[#222] text-[#c1ff00] font-bold uppercase tracking-widest text-xs px-6 py-2 rounded-full border border-gray-700">
                    COMING SOON
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 bg-white border-2 border-black p-6 md:p-8 rounded-2xl shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-4 mb-4">
                <FaFileAlt className="text-[#c1ff00] text-3xl" />
                <h4 className="font-anton text-2xl uppercase tracking-wide">Competition Document Submission</h4>
              </div>
              <p className="text-sm font-poppins text-gray-600 mb-6">
                Please upload your competition file (PDF/PPT) here. Maximum file size is 25MB.<br/>
                <span className="text-gray-500 font-medium">You can re-upload your file before the deadline to replace the old one.</span> 
                {userData?.documentStatus === "VERIFIED" && <span className="text-green-600 font-bold block mt-2">✅ Your document has been VERIFIED by the judges.</span>}
                {userData?.documentStatus === "PENDING_VERIFICATION" && <span className="text-orange-500 font-bold block mt-2">⏳ Your document is under review.</span>}
              </p>
              
              <form onSubmit={handleSubmitDriveLink} className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="file" 
                  required 
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
                  onChange={(e) => setSubmissionFile(e.target.files[0])}
                  className="flex-1 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] bg-gray-50"
                />
                <button 
                  type="submit" 
                  disabled={submittingLink || !submissionFile}
                  className="bg-[#c1ff00] text-black font-bold uppercase px-6 py-3 rounded-xl hover:bg-black hover:text-[#c1ff00] border-2 border-black transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {submittingLink ? "Uploading..." : "Upload File"}
                </button>
              </form>
              
              {userData?.documentStatus && (
                <div className={`mt-6 p-4 rounded-xl border-2 font-poppins text-sm font-bold ${
                  userData.documentStatus === 'VERIFIED' ? 'bg-green-100 border-green-500 text-green-700' :
                  userData.documentStatus === 'REJECTED' ? 'bg-red-100 border-red-500 text-red-700' :
                  'bg-yellow-100 border-yellow-500 text-yellow-700'
                }`}>
                  Document Status: {userData.documentStatus}
                  {userData.documentStatus === 'VERIFIED' && " - Your documents have been verified. Good luck in the competition!"}
                  {userData.documentStatus === 'REJECTED' && " - There was an issue with your documents. Please check your email or update your link."}
                  {userData.documentStatus === 'PENDING_VERIFICATION' && " - Waiting for Admin review."}
                </div>
              )}
            </div>

            {/* User Orders Section */}
            {userOrders.length > 0 && (
                <div className="mt-8 bg-white border-2 border-black p-6 md:p-8 rounded-2xl shadow-[4px_4px_0_0_#000]">
                  <h4 className="font-anton text-2xl uppercase tracking-wide mb-6">My Merchandise Orders</h4>
                  <div className="space-y-4">
                    {userOrders.map(order => (
                        <div key={order.id} className="border-2 border-gray-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Order #{order.id}</p>
                                <p className="font-bold text-lg">Total: Rp {order.totalAmount?.toLocaleString()}</p>
                                <p className={`text-xs font-bold px-2 py-1 inline-block mt-2 rounded ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {order.status}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {order.status === 'PENDING_PAYMENT' && order.checkoutUrl && (
                                    <a href={order.checkoutUrl} className="bg-black text-[#c1ff00] text-sm font-bold px-4 py-2 rounded-xl uppercase hover:bg-gray-800 border-2 border-transparent">
                                        Pay Now
                                    </a>
                                )}
                                {order.status === 'PAID' && (
                                    <button onClick={() => generateInvoice(order)} className="bg-white border-2 border-black text-black text-sm font-bold px-4 py-2 rounded-xl uppercase hover:bg-gray-100 flex items-center gap-2">
                                        <FaDownload /> Invoice (PDF)
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {/* Support Tickets Section */}
            <div className="mt-8 bg-white border-2 border-black p-6 md:p-8 rounded-2xl shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-4 mb-4">
                <FaEnvelope className="text-[#c1ff00] text-3xl" />
                <h4 className="font-anton text-2xl uppercase tracking-wide">Live Helpdesk</h4>
              </div>
              <p className="text-sm font-poppins text-gray-600 mb-6">Need assistance? Submit a ticket and our staff will reply shortly.</p>
              
              <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 p-4 rounded-xl mb-6 font-poppins text-sm">
                <strong>Attention:</strong> Admin replies will not appear on this website. Answers or solutions to your ticket will be sent directly to your registered <strong>WhatsApp</strong> number or <strong>Email</strong> within 24 Hours.
              </div>
              <form onSubmit={handleSubmitTicket} className="flex flex-col gap-4 mb-8">
                <input 
                  type="text" 
                  required 
                  placeholder="Ticket Subject" 
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  className="w-full border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00]"
                />
                <textarea 
                  required 
                  rows="3"
                  placeholder="How can we help you?" 
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                  className="w-full border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00]"
                ></textarea>
                <button 
                  type="submit" 
                  disabled={submittingTicket}
                  className="self-end bg-black text-white font-bold uppercase px-8 py-3 rounded-xl hover:bg-[#c1ff00] hover:text-black border-2 border-transparent hover:border-black transition-colors disabled:opacity-50"
                >
                  {submittingTicket ? "Sending..." : "Submit Ticket"}
                </button>
              </form>

              {tickets.length > 0 && (
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold">{ticket.subject}</h5>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-700' : ticket.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{ticket.status}</span>
                      </div>
                      <p className="text-sm text-gray-600">{ticket.message}</p>
                      {ticket.reply && (
                        <div className="mt-4 bg-gray-50 border-l-4 border-[#c1ff00] p-3 rounded-r-xl">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Staff Reply:</p>
                          <p className="text-sm">{ticket.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editProfileModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-3xl border-2 border-black shadow-[4px_4px_0_0_#000] relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-anton text-3xl uppercase mb-6 border-b-2 border-black pb-4 text-[#111]">Complete Your Biodata</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Formal Profile Photo (Red Background)</label>
                  <input type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files[0])} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" />
                  <p className="text-[10px] text-red-600 font-bold mt-1">STRICT: Max 200KB. Must be formal with SOLID RED background.</p>
                  {(editProfileModal.data.profilePhotoUrl || profilePhotoFile) && (
                    <div className="mt-2 text-xs font-bold text-green-600">Photo attached ✅</div>
                  )}
                </div>

<div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Full Legal Name</label><input required className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.fullName || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, fullName: e.target.value.toUpperCase()}})} /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Student ID / Passport Number</label><input required className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.studentId || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, studentId: e.target.value}})} /></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">WhatsApp Number</label><input required className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.whatsapp || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, whatsapp: e.target.value.replace(/\D/g, '')}})} /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Date of Birth</label><input type="date" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.birthDate || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, birthDate: e.target.value}})} /></div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Gender</label>
                  <select className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.gender || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, gender: e.target.value}})}>
                    <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Country</label>
                  <select required className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.country || "Indonesia"} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, country: e.target.value, province: e.target.value !== "Indonesia" ? "" : editProfileModal.data.province, provinceId: "", city: "", cityId: "", district: "", districtId: "", village: "", villageId: ""}})}>
                    {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {editProfileModal.data.country === "Indonesia" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Province</label>
                    <select className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" 
                      value={editProfileModal.data.provinceId || ""} 
                      onChange={e => {
                        const sel = provincesList.find(p => p.id === e.target.value);
                        setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, provinceId: sel?.id || "", province: sel?.name || "", cityId: "", city: "", districtId: "", district: "", villageId: "", village: ""}});
                      }}>
                      <option value="">Select Province</option>
                      {provincesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {editProfileModal.data.country === "Indonesia" && editProfileModal.data.provinceId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">City / Regency</label>
                    <select className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" 
                      value={editProfileModal.data.cityId || ""} 
                      onChange={e => {
                        const sel = citiesList.find(p => p.id === e.target.value);
                        setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, cityId: sel?.id || "", city: sel?.name || "", districtId: "", district: "", villageId: "", village: ""}});
                      }}>
                      <option value="">Select City</option>
                      {citiesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">District (Kecamatan)</label>
                    <select className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" 
                      value={editProfileModal.data.districtId || ""} 
                      onChange={e => {
                        const sel = districtsList.find(p => p.id === e.target.value);
                        setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, districtId: sel?.id || "", district: sel?.name || "", villageId: "", village: ""}});
                      }}>
                      <option value="">Select District</option>
                      {districtsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Village (Desa/Kel.)</label>
                    <select className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" 
                      value={editProfileModal.data.villageId || ""} 
                      onChange={e => {
                        const sel = villagesList.find(p => p.id === e.target.value);
                        setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, villageId: sel?.id || "", village: sel?.name || ""}});
                      }}>
                      <option value="">Select Village</option>
                      {villagesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Full Residential Address</label><textarea rows="2" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.address || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, address: e.target.value}})}></textarea></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Institution / University</label>
                  <input required className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.institution || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, institution: e.target.value}})} />
                  {isSearchingUniv && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
                  {universityResults.length > 0 && editProfileModal.data.educationLevel === "Undergraduate" && (
                    <ul className="absolute z-10 w-full md:w-1/2 bg-white border border-gray-200 mt-1 max-h-40 overflow-y-auto rounded-lg shadow-lg">
                      {universityResults.map((univ, idx) => (
                        <li key={idx} className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => { setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, institution: univ}}); setUniversityResults([]); }}>
                          {univ}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Education Level</label>
                  <select required className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c1ff00] outline-none" value={editProfileModal.data.educationLevel || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, educationLevel: e.target.value}})}>
                    <option value="">Select Level</option><option value="High School">High School</option><option value="Undergraduate">Undergraduate</option><option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200">
                <h4 className="font-anton uppercase tracking-wide mb-4">Additional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">T-Shirt Size</label><select className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm" value={editProfileModal.data.tshirtSize || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, tshirtSize: e.target.value}})}><option value="">Select Size</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option></select></div>
                  <div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Dietary Restrictions</label><input placeholder="e.g., None, Vegetarian, Halal" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm" value={editProfileModal.data.dietary || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, dietary: e.target.value}})} /></div>
                  <div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Medical History</label><input placeholder="e.g., None, Asthma, Diabetes" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm" value={editProfileModal.data.medicalHistory || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, medicalHistory: e.target.value}})} /></div>
                </div>
                <div><label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Emergency Contact (Name & Phone)</label><input placeholder="e.g., Jane Doe (+62 812...)" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm" value={editProfileModal.data.emergencyContact || ""} onChange={e => setEditProfileModal({...editProfileModal, data: {...editProfileModal.data, emergencyContact: e.target.value}})} /></div>
              </div>

              <div className="flex gap-4 pt-6 border-t-2 border-black">
                <button type="button" onClick={() => setEditProfileModal({isOpen:false, data:{}})} className="flex-1 bg-white border-2 border-black text-black font-bold uppercase py-4 rounded-xl hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={savingProfile} className="flex-1 bg-[#c1ff00] border-2 border-black text-black font-bold uppercase py-4 rounded-xl hover:bg-[#a0d900] shadow-[4px_4px_0_0_#000] disabled:opacity-50">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM PORTAL FOOTER */}
      <footer className="mt-16 border-t-2 border-gray-200 py-8 text-center bg-white w-full">
        <p className="font-anton text-3xl uppercase tracking-widest text-gray-300 mb-2">YMCC VII</p>
        <p className="font-poppins text-xs text-gray-400 font-medium uppercase tracking-wider">Participant Command Portal &copy; 2026. All Systems Operational.</p>
      </footer>
    </div>
  );
}
