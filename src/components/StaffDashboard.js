"use client";

import { useState, useEffect, useMemo } from "react";
import imageCompression from 'browser-image-compression';
import { auth, db, storage, secondaryAuth } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, createUserWithEmailAndPassword, updatePassword, updateEmail } from "firebase/auth";
import { FaEdit, FaTrash, FaPlus, FaSignOutAlt, FaTimes, FaCheck, FaTimesCircle, FaNewspaper, FaQuestionCircle, FaHandshake, FaTrophy, FaUsers, FaTasks, FaCog, FaChartBar, FaQrcode, FaCamera, FaEnvelope, FaPaperPlane, FaFileAlt, FaSearch, FaDownload } from "react-icons/fa";
import { Scanner } from '@yudiel/react-qr-scanner';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function StaffDashboard({ portalType = "operator" }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // QR Scanner States
  const [scannedUser, setScannedUser] = useState(null);
  const [scanMessage, setScanMessage] = useState("");
  const [scannerActive, setScannerActive] = useState(true);

  // Broadcast States
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("ALL");

  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [activeTab, setActiveTab] = useState(portalType === "admin" ? "participants" : portalType === "fundraising" ? "merch_orders" : "dashboard");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [roleModal, setRoleModal] = useState({ isOpen: false, staffId: null, role: "Operator" });
  
  // DB State
  const [news, setNews] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [activities, setActivities] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [staffApps, setStaffApps] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [newsFeedback, setNewsFeedback] = useState([]);
  const [activityClicks, setActivityClicks] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [merchandise, setMerchandise] = useState([]);
  const [merchOrders, setMerchOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Enterprise States
  const [submissions, setSubmissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  // Helper: Audit Logger
  const logAuditAction = async (action, details) => {
    if (!userEmail) return;
    try {
      await addDoc(collection(db, "audit_logs"), {
        staffEmail: userEmail,
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to write audit log:", e);
    }
  };

  // Forms
  const initNews = { title: "", category: "ANNOUNCEMENTS", content: "", author: "Superadmin", imageUrl: "" };
  const initFaq = { q: "", a: "" };
  const initSponsor = { name: "", websiteUrl: "", imageUrl: "" };
  const initActivity = { type: "COMPETITIONS", title: "", description: "", timeline: "", buttonText: "DOWNLOAD GUIDELINES", guidebookUrl: "", icon: "", pills: [] };
  
  const [newsForm, setNewsForm] = useState(initNews);
  const [faqForm, setFaqForm] = useState(initFaq);
  const [sponsorForm, setSponsorForm] = useState({ name: "", type: "PLATINUM", logo: "" });
  const [merchForm, setMerchForm] = useState({ name: "", tagline: "", price: "", priceNumber: 0, category: "SAFETY WEAR", description: "", image: "" });
  const [activityForm, setActivityForm] = useState(initActivity);
  const [operatorForm, setOperatorForm] = useState({ email: "", password: "" });

  const [editStaffModal, setEditStaffModal] = useState({ isOpen: false, data: null });
  const [addStaffModal, setAddStaffModal] = useState({ isOpen: false, email: "", password: "", role: "Operator", name: "", nim: "", department: "", division: "", position: "Staff" });
  const [settingsForm, setSettingsForm] = useState({ newEmail: "", newPassword: "" });
  const [participantModal, setParticipantModal] = useState({ isOpen: false, data: {} });

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadGuidebook, setUploadGuidebook] = useState(null);
  const [bannerUploadFile, setBannerUploadFile] = useState(null);

  // Banners
  const [merchBanners, setMerchBanners] = useState([]);
  const [bannerForm, setBannerForm] = useState({ title: "", linkUrl: "", image: "" });

  // Helpdesk
  const [ticketModal, setTicketModal] = useState({ isOpen: false, ticketId: null, reply: "" });

  const router = useRouter();

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const cleanEmail = user.email ? user.email.toLowerCase().trim() : "";
        if (["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(cleanEmail)) {
           setIsAuthenticated(true);
           setUserEmail(user.email);
           setUserRole("Superadmin");
        } else {
           const staffDoc = await getDoc(doc(db, "staff_applications", user.email));
           if (staffDoc.exists() && staffDoc.data().status === "APPROVED" && (staffDoc.data().role === "Operator" || staffDoc.data().role === "Admin")) {
             setIsAuthenticated(true);
             setUserEmail(user.email);
             setUserRole(staffDoc.data().role);
           } else {
             setIsAuthenticated(false);
             setUserEmail("");
             setUserRole("");
             setErrorMsg("Access Denied: You are not an approved Operator or Admin.");
             signOut(auth);
             router.push("/staff");
           }
        }
      } else {
         setIsAuthenticated(false);
         setUserEmail("");
         router.push("/staff");
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setTimeout(() => {
      setLoadingData(true);
    }, 0);

    let unsubUsers = () => {};
    let unsubMerch = () => {};
    let unsubOrders = () => {};
    let unsubBanners = () => {};
    let unsubBroadcasts = () => {};
    let unsubSubmissions = () => {};
    let unsubAudit = () => {};
    let unsubTickets = () => {};

    if (portalType === "admin" || portalType === "master") {
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setParticipants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.role === "participant"));
      });
      unsubBroadcasts = onSnapshot(query(collection(db, "broadcasts"), orderBy("sentAt", "desc")), (snap) => {
        setBroadcasts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      unsubSubmissions = onSnapshot(query(collection(db, "competition_documents"), orderBy("submittedAt", "desc")), (snap) => {
        setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    
    if (portalType === "master") {
      unsubAudit = onSnapshot(query(collection(db, "audit_logs"), orderBy("timestamp", "desc")), (snap) => {
        setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    if (portalType === "fundraising" || portalType === "master") {
      unsubMerch = onSnapshot(collection(db, "merchandise"), (snap) => {
        setMerchandise(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      unsubOrders = onSnapshot(collection(db, "Orders"), (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMerchOrders(list);
        setOrders(list);
      });

      unsubBanners = onSnapshot(collection(db, "merch_banners"), (snap) => {
        setMerchBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    const unsubStaffApps = onSnapshot(collection(db, "staff_applications"), (snap) => {
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      apps.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : 0;
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : 0;
        return timeB - timeA;
      });
      setStaffApps(apps);
    });
    const unsubSubscribers = onSnapshot(collection(db, "subscribers"), (snap) => {
      setSubscribers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubFeedback = onSnapshot(collection(db, "newsFeedback"), (snap) => {
      setNewsFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubClicks = onSnapshot(collection(db, "activityClicks"), (snap) => {
      setActivityClicks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubNews = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubFaqs = onSnapshot(collection(db, "faqs"), (snap) => {
      setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSponsors = onSnapshot(collection(db, "sponsors"), (snap) => {
      setSponsors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubActivities = onSnapshot(collection(db, "activities"), (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubTickets = onSnapshot(query(collection(db, "support_tickets"), orderBy("createdAt", "desc")), (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Simulate loading finish
    setTimeout(() => setLoadingData(false), 800);

    return () => {
      unsubUsers(); unsubMerch(); unsubOrders(); unsubBanners();
      unsubStaffApps(); unsubSubscribers(); unsubFeedback(); unsubClicks();
      unsubNews(); unsubFaqs(); unsubSponsors(); unsubActivities(); unsubBroadcasts();
      unsubSubmissions(); unsubAudit(); unsubTickets();
    };
  }, [isAuthenticated, portalType]);

  const filteredData = useMemo(() => {
    const filterByDate = (items) => {
      if (dateFilter === "all") return items;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return items.filter(item => {
        if (!item.createdAt) return false;
        const itemDate = new Date(item.createdAt);
        if (dateFilter === "today") {
          return itemDate >= today;
        } else if (dateFilter === "yesterday") {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return itemDate >= yesterday && itemDate < today;
        } else if (dateFilter === "week") {
          const lastWeek = new Date(today);
          lastWeek.setDate(lastWeek.getDate() - 7);
          return itemDate >= lastWeek;
        } else if (dateFilter === "month") {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === "year") {
          return itemDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    };

    const fSubscribers = filterByDate(subscribers);
    const fNewsFeedback = filterByDate(newsFeedback);
    const fActivityClicks = filterByDate(activityClicks);
    const fActivities = filterByDate(activities);
    const fNews = filterByDate(news);
    const fSponsors = filterByDate(sponsors);
    const fOrders = filterByDate(orders);
    const fUsers = filterByDate(users);

    const feedbackPieData = [
      { name: 'Helpful', value: fNewsFeedback.filter(f => f.isHelpful).length },
      { name: 'Not Helpful', value: fNewsFeedback.filter(f => !f.isHelpful).length },
    ];

    const clickCounts = fActivityClicks.reduce((acc, click) => {
      acc[click.activityTitle] = (acc[click.activityTitle] || 0) + 1;
      return acc;
    }, {});
    
    const activityBarData = Object.entries(clickCounts).map(([title, clicks]) => ({
      name: title.length > 15 ? title.substring(0, 15) + '...' : title,
      clicks: clicks,
    })).sort((a, b) => b.clicks - a.clicks);
    
    // Fundraising Metrics
    const totalSales = fOrders.filter(o => o.status === "PAID" || o.status === "SETTLED").reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const paidOrdersCount = fOrders.filter(o => o.status === "PAID" || o.status === "SETTLED").length;
    const pendingOrdersCount = fOrders.filter(o => o.status === "PENDING_PAYMENT").length;

    // Admin Metrics
    const verifiedUsers = fUsers.filter(u => u.registrationStatus === "VERIFIED").length;
    const unverifiedUsers = fUsers.filter(u => u.registrationStatus === "UNVERIFIED" || !u.registrationStatus).length;
    const needsRevisionUsers = fUsers.filter(u => u.registrationStatus === "NEEDS REVISION").length;

    const verificationStatusData = [
      { name: 'VERIFIED', value: verifiedUsers },
      { name: 'UNVERIFIED', value: unverifiedUsers },
      { name: 'NEEDS REVISION', value: needsRevisionUsers },
    ];

    const demoDataObj = {};
    fUsers.forEach(u => {
      if(u.province) {
        demoDataObj[u.province] = (demoDataObj[u.province] || 0) + 1;
      }
    });
    const demographicData = Object.keys(demoDataObj).map(prov => ({ province: prov.substring(0, 15), count: demoDataObj[prov] })).sort((a,b) => b.count - a.count).slice(0, 5);

    const topNews = fNews.map(n => {
      const helps = fNewsFeedback.filter(f => f.articleId === n.id && f.isHelpful).length;
      return { ...n, helps };
    }).sort((a,b) => b.helps - a.helps).slice(0,5);

    // Fundraising Metrics
    const merchSalesObj = {};
    const paidOrders = fOrders.filter(o => o.status === "PAID" || o.status === "SETTLED");
    paidOrders.forEach(o => {
      if(o.items) {
        o.items.forEach(item => {
          merchSalesObj[item.name] = (merchSalesObj[item.name] || 0) + (item.quantity || 1);
        });
      }
    });
    const topMerch = Object.keys(merchSalesObj).map(name => ({ name: name.substring(0,10), sales: merchSalesObj[name] })).sort((a,b) => b.sales - a.sales).slice(0, 5);
    const lowStockItems = merchandise.filter(m => parseInt(m.stock || 0) <= 10);
    const aov = paidOrdersCount > 0 ? (totalSales / paidOrdersCount) : 0;
    
    const orderFunnelData = [
      { name: 'PENDING', count: pendingOrdersCount },
      { name: 'PAID', count: fOrders.filter(o => o.status === "PAID" && o.deliveryStatus === "PENDING").length },
      { name: 'FULFILLED', count: fOrders.filter(o => o.status === "SETTLED" || ["SHIPPED", "DELIVERED", "PICKED_UP"].includes(o.deliveryStatus)).length },
    ];

    // Master Metrics
    const funnelData = [
      { name: 'Subscribers', count: fSubscribers.length },
      { name: 'Registrations', count: fUsers.length },
      { name: 'Verified', count: verifiedUsers }
    ];

    const revenueByDateObj = {};
    paidOrders.forEach(o => {
      const d = o.createdAt?.toMillis ? new Date(o.createdAt.toMillis()).toLocaleDateString() : 'Unknown';
      revenueByDateObj[d] = (revenueByDateObj[d] || 0) + (o.totalAmount || 0);
    });
    const revenueTrend = Object.keys(revenueByDateObj).map(date => ({
      date, revenue: revenueByDateObj[date]
    }));

    return { 
      subscribersCount: fSubscribers.length, 
      activitiesCount: fActivities.length,
      newsCount: fNews.length,
      sponsorsCount: fSponsors.length,
      totalSales,
      paidOrdersCount,
      pendingOrdersCount,
      totalUsers: fUsers.length,
      verifiedUsers,
      unverifiedUsers,
      feedbackPieData, 
      activityBarData,
      rawClicksLength: fActivityClicks.length,
      rawFeedbackLength: fNewsFeedback.length,
      verificationStatusData,
      demographicData,
      topNews,
      topMerch,
      lowStockItems,
      aov,
      orderFunnelData,
      funnelData,
      revenueTrend
    };
  }, [dateFilter, subscribers, newsFeedback, activityClicks, activities, news, sponsors, orders, users, merchandise]);

  const handleUploadImage = async (file, folder) => {
    if (!storage) {
       console.error("Storage not initialized.");
       return null;
    }

    let fileToUpload = file;
    if (file.type.startsWith("image/")) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.error("Image compression error:", error);
      }
    }

    const storageRef = ref(storage, `${folder}/${Date.now()}_${fileToUpload.name}`);
    await uploadBytes(storageRef, fileToUpload);
    return await getDownloadURL(storageRef);
  };

  const resetForm = () => {
    setEditingId(null);
    setActivityForm({ title: "", type: "COMPETITIONS", date: "", description: "", maxParticipants: "", currentParticipants: 0, link: "" });
    setNewsForm({ title: "", content: "", date: "", author: "", category: "General", image: "" });
    setFaqForm({ q: "", a: "" });
    setSponsorForm({ name: "", type: "PLATINUM", logo: "" });
    setMerchForm({ name: "", tagline: "", price: "", priceNumber: 0, category: "SAFETY WEAR", description: "", image: "" });
    setUploadFile(null);
    setUploadGuidebook(null);
  };

  const handleLogin = async () => {
    if (!auth) {
      setErrorMsg("Firebase auth not initialized.");
      return;
    }
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setIsAuthenticated(false);
    setUserEmail("");
  };

  // MERCHANDISE CRUD
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let finalImageUrl = bannerForm.image;
      if (bannerUploadFile) {
        const url = await handleFileUpload(bannerUploadFile, "merch");
        if (url) finalImageUrl = url;
      }
      
      const dataToSave = { ...bannerForm, image: finalImageUrl, createdAt: new Date().toISOString() };
      
      if (editingId) {
        dataToSave.updatedAt = new Date().toISOString();
        await setDoc(doc(db, "merch_banners", editingId), dataToSave, { merge: true });
      } else {
        await addDoc(collection(db, "merch_banners"), dataToSave);
      }
      setBannerForm({ title: "", linkUrl: "", image: "" });
      setEditingId(null);
      setBannerUploadFile(null);
      toast.success("Banner saved successfully!");
      fetchData();
    } catch (err) {
      toast.error("Error saving banner.");
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await deleteDoc(doc(db, "merch_banners", id));
      toast.success("Banner deleted!");
      fetchData();
    } catch (err) {
      toast.error("Error deleting banner.");
      console.error(err);
    }
  };

  const handleSaveMerch = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let finalImageUrl = merchForm.image;
      if (uploadFile) {
        const url = await handleFileUpload(uploadFile, "merch");
        if (url) finalImageUrl = url;
      }

      let additionalImagesArray = merchForm.additionalImages;
      if (typeof additionalImagesArray === "string") {
        additionalImagesArray = additionalImagesArray.split(",").map(s => s.trim()).filter(Boolean);
      } else if (!additionalImagesArray) {
        additionalImagesArray = [];
      }

      const dataToSave = {
        ...merchForm,
        image: finalImageUrl,
        additionalImages: additionalImagesArray,
      };

      if (editingId) {
        dataToSave.updatedAt = new Date().toISOString();
        await setDoc(doc(db, "merchandise", editingId), dataToSave, { merge: true });
      } else {
        dataToSave.createdAt = new Date().toISOString();
        await addDoc(collection(db, "merchandise"), dataToSave);
      }
      resetForm();
      toast.success("Merchandise saved successfully.");
      fetchData();
    } catch (err) {
      toast.error("Error saving merchandise.");
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleSeedMerch = async () => {
    setActionLoading(true);
    try {
      const products = [
        {
          name: "YMCC VII Safety Vest",
          tagline: "High-Visibility Premium Vest",
          description: "Official Safety Vest for YMCC VII delegates.",
          category: "SAFETY WEAR",
          price: "150K",
          priceNumber: 150000,
          image: "/merch/VEST_DSC01482.jpg",
          additionalImages: ["/merch/VEST_DSC01750.jpg", "/merch/VEST_DSC02132.jpg"],
          stockType: "READY",
          stockAmount: 100,
          weight: 300,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: "YMCC VII Official Wearpack",
          tagline: "Premium Field Wearpack",
          description: "Official Wearpack for YMCC VII field activities.",
          category: "APPAREL",
          price: "250K",
          priceNumber: 250000,
          image: "/merch/WEARPACK_DSC01632.jpg",
          additionalImages: ["/merch/WEARPACK_DSC02146.jpg", "/merch/WEARPACK_DSC02316.jpg"],
          stockType: "PO",
          stockAmount: 50,
          weight: 800,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      for (const p of products) {
        await addDoc(collection(db, "merchandise"), p);
      }
      toast.success("Initial merchandise data seeded successfully!");
      fetchData();
    } catch (err) {
      toast.error("Error seeding merchandise.");
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleDeleteMerch = async (id) => {
    if (!confirm("Delete this merchandise?")) return;
    try {
      await deleteDoc(doc(db, "merchandise", id));
      toast.success("Merchandise deleted.");
      fetchData();
    } catch (err) { toast.error("Error deleting merch."); }
  };

  // --- FAQS ---
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "faqs", editingId), { q: faqForm.q, a: faqForm.a });
      } else {
        await addDoc(collection(db, "faqs"), { q: faqForm.q, a: faqForm.a, createdAt: new Date().toISOString() });
      }
      resetForm();
      toast.success("FAQ saved successfully.");
    } catch (err) { 
      toast.error("Error saving FAQ.");
      console.error(err); 
    }
    setActionLoading(false);
  };

  const handleDeleteFaq = async (id) => {
    if(!confirm("Hapus FAQ ini?")) return;
    try { 
        await deleteDoc(doc(db, "faqs", id)); 
        toast.success("FAQ deleted.");
    } catch (err) { 
        toast.error("Failed to delete FAQ.");
        console.error(err); 
    }
  };

  // --- NEWS ---
  const generateSlug = (text) => text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  const handleSaveNews = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let imageUrl = newsForm.imageUrl;
      if (uploadFile) {
        imageUrl = await handleFileUpload(uploadFile, "news") || imageUrl;
      }
      
      const slug = generateSlug(newsForm.title);
      const payload = { ...newsForm, imageUrl, slug };
      
      if (editingId) {
        await updateDoc(doc(db, "news", editingId), payload);
      } else {
        await addDoc(collection(db, "news"), { ...payload, date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), createdAt: new Date().toISOString() });
      }
      resetForm();
      toast.success("News successfully saved.");
    } catch (err) { 
        console.error(err); 
        toast.error("Error saving news.");
    }
    setActionLoading(false);
  };

  const handleDeleteNews = async (id) => {
    if(!confirm("Hapus Berita ini?")) return;
    try { 
      await deleteDoc(doc(db, "news", id)); 
      toast.success("News deleted.");
    } catch (err) { 
      toast.error("Error deleting news.");
      console.error(err); 
    }
  };

  // --- SPONSORS ---
  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let imageUrl = sponsorForm.imageUrl;
      if (uploadFile) {
        imageUrl = await handleFileUpload(uploadFile, "sponsors") || imageUrl;
      }
      const payload = { ...sponsorForm, imageUrl };
      
      if (editingId) {
        await updateDoc(doc(db, "sponsors", editingId), payload);
      } else {
        await addDoc(collection(db, "sponsors"), { ...payload, createdAt: new Date().toISOString() });
      }
      resetForm();
      toast.success("Sponsor saved successfully.");
    } catch (err) { 
      toast.error("Error saving sponsor.");
      console.error(err); 
    }
    setActionLoading(false);
  };

  const handleDeleteSponsor = async (id) => {
    if(!confirm("Hapus Sponsor ini?")) return;
    setActionLoading(true);
    try { 
        await deleteDoc(doc(db, "sponsors", id)); 
        toast.success("Sponsor deleted.");
    } catch (err) { 
        toast.error("Error deleting Sponsor.");
        console.error(err); 
    }
    setActionLoading(false);
  };

  // --- ACTIVITIES ---
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let iconUrl = activityForm.icon;
      let gbUrl = activityForm.guidebookUrl;
      if (uploadFile) {
         const up = await handleFileUpload(uploadFile, "activities_icons");
         if (up) iconUrl = up;
      }
      if (uploadGuidebook) {
         const upG = await handleFileUpload(uploadGuidebook, "activities_guidebooks");
         if (upG) gbUrl = upG;
      }
      
      let parsedPills = Array.isArray(activityForm.pills) ? activityForm.pills : activityForm.pills.split(',').map(p => p.trim()).filter(p => p);
      
      const payload = { ...activityForm, icon: iconUrl, guidebookUrl: gbUrl, pills: parsedPills };
      
      if (editingId) {
        await updateDoc(doc(db, "activities", editingId), payload);
      } else {
        await addDoc(collection(db, "activities"), { ...payload, createdAt: new Date().toISOString() });
      }
      resetForm();
      toast.success("Activity saved successfully.");
    } catch (err) { 
        console.error(err); 
        toast.error("Error saving Activity.");
    }
    setActionLoading(false);
  };

  const handleDeleteActivity = async (id) => {
    if(!confirm("Hapus Aktivitas ini?")) return;
    setActionLoading(true);
    try { 
        await deleteDoc(doc(db, "activities", id)); 
        toast.success("Activity deleted.");
    } catch (err) { 
        toast.error("Error deleting Activity.");
        console.error(err); 
    }
    setActionLoading(false);
  };

  // --- STAFF ---
  const handleApproveStaff = (id) => {
    setRoleModal({ isOpen: true, staffId: id, role: "Operator" });
  };

  const confirmApproveStaff = async () => {
    if (!roleModal.staffId) return;
    setActionLoading(true);
    try { 
      await updateDoc(doc(db, "staff_applications", roleModal.staffId), { 
        status: "APPROVED", 
        role: roleModal.role 
      }); 
      
      await logAuditAction("APPROVE_STAFF", `Approved ${roleModal.staffId} as ${roleModal.role}`);

      try {
        const idToken = await auth.currentUser.getIdToken();
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            to: roleModal.staffId,
            subject: 'Pemberitahuan Akun Staf YMCC VII',
            text: `Halo,\n\nTerima kasih telah mendaftar. Kami ingin menginformasikan bahwa aplikasi staf Anda untuk YMCC VII telah disetujui.\n\nAnda sekarang ditugaskan sebagai ${roleModal.role}.\n\nSilakan akses dashboard staf melalui tautan berikut:\nhttps://ymccvii.com/staff\n\nSalam hangat,\nTim YMCC VII`
          })
        });
      } catch (e) {
        console.error("Failed to send email notification", e);
      }

    } catch (err) { 
      console.error(err); 
      alert("Error: " + err.message);
    }
    setActionLoading(false);
    setRoleModal({ isOpen: false, staffId: null, role: "Operator" });
  };

  const handleRejectStaff = async (id) => {
    if(!confirm("Reject this staff application?")) return;
    setActionLoading(true);
    try { await updateDoc(doc(db, "staff_applications", id), { status: "REJECTED" }); } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const handleDeleteStaff = async (id) => {
    if(!confirm("Permanently delete this staff record? This will revoke their portal access.")) return;
    setActionLoading(true);
    try { 
      await deleteDoc(doc(db, "staff_applications", id)); 
      
      const idToken = await auth.currentUser.getIdToken();
      await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ email: id })
      });

      toast.success("Staff deleted.");
    } catch (err) { 
      toast.error("Error deleting staff.");
      console.error(err); 
    }
    setActionLoading(false);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "staff_applications", editStaffModal.data.id), {
        name: editStaffModal.data.name,
        nim: editStaffModal.data.nim,
        role: editStaffModal.data.role,
        status: editStaffModal.data.status,
        department: editStaffModal.data.department,
        division: editStaffModal.data.division,
      });
      setEditStaffModal({ isOpen: false, data: null });
    } catch (err) { console.error(err); alert("Error: " + err.message); }
    setActionLoading(false);
  };

  const handleRegisterStaffManual = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (!secondaryAuth) {
        throw new Error("Secondary Auth not initialized. Check firebase.js.");
      }
      
      try {
        await createUserWithEmailAndPassword(secondaryAuth, addStaffModal.email, addStaffModal.password);
      } catch (authError) {
        if (authError.code === "auth/email-already-in-use") {
          toast.warning("Akun email sudah ada di database Auth, tapi data profilnya akan diperbarui.");
        } else {
          throw authError;
        }
      }
      
      await setDoc(doc(db, "staff_applications", addStaffModal.email), {
        name: addStaffModal.name,
        nim: addStaffModal.nim,
        email: addStaffModal.email,
        department: addStaffModal.department,
        division: addStaffModal.division,
        position: addStaffModal.position,
        role: addStaffModal.role,
        status: "APPROVED",
        driveLink: "MANUALLY_REGISTERED",
        appliedAt: serverTimestamp()
      });

      try {
        const idToken = await auth.currentUser.getIdToken();
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            to: addStaffModal.email,
            subject: 'Pemberitahuan Akun Staf YMCC VII',
            text: `Halo ${addStaffModal.name},\n\nAkun staf YMCC VII Anda telah berhasil dibuat oleh admin.\n\nBerikut adalah informasi login Anda:\nEmail: ${addStaffModal.email}\nPassword: ${addStaffModal.password}\n\nAnda ditugaskan sebagai ${addStaffModal.role} di departemen ${addStaffModal.department}.\n\nSilakan akses dashboard staf melalui tautan berikut:\nhttps://ymccvii.com/staff\n\nSalam hangat,\nTim YMCC VII`
          })
        });
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
      }

      await signOut(secondaryAuth);

      toast.success("Staff registered and email sent successfully!");
      setAddStaffModal({ isOpen: false, email: "", password: "", role: "Operator", name: "", nim: "", department: "", division: "", position: "Staff" });
    } catch (err) {
      console.error(err);
      toast.error("Error registering staff: " + err.message);
    }
    setActionLoading(false);
  };

  // --- SETTINGS ---
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setActionLoading(true);
    try {
      if (settingsForm.newPassword) {
        await updatePassword(auth.currentUser, settingsForm.newPassword);
      }
      toast.success("Account password updated successfully!");
      setSettingsForm({ newEmail: "", newPassword: "" });
    } catch (err) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        toast.error("You need to log out and log in again before changing your password.");
      } else {
        toast.error("Error: " + err.message);
      }
    }
    setActionLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
         <p className="font-poppins font-bold uppercase text-gray-500">Checking credentials...</p>
      </div>
    );
  }
  const exportParticipantsToCSV = () => {
    const headers = [
      "Full Name", "Email", "WhatsApp", "Institution", "Student ID", 
      "Education Level", "Country", "Province", "City", "District", 
      "Village", "Address", "T-Shirt Size", "Dietary", "Medical History", 
      "Emergency Contact", "Registration Status"
    ];
    
    const rows = participants.filter(p => p.role === "participant").map(p => [
      `"${p.fullName || ''}"`,
      `"${p.email || ''}"`,
      `"${p.whatsapp || ''}"`,
      `"${p.institution || ''}"`,
      `"${p.studentId || ''}"`,
      `"${p.educationLevel || ''}"`,
      `"${p.country || ''}"`,
      `"${p.province || ''}"`,
      `"${p.city || ''}"`,
      `"${p.district || ''}"`,
      `"${p.village || ''}"`,
      `"${p.address || ''}"`,
      `"${p.tshirtSize || ''}"`,
      `"${p.dietary || ''}"`,
      `"${p.medicalHistory || ''}"`,
      `"${p.emergencyContact || ''}"`,
      `"${p.registrationStatus || 'UNVERIFIED'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "YMCC_Participants_Directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleAttendance = async (userId, status) => {
    try {
      setActionLoading(true);
      await updateDoc(doc(db, "users", userId), {
        attendance: status,
        checkedInAt: status ? serverTimestamp() : null
      });
      toast.success(status ? "Checked In successfully" : "Check-In undone");
    } catch (err) {
      toast.error("Error updating attendance: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) {
      return toast.error("Subject and message are required.");
    }
    if (!window.confirm(`Are you sure you want to broadcast this message to ${broadcastTarget} participants?`)) return;

    try {
      setActionLoading(true);
      
      let targetEmails = [];
      if (broadcastTarget === "ALL") {
        targetEmails = participants.map(p => p.email);
      } else if (broadcastTarget === "VERIFIED") {
        targetEmails = participants.filter(p => p.registrationStatus === "VERIFIED").map(p => p.email);
      } else if (broadcastTarget === "REVISION") {
        targetEmails = participants.filter(p => p.registrationStatus === "NEEDS REVISION").map(p => p.email);
      }

      targetEmails = targetEmails.filter(e => e); // remove undefined

      if (targetEmails.length === 0) {
        toast.error("No participants found for the selected target.");
        return;
      }

      // Convert newlines to <br> for HTML email
      const htmlMessage = broadcastMessage.replace(/\n/g, "<br/>");

      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          bcc: targetEmails.join(","),
          subject: broadcastSubject,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                   <h2 style="color: #000; text-transform: uppercase;">YMCC VII Broadcast</h2>
                   <hr style="border: 2px solid #c1ff00; margin-bottom: 20px;" />
                   <div style="font-size: 14px; line-height: 1.6;">${htmlMessage}</div>
                   <br/>
                   <hr style="border: 1px solid #eee;" />
                   <p style="font-size: 11px; color: #777; text-align: center;">This is an automated message from the YMCC VII System. Please do not reply.</p>
                 </div>`,
        })
      });

      if (!res.ok) throw new Error("Failed to send email broadcast");

      await addDoc(collection(db, "broadcasts"), {
        subject: broadcastSubject,
        message: broadcastMessage,
        target: broadcastTarget,
        recipientCount: targetEmails.length,
        sentBy: userEmail,
        sentAt: serverTimestamp()
      });

      toast.success(`Broadcast sent to ${targetEmails.length} participants!`);
      setBroadcastSubject("");
      setBroadcastMessage("");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm("Are you sure you want to delete this broadcast history record?")) return;
    try {
      await deleteDoc(doc(db, "broadcasts", id));
      await logAuditAction("DELETE_BROADCAST", `Deleted broadcast ${id}`);
      toast.success("Broadcast record deleted");
    } catch(err) {
      toast.error("Failed to delete record: " + err.message);
    }
  };

  // QR Scanner Logic
  const handleQrScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedUid = detectedCodes[0].rawValue;
      if (!scannedUid) return;
      
      setScannerActive(false); // Pause scanner
      
      const foundUser = participants.find(u => u.id === scannedUid);
      if (foundUser) {
        setScannedUser(foundUser);
        setScanMessage("");
      } else {
        setScannedUser(null);
        setScanMessage("❌ Invalid QR Code: Participant not found in database.");
        // Resume scanner after 3 seconds
        setTimeout(() => setScannerActive(true), 3000);
      }
    }
  };

  const markAttendance = async (userId) => {
    try {
      setActionLoading(true);
      await updateDoc(doc(db, "users", userId), {
        attendance: true,
        checkedInAt: serverTimestamp()
      });
      toast.success("Participant checked in successfully!");
      setScannedUser(null);
      setScannerActive(true); // Resume scanner for next person
    } catch (err) {
      toast.error("Failed to check in: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa] font-poppins relative">
      {roleModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-sm border-2 border-black shadow-[4px_4px_0_0_#000] relative">
            <h3 className="font-anton text-2xl uppercase mb-4">Assign Staff Role</h3>
            <div className="mb-6">
              <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Select Role</label>
              <select 
                value={roleModal.role} 
                onChange={e => setRoleModal({...roleModal, role: e.target.value})}
                className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins font-bold focus:outline-none focus:ring-2 focus:ring-[#c1ff00]"
              >
                <option value="Operator">Operator</option>
                <option value="Admin">Admin</option>
                <option value="Fundraising">Fundraising</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setRoleModal({ isOpen: false, staffId: null, role: "Operator" })}
                className="flex-1 bg-white border-2 border-black text-black font-bold uppercase py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmApproveStaff}
                disabled={actionLoading}
                className="flex-1 bg-[#c1ff00] border-2 border-black text-black font-bold uppercase py-3 rounded-xl hover:bg-black hover:text-[#c1ff00] transition-colors shadow-[2px_2px_0_0_#000] hover:shadow-none disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR */}
      <div className={`w-64 bg-black text-white flex flex-col transition-all duration-300 z-40 ${isSidebarOpen ? 'fixed inset-y-0 left-0 flex shadow-2xl' : 'hidden md:flex'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="font-anton text-3xl text-[#c1ff00] tracking-wide uppercase">YMCC VII</h2>
            <p className="text-xs text-gray-400 font-medium tracking-widest mt-1 uppercase">
              {portalType === "master" ? "MASTER DASHBOARD" : `PORTAL ${portalType}`}
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard is visible to all */}
          <button onClick={() => { setActiveTab("dashboard"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "dashboard" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
            <FaChartBar /> Dashboard
          </button>

          {/* Operator/Master CMS Tabs */}
          {(portalType === "operator" || portalType === "master") && (
            <>
              <button onClick={() => { setActiveTab("activities"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "activities" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaTasks /> Activities
              </button>
              <button onClick={() => { setActiveTab("tickets"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "tickets" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaEnvelope /> Helpdesk Tickets
              </button>
              <button onClick={() => { setActiveTab("news"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "news" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaNewspaper /> News & Articles
              </button>
              <button onClick={() => { setActiveTab("faqs"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "faqs" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaQuestionCircle /> FAQs
              </button>
              <button onClick={() => { setActiveTab("sponsors"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "sponsors" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaHandshake /> Sponsors
              </button>
            </>
          )}

          {/* Admin/Master Bureaucracy Tabs */}
          {(portalType === "admin" || portalType === "master") && (
            <>
              <button onClick={() => { setActiveTab("participants"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "participants" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaUsers /> Verification Hub
              </button>
              <button onClick={() => { setActiveTab("submissions"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "submissions" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaFileAlt /> Submission Locker
              </button>
              <button onClick={() => { setActiveTab("qr_scanner"); resetForm(); setScannerActive(true); setScannedUser(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "qr_scanner" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaQrcode /> QR Scanner
              </button>
              <button onClick={() => { setActiveTab("broadcast"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "broadcast" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaEnvelope /> Broadcast Center
              </button>
            </>
          )}

          {/* Fundraising/Master E-Commerce Tabs */}
          {(portalType === "fundraising" || portalType === "master") && (
            <>
              <button onClick={() => { setActiveTab("merch_orders"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "merch_orders" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaTasks /> Order Management
              </button>
              <button onClick={() => { setActiveTab("merch_inventory"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "merch_inventory" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaHandshake /> Inventory
              </button>
            </>
          )}

          {/* Master Only Tabs */}
          {portalType === "master" && ["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(userEmail) && (
            <>
              <button onClick={() => { setActiveTab("users"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "users" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaUsers /> User Management
              </button>
              <button onClick={() => { setActiveTab("audit_logs"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "audit_logs" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                <FaSearch /> Audit Logs
              </button>
            </>
          )}

          {/* Settings for all */}
          <button onClick={() => { setActiveTab("settings"); resetForm(); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "settings" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
            <FaCog /> Settings
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800 space-y-3">
          <Link href="/portal">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#c1ff00] text-black font-bold uppercase rounded-xl hover:bg-white transition-all shadow-[2px_2px_0_0_#fff]">
              Participant Portal
            </button>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-gray-900 rounded-xl transition-all font-semibold">
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-2xl p-1 text-black hover:text-[#c1ff00] focus:outline-none transition-colors"
            >
              ☰
            </button>
            <h1 className="font-anton text-2xl md:text-3xl uppercase tracking-wider">
              {activeTab === "users" ? "User Management" : activeTab === "audit_logs" ? "System Audit Logs" : activeTab.replace(/_/g, ' ').toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c1ff00] rounded-full flex items-center justify-center font-bold text-black border border-black shadow-sm">
              {userEmail ? userEmail.charAt(0).toUpperCase() : "?"}
            </div>
            <span className="text-sm font-semibold text-gray-700 hidden sm:block">{userEmail}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {loadingData && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#c1ff00] border-t-black rounded-full animate-spin"></div>
                <p className="font-poppins font-bold text-gray-500">Syncing with Main Web...</p>
              </div>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {!loadingData && activeTab === "dashboard" && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
              
              {/* Filter Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border-2 border-black gap-4">
                <h2 className="font-anton text-2xl uppercase tracking-wide">Performance Overview</h2>
                <div className="flex items-center gap-3">
                  <span className="font-poppins font-bold text-sm text-gray-500 uppercase tracking-widest">Filter by:</span>
                  <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="font-poppins font-bold bg-gray-100 border-2 border-black rounded-lg px-4 py-2 cursor-pointer outline-none hover:bg-[#c1ff00] transition-colors"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(portalType === "operator" || portalType === "master") && (
                  <>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Activities</span>
                      <span className="text-5xl font-anton text-black">{filteredData.activitiesCount}</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Dispatches</span>
                      <span className="text-5xl font-anton text-black">{filteredData.newsCount}</span>
                    </div>
                  </>
                )}
                {(portalType === "fundraising" || portalType === "master") && (
                  <>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Merch Earnings</span>
                      <span className="text-4xl font-anton text-black">Rp {(filteredData.totalSales / 1000).toLocaleString()}k</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Orders (Paid / Pending)</span>
                      <span className="text-4xl font-anton text-black">{filteredData.paidOrdersCount} / {filteredData.pendingOrdersCount}</span>
                    </div>
                  </>
                )}
                {(portalType === "admin" || portalType === "master") && (
                  <>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Total Participants</span>
                      <span className="text-5xl font-anton text-black">{filteredData.totalUsers}</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Verified vs Unverified</span>
                      <span className="text-4xl font-anton text-black text-[#c1ff00] drop-shadow-[1px_1px_0_black]">{filteredData.verifiedUsers} <span className="text-black drop-shadow-none">/ {filteredData.unverifiedUsers}</span></span>
                    </div>
                  </>
                )}
              </div>

              {/* Charts */}
              {(portalType === "operator" || portalType === "master") && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* News Feedback Pie Chart */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-1">
                  <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Dispatch Feedback</h3>
                  <div className="h-64 w-full">
                    {filteredData.rawFeedbackLength > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={filteredData.feedbackPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="#000"
                            strokeWidth={2}
                          >
                            <Cell fill="#c1ff00" />
                            <Cell fill="#111111" />
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-bold text-center">No feedback data<br/>for selected period</div>
                    )}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#c1ff00] border-2 border-black rounded-full"></div>
                      <span className="text-sm font-bold uppercase">Helpful</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#111111] border-2 border-black rounded-full"></div>
                      <span className="text-sm font-bold uppercase">Not Helpful</span>
                    </div>
                  </div>
                </div>

                {/* Activity Clicks Bar Chart */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-2">
                  <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Most Inspected Competitions</h3>
                  <div className="h-64 w-full">
                    {filteredData.rawClicksLength > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filteredData.activityBarData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <XAxis dataKey="name" tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 10 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={{ stroke: '#000', strokeWidth: 2 }} />
                          <YAxis allowDecimals={false} tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={{ stroke: '#000', strokeWidth: 2 }} />
                          <RechartsTooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                          <Bar dataKey="clicks" fill="#c1ff00" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-bold text-center">No click data<br/>for selected period</div>
                    )}
                  </div>
                </div>
              </div>
              )}
              {/* Advanced Role-Specific Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Admin Charts */}
                {(portalType === "admin" || portalType === "master") && (
                  <>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-1 flex flex-col">
                      <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Verification Status</h3>
                      <div className="h-64 w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={filteredData.verificationStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="#000" strokeWidth={2}>
                              <Cell fill="#c1ff00" />
                              <Cell fill="#ff3366" />
                              <Cell fill="#ff9900" />
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#c1ff00] border border-black rounded-full"></div><span className="text-xs font-bold">Verified</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#ff3366] border border-black rounded-full"></div><span className="text-xs font-bold">Unverified</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#ff9900] border border-black rounded-full"></div><span className="text-xs font-bold">Revision</span></div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-2">
                      <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Demographic Heatmap (Top Provinces)</h3>
                      <div className="h-64 w-full">
                        {filteredData.demographicData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredData.demographicData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <XAxis type="number" tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12 }} />
                              <YAxis dataKey="province" type="category" tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 10 }} width={80} />
                              <RechartsTooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                              <Bar dataKey="count" fill="#111111" stroke="#000" strokeWidth={2} radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 font-bold">No Demographic Data</div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Fundraising Charts */}
                {(portalType === "fundraising" || portalType === "master") && (
                  <>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-2">
                      <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Best-Selling Merch (Paid Orders)</h3>
                      <div className="h-64 w-full">
                        {filteredData.topMerch.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredData.topMerch} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                              <XAxis dataKey="name" tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 10 }} />
                              <YAxis allowDecimals={false} tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12 }} />
                              <RechartsTooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                              <Bar dataKey="sales" fill="#c1ff00" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 font-bold">No Sales Data</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-anton text-2xl uppercase mb-2 border-b-2 border-gray-100 pb-4">Fulfillment Funnel</h3>
                        <div className="space-y-4 mt-6">
                          {filteredData.orderFunnelData.map((stage, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="font-bold text-sm text-gray-600">{stage.name}</span>
                              <span className="font-anton text-xl">{stage.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-8">
                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Average Order Value (AOV)</span>
                        <span className="text-3xl font-anton text-black">Rp {(filteredData.aov / 1000).toLocaleString()}k</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Master Revenue Chart */}
                {portalType === "master" && ["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(userEmail) && (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-3">
                    <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Revenue Trend Analysis (Merchandise)</h3>
                    <div className="h-72 w-full">
                      {filteredData.revenueTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={filteredData.revenueTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 10 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                            <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                            <RechartsTooltip formatter={(value) => `Rp ${value.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#000" strokeWidth={4} dot={{ r: 4, fill: '#c1ff00', stroke: '#000', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 font-bold">No Revenue Data</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBMISSIONS TAB */}
          {!loadingData && activeTab === "submissions" && (portalType === "admin" || portalType === "master") && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
              <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-black">
                <h3 className="font-anton text-2xl uppercase mb-6">Digital Submission Locker</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-black">
                        <th className="p-4 font-bold uppercase text-xs">Team / Name</th>
                        <th className="p-4 font-bold uppercase text-xs">Student ID</th>
                        <th className="p-4 font-bold uppercase text-xs">Submitted At</th>
                        <th className="p-4 font-bold uppercase text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => (
                        <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">
                            <div className="font-bold text-sm">{sub.fullName}</div>
                            <div className="text-xs text-gray-500">{sub.email}</div>
                          </td>
                          <td className="p-4 text-sm">{sub.studentId || "-"}</td>
                          <td className="p-4 text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                          <td className="p-4">
                            <a href={sub.driveLink} target="_blank" rel="noopener noreferrer" className="bg-[#c1ff00] px-4 py-2 rounded-xl text-xs font-bold border-2 border-black uppercase hover:bg-black hover:text-[#c1ff00] transition-colors inline-flex items-center gap-2">
                              <FaDownload /> Download File
                            </a>
                          </td>
                        </tr>
                      ))}
                      {submissions.length === 0 && (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-bold">No submissions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {!loadingData && activeTab === "audit_logs" && ["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(userEmail) && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
              <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-black">
                <h3 className="font-anton text-2xl uppercase mb-6">System Audit Trail</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-black">
                        <th className="p-4 font-bold uppercase text-xs">Timestamp</th>
                        <th className="p-4 font-bold uppercase text-xs">Actor (Email)</th>
                        <th className="p-4 font-bold uppercase text-xs">Action</th>
                        <th className="p-4 font-bold uppercase text-xs">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : "-"}</td>
                          <td className="p-4 text-xs font-bold text-blue-600">{log.staffEmail}</td>
                          <td className="p-4"><span className="bg-gray-200 px-2 py-1 rounded text-[10px] font-bold uppercase">{log.action}</span></td>
                          <td className="p-4 text-xs font-medium text-gray-700">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* HELPDESK TICKETS TAB */}
          {!loadingData && activeTab === "tickets" && (portalType === "operator" || portalType === "master") && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
              <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-black">
                <h3 className="font-anton text-2xl uppercase mb-6">Support Tickets</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-black">
                        <th className="p-4 font-bold uppercase text-xs">Subject / User</th>
                        <th className="p-4 font-bold uppercase text-xs">Message</th>
                        <th className="p-4 font-bold uppercase text-xs">Status</th>
                        <th className="p-4 font-bold uppercase text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(ticket => (
                        <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">
                            <div className="font-bold text-sm">{ticket.subject}</div>
                            <div className="text-xs text-gray-500">{ticket.email}</div>
                          </td>
                          <td className="p-4 text-xs font-medium text-gray-700 max-w-xs truncate">{ticket.message}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-700' : ticket.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{ticket.status}</span>
                          </td>
                          <td className="p-4 flex gap-2">
                            {ticket.status !== 'CLOSED' && (
                              <button onClick={() => setTicketModal({ isOpen: true, ticketId: ticket.id, reply: ticket.reply || "" })} className="bg-[#c1ff00] px-3 py-1 rounded border border-black text-xs font-bold uppercase hover:bg-black hover:text-[#c1ff00]">Reply</button>
                            )}
                            {ticket.status !== 'CLOSED' && (
                              <button onClick={() => handleCloseTicket(ticket.id)} className="bg-white px-3 py-1 rounded border border-black text-xs font-bold uppercase hover:bg-red-500 hover:text-white">Close</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {tickets.length === 0 && (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-bold">No tickets found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* QR SCANNER TAB */}
          {!loadingData && activeTab === "qr_scanner" && (portalType === "admin" || portalType === "master") && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-[#c1ff00] p-6 rounded-2xl border border-black shadow-[4px_4px_0_0_#000] mb-8">
                <h3 className="font-anton text-2xl uppercase mb-2">Check-In & Attendance Scanner</h3>
                <p className="font-poppins text-sm font-medium">Point your camera at the participant&apos;s Event Pass QR Code to view their profile, presentation documents, and mark attendance.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Scanner Section */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-anton text-xl uppercase"><FaCamera className="inline mr-2"/> Scanner</h4>
                    {!scannerActive && (
                      <button onClick={() => {setScannerActive(true); setScannedUser(null); setScanMessage("");}} className="bg-black text-white text-xs font-bold uppercase px-3 py-1 rounded-lg">
                        Scan Again
                      </button>
                    )}
                  </div>
                  <div className="bg-black w-full rounded-xl overflow-hidden relative" style={{ aspectRatio: '1/1' }}>
                    {scannerActive ? (
                      <Scanner onScan={handleQrScan} onError={(e) => console.log(e)} components={{ finder: false, zoom: true }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white bg-gray-900 font-bold uppercase">
                        {scannedUser ? "QR Captured!" : "Scanner Paused"}
                      </div>
                    )}
                  </div>
                  {scanMessage && <p className="mt-4 text-red-600 font-bold text-center bg-red-100 p-2 rounded-xl">{scanMessage}</p>}
                </div>

                {/* Result Section */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col">
                  <h4 className="font-anton text-xl uppercase mb-4 border-b-2 border-gray-100 pb-2">Scanned Result</h4>
                  
                  {scannedUser ? (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold uppercase">
                          {scannedUser.fullName ? scannedUser.fullName[0] : "?"}
                        </div>
                        <div>
                          <h2 className="font-poppins font-bold text-lg uppercase leading-tight">{scannedUser.fullName}</h2>
                          <p className="text-sm text-gray-500">{scannedUser.studentId} | {scannedUser.institution}</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-sm flex-1">
                        <div>
                          <span className="block text-xs font-bold text-gray-400 uppercase">Verification Status</span>
                          <span className={`inline-block px-2 py-1 mt-1 text-xs font-bold rounded ${scannedUser.registrationStatus === 'VERIFIED' ? 'bg-[#c1ff00] text-black' : 'bg-red-500 text-white'}`}>
                            {scannedUser.registrationStatus || "UNVERIFIED"}
                          </span>
                        </div>
                        
                        <div>
                          <span className="block text-xs font-bold text-gray-400 uppercase">Presentation Document</span>
                          {scannedUser.documentStatus === 'VERIFIED' && scannedUser.driveLink ? (
                            <a href={scannedUser.driveLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 bg-black text-[#c1ff00] px-4 py-2 rounded-xl font-bold uppercase text-xs hover:bg-gray-800 transition-colors">
                              View Drive Link
                            </a>
                          ) : (
                            <span className="font-medium text-gray-500">No verified document found.</span>
                          )}
                        </div>

                        <div>
                          <span className="block text-xs font-bold text-gray-400 uppercase">Attendance</span>
                          {scannedUser.attendance ? (
                            <span className="font-bold text-green-600">Already Checked In</span>
                          ) : (
                            <span className="font-bold text-gray-500">Not checked in yet</span>
                          )}
                        </div>
                      </div>

                      {!scannedUser.attendance && (
                        <button 
                          onClick={() => markAttendance(scannedUser.id)}
                          disabled={actionLoading}
                          className="w-full mt-6 bg-[#c1ff00] text-black py-4 rounded-xl font-bold uppercase border-2 border-black hover:bg-black hover:text-[#c1ff00] transition-colors shadow-[2px_2px_0_0_#000] disabled:opacity-50"
                        >
                          {actionLoading ? "Processing..." : "MARK AS CHECKED IN"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
                      <FaQrcode className="text-6xl mb-4 opacity-50" />
                      <p className="font-bold uppercase text-center">Waiting for scan...</p>
                      <p className="text-xs text-center mt-2">Scan a participant&apos;s Event Pass to view their profile.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BROADCAST CENTER TAB */}
          {!loadingData && activeTab === "broadcast" && (portalType === "admin" || portalType === "master") && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
              <div className="bg-[#111] text-white p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_0_#000] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#c1ff00]"></div>
                <h3 className="font-anton text-3xl uppercase mb-2">Mass Broadcast Center</h3>
                <p className="font-poppins text-sm text-gray-400 font-medium">Send massive email announcements directly to participants&apos; inboxes via secure BCC routing.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Broadcast */}
                <div className="bg-white p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_0_#000]">
                  <form onSubmit={handleSendBroadcast} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Target Audience</label>
                      <select 
                        value={broadcastTarget} 
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins font-bold focus:outline-none focus:ring-2 focus:ring-[#c1ff00]"
                      >
                        <option value="ALL">All Registered Participants</option>
                        <option value="VERIFIED">Verified Participants Only</option>
                        <option value="REVISION">Participants Needs Revision Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subject</label>
                      <input 
                        type="text" 
                        required 
                        value={broadcastSubject}
                        onChange={(e) => setBroadcastSubject(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins focus:outline-none focus:ring-2 focus:ring-[#c1ff00]"
                        placeholder="e.g., [URGENT] YMCC Competition Guidelines"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Message (HTML Supported)</label>
                      <textarea 
                        required 
                        rows="8"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins focus:outline-none focus:ring-2 focus:ring-[#c1ff00]"
                        placeholder="Write your email content here..."
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full bg-[#c1ff00] border-2 border-black text-black font-bold uppercase py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-black hover:text-[#c1ff00] transition-colors shadow-[2px_2px_0_0_#000] disabled:opacity-50"
                    >
                      <FaPaperPlane /> {actionLoading ? "Sending..." : "Send Broadcast"}
                    </button>
                  </form>
                </div>

                {/* Broadcast History */}
                <div className="bg-white p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col">
                  <h4 className="font-anton text-2xl uppercase mb-6 border-b-2 border-black pb-4">Broadcast History</h4>
                  <div className="flex-1 overflow-y-auto max-h-[500px] space-y-4 pr-2">
                    {broadcasts.length === 0 ? (
                      <p className="text-gray-400 text-sm font-bold text-center mt-10">No broadcast history found.</p>
                    ) : (
                      broadcasts.map(b => (
                        <div key={b.id} className="p-4 border-2 border-gray-100 rounded-xl hover:border-black transition-colors relative group">
                          <button 
                            onClick={() => handleDeleteBroadcast(b.id)}
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Record"
                          >
                            <FaTrash />
                          </button>
                          <h5 className="font-bold text-lg leading-tight mb-1 pr-6">{b.subject}</h5>
                          <div className="flex gap-2 mb-2">
                            <span className="bg-[#c1ff00] text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">{b.target}</span>
                            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">{b.recipientCount} Recipients</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Sent by: {b.sentBy}</p>
                          <p className="text-xs text-gray-400">{b.sentAt?.toDate ? new Date(b.sentAt.toDate()).toLocaleString() : "Sending..."}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITIES TAB */}
          {!loadingData && activeTab === "activities" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-anton text-2xl uppercase">{editingId ? "Edit Activity" : "Create Activity"}</h2>
                  {editingId && <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-black">CANCEL EDIT</button>}
                </div>
                <form onSubmit={handleSaveActivity} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={activityForm.title} onChange={e => setActivityForm({...activityForm, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                      <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={activityForm.type} onChange={e => setActivityForm({...activityForm, type: e.target.value})}>
                        <option value="COMPETITIONS">COMPETITIONS</option>
                        <option value="EVENTS">EVENTS</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea required rows="4" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={activityForm.description} onChange={e => setActivityForm({...activityForm, description: e.target.value})}></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Timeline Status</label>
                      <input type="text" placeholder="e.g., Specific Timeline: TBA" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={activityForm.timeline} onChange={e => setActivityForm({...activityForm, timeline: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience (Pills, comma separated)</label>
                      <input type="text" placeholder="High School, University, Public" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={Array.isArray(activityForm.pills) ? activityForm.pills.join(', ') : activityForm.pills} onChange={e => setActivityForm({...activityForm, pills: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Icon/Logo Image</label>
                      <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {activityForm.icon && !uploadFile && <img src={activityForm.icon} alt="Preview" className="h-12 mt-2 object-contain" />}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Guidebook PDF / URL</label>
                      <div className="flex gap-2 items-center">
                         <input type="file" accept="application/pdf" onChange={(e) => setUploadGuidebook(e.target.files[0])} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                         <span className="text-gray-400 font-bold">OR</span>
                         <input type="url" placeholder="https://drive.google.com/..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={activityForm.guidebookUrl} onChange={e => setActivityForm({...activityForm, guidebookUrl: e.target.value})} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upload file PDF directly via Firebase OR paste an external Drive Link.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Download Button Text</label>
                    <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={activityForm.buttonText} onChange={e => setActivityForm({...activityForm, buttonText: e.target.value})} />
                  </div>
                  <button type="submit" disabled={actionLoading} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase hover:bg-[#c1ff00] hover:text-black transition-colors disabled:opacity-50">
                    {actionLoading ? 'Saving...' : (editingId ? 'Update Activity' : 'Create Activity')}
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Manage Activities</h2>
                <div className="space-y-4">
                  {activities.map(a => (
                    <div key={a.id} className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      {a.icon && (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.icon} alt="" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="text-[10px] font-bold bg-[#c1ff00] px-2 py-1 rounded text-black mb-1 inline-block">{a.type}</span>
                        <h4 className="font-poppins font-bold text-base leading-tight mb-1">{a.title}</h4>
                        <p className="text-xs text-orange-600 font-semibold mb-2">{a.timeline}</p>
                        <div className="flex gap-3">
                          <button onClick={() => { setActivityForm(a); setEditingId(a.id); window.scrollTo(0, 0); }} className="text-blue-500 hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
                            <FaEdit size={12} /> Edit
                          </button>
                          <button onClick={() => handleDeleteActivity(a.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1">
                            <FaTrash size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-8 text-gray-400">No activities found.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NEWS TAB */}
          {!loadingData && activeTab === "news" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-anton text-2xl uppercase">{editingId ? "Edit Dispatch" : "Publish Dispatch"}</h2>
                  {editingId && <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-black">CANCEL EDIT</button>}
                </div>
                <form onSubmit={handleSaveNews} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                      <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={newsForm.category} onChange={e => setNewsForm({...newsForm, category: e.target.value})}>
                        <option value="ANNOUNCEMENTS">ANNOUNCEMENTS</option>
                        <option value="TECHNICAL">TECHNICAL</option>
                        <option value="PRESS RELEASES">PRESS RELEASES</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                    <div className="flex gap-4 items-center">
                      <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                      <span className="font-bold text-gray-400">OR</span>
                      <input type="url" placeholder="https://imgur.com/your-image.jpg" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={newsForm.imageUrl} onChange={e => setNewsForm({...newsForm, imageUrl: e.target.value})} />
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {newsForm.imageUrl && !uploadFile && <img src={newsForm.imageUrl} className="h-20 mt-3 object-cover rounded" alt="Preview" />}
                    <p className="text-xs text-gray-500 mt-2">Upload directly via Firebase Storage OR provide an external URL.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Content (Supports Markdown)</label>
                    <textarea required rows="8" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm leading-relaxed" value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} placeholder="Write your content here. You can use Markdown: **bold**, - list, # Heading"></textarea>
                    <p className="text-xs text-gray-500 mt-2">Format text using standard Markdown syntax. The main site will render it automatically.</p>
                  </div>
                  <button type="submit" disabled={actionLoading} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase hover:bg-[#c1ff00] hover:text-black transition-colors disabled:opacity-50">
                    {actionLoading ? 'Publishing...' : (editingId ? 'Update Dispatch' : 'Publish to Main Web')}
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Published Dispatches</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {news.map(n => (
                    <div key={n.id} className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      {n.imageUrl && (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={n.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="text-[10px] font-bold bg-[#c1ff00] px-2 py-1 rounded text-black mb-2 inline-block">{n.category}</span>
                        <h4 className="font-poppins font-bold text-base leading-tight mb-1 line-clamp-2">{n.title}</h4>
                        <p className="text-xs text-gray-500 mb-3">{n.date}</p>
                        <div className="flex gap-3">
                          <button onClick={() => { setNewsForm(n); setEditingId(n.id); window.scrollTo(0,0); }} className="text-blue-500 hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
                            <FaEdit size={12} /> Edit
                          </button>
                          <button onClick={() => handleDeleteNews(n.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1">
                            <FaTrash size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {news.length === 0 && <div className="col-span-full text-center py-8 text-gray-400">No dispatches available.</div>}
                </div>
              </div>
            </div>
          )}

          {/* FAQS TAB */}
          {!loadingData && activeTab === "faqs" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-anton text-2xl uppercase">{editingId ? "Edit FAQ" : "Add FAQ Entry"}</h2>
                  {editingId && <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-black">CANCEL EDIT</button>}
                </div>
                <form onSubmit={handleSaveFaq} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Question</label>
                    <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={faqForm.q} onChange={e => setFaqForm({...faqForm, q: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Answer</label>
                    <textarea required rows="4" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={faqForm.a} onChange={e => setFaqForm({...faqForm, a: e.target.value})}></textarea>
                  </div>
                  <button type="submit" disabled={actionLoading} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase hover:bg-[#c1ff00] hover:text-black transition-colors disabled:opacity-50">
                    {actionLoading ? 'Saving...' : (editingId ? 'Update FAQ' : 'Add to Public FAQ')}
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Active FAQs</h2>
                <div className="space-y-4">
                  {faqs.map(f => (
                    <div key={f.id} className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow relative group">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setFaqForm(f); setEditingId(f.id); window.scrollTo(0,0); }} className="text-blue-500 hover:text-blue-700"><FaEdit /></button>
                        <button onClick={() => handleDeleteFaq(f.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                      </div>
                      <h4 className="font-bold text-lg mb-2 pr-12">{f.q}</h4>
                      <p className="text-gray-600 text-sm">{f.a}</p>
                    </div>
                  ))}
                  {faqs.length === 0 && <div className="text-center py-8 text-gray-400">No FAQs available.</div>}
                </div>
              </div>
            </div>
          )}

          {/* SPONSORS TAB */}
          {!loadingData && activeTab === "sponsors" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-anton text-2xl uppercase">{editingId ? "Edit Sponsor" : "Add Sponsor"}</h2>
                  {editingId && <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-black">CANCEL EDIT</button>}
                </div>
                <form onSubmit={handleSaveSponsor} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={sponsorForm.name} onChange={e => setSponsorForm({...sponsorForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Website / Social Media URL</label>
                      <input type="url" placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={sponsorForm.websiteUrl} onChange={e => setSponsorForm({...sponsorForm, websiteUrl: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Logo Upload</label>
                    <div className="flex gap-4 items-center">
                      <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                      <span className="font-bold text-gray-400">OR</span>
                      <input type="url" placeholder="https://imgur.com/company-logo.png" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={sponsorForm.imageUrl} onChange={e => setSponsorForm({...sponsorForm, imageUrl: e.target.value})} />
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {sponsorForm.imageUrl && !uploadFile && <img src={sponsorForm.imageUrl} className="h-16 mt-3 object-contain" alt="Preview" />}
                  </div>
                  <button type="submit" disabled={actionLoading} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase hover:bg-[#c1ff00] hover:text-black transition-colors disabled:opacity-50">
                    {actionLoading ? 'Saving...' : (editingId ? 'Update Sponsor' : 'Add Sponsor Partner')}
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Active Partners</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sponsors.map(s => (
                    <div key={s.id} className="border border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center relative group hover:shadow-md transition-shadow bg-gray-50">
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-lg shadow-sm border">
                        <button onClick={() => { setSponsorForm(s); setEditingId(s.id); window.scrollTo(0,0); }} className="text-blue-500 hover:text-blue-700 p-1"><FaEdit size={14}/></button>
                        <button onClick={() => handleDeleteSponsor(s.id)} className="text-red-500 hover:text-red-700 p-1"><FaTrash size={14} /></button>
                      </div>
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-contain p-2" alt={s.name} /> : <FaHandshake className="text-gray-300 text-2xl" />}
                      </div>
                      <h4 className="font-bold text-gray-900 text-center mb-1 text-sm">{s.name}</h4>
                    </div>
                  ))}
                  {sponsors.length === 0 && <div className="col-span-full text-center py-8 text-gray-400">No partners available.</div>}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {!loadingData && activeTab === "users" && ["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(userEmail) && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-[#c1ff00] p-6 rounded-2xl border border-black shadow-[4px_4px_0_0_#000] mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-anton text-2xl uppercase mb-2">Superadmin Privilege</h3>
                  <p className="font-poppins text-sm font-medium">Anda memiliki akses eksklusif untuk mereview, menambah, dan menyunting aplikasi staff (Admin & Operator).</p>
                </div>
                <button onClick={() => setAddStaffModal({ ...addStaffModal, isOpen: true })} className="bg-black text-white px-6 py-3 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shrink-0">
                  + Add Staff Manually
                </button>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Staff Directory</h2>
                <div className="space-y-4">
                  {staffApps.map(app => (
                    <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow gap-4">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-gray-900 text-lg uppercase tracking-wide">{app.name} <span className="text-sm text-gray-500 normal-case tracking-normal">({app.email})</span></h4>
                        <span className="text-xs text-gray-600 font-medium mb-1">NIM: {app.nim || '-'} | Dept: {app.department || '-'} | Div: {app.division || '-'}</span>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase">
                          <span className="bg-black text-white px-2 py-1 rounded">Role: {app.role || "UNASSIGNED"}</span>
                          <span className={`px-2 py-1 rounded border ${app.status === 'APPROVED' ? 'bg-[#c1ff00] border-[#c1ff00] text-black' : app.status === 'REJECTED' ? 'bg-red-100 border-red-500 text-red-600' : 'bg-orange-100 border-orange-500 text-orange-600'}`}>Status: {app.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        {app.status === "PENDING" ? (
                          <div className="flex gap-2 w-full">
                            <button onClick={() => handleApproveStaff(app.id)} className="flex-1 sm:flex-none bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-600">APPROVE</button>
                            <button onClick={() => handleRejectStaff(app.id)} className="flex-1 sm:flex-none bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600">REJECT</button>
                          </div>
                        ) : (
                          <div className="flex gap-2 w-full justify-end">
                            <button onClick={() => setEditStaffModal({ isOpen: true, data: app })} className="text-blue-500 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 bg-blue-50 px-3 py-1 rounded">
                              <FaEdit size={12} /> Edit
                            </button>
                            <button onClick={() => handleDeleteStaff(app.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1 bg-red-50 px-3 py-1 rounded">
                              <FaTrash size={12} /> Delete
                            </button>
                          </div>
                        )}
                        {app.driveLink && app.driveLink !== "MANUALLY_REGISTERED" && (
                          <a href={app.driveLink} target="_blank" className="text-center text-blue-500 text-xs underline mt-1">View Document</a>
                        )}
                      </div>
                    </div>
                  ))}
                  {staffApps.length === 0 && <div className="text-center py-8 text-gray-400 font-bold">No applications yet.</div>}
                </div>
              </div>
            </div>
          )}

          {/* PARTICIPANTS TAB */}
          {!loadingData && activeTab === "participants" && (userRole === "Superadmin" || userRole === "Admin") && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="bg-[#c1ff00] p-6 rounded-2xl border border-black shadow-[4px_4px_0_0_#000] mb-8">
                <h3 className="font-anton text-2xl uppercase mb-2">Participant Verification</h3>
                <p className="font-poppins text-sm font-medium">Verify participant data. If information is incorrect, set status to NEEDS REVISION and provide a note so the participant can fix it themselves.</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
                  <h2 className="font-anton text-2xl uppercase">Participants Directory</h2>
                  <button onClick={exportParticipantsToCSV} className="bg-black text-[#c1ff00] px-4 py-2 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00] text-sm">
                    Export Full Data (CSV)
                  </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="border-b-2 border-black text-xs font-bold uppercase tracking-widest text-gray-500">
                                <th className="p-4 border-b border-gray-200">Participant</th>
                                <th className="p-4 border-b border-gray-200">Documents</th>
                                <th className="p-4 border-b border-gray-200">Status</th>
                                <th className="p-4 border-b border-gray-200">Attendance</th>
                                <th className="text-right p-4 border-b border-gray-200">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                        {participants.filter(p => p.role === "participant").map(p => (
                            <tr key={p.id}>
                                <td className="p-4 border-b border-gray-100">
                                    <div className="font-bold text-gray-900">{p.fullName}</div>
                                    <div className="text-xs text-gray-500">{p.email}</div>
                                </td>
                                <td className="p-4 border-b border-gray-100">
                                    {p.driveLink ? <a href={p.driveLink} target="_blank" className="text-blue-500 underline text-xs">Drive Link</a> : "-"}
                                </td>
                                <td className="p-4 border-b border-gray-100">
                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded border ${p.registrationStatus === 'VERIFIED' ? 'bg-[#c1ff00] border-[#c1ff00] text-black' : 'bg-orange-100 border-orange-500 text-red-600'}`}>
                                        {p.registrationStatus || "UNVERIFIED"}
                                    </span>
                                </td>
                                <td className="p-4 border-b border-gray-100 text-xs">
                                    {p.attendance ? (
                                        <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Checked In</span>
                                    ) : (
                                        <span className="text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">Absent</span>
                                    )}
                                </td>
                                <td className="p-4 border-b border-gray-100 text-right">
                                    <div className="flex justify-end gap-2">
                                        {p.attendance ? (
                                            <button onClick={() => toggleAttendance(p.id, false)} disabled={actionLoading} className="text-orange-500 hover:text-orange-700 bg-orange-50 p-2 rounded-lg" title="Undo Check-In">
                                                <FaTimesCircle />
                                            </button>
                                        ) : (
                                            <button onClick={() => toggleAttendance(p.id, true)} disabled={actionLoading} className="text-green-500 hover:text-green-700 bg-green-50 p-2 rounded-lg" title="Manual Check-In">
                                                <FaCheck />
                                            </button>
                                        )}
                                        <button onClick={() => setParticipantModal({ isOpen: true, data: p })} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDeleteUser(p.id)} disabled={actionLoading} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
              </div>
            </div>
          )}

          {/* MERCH INVENTORY TAB */}
          {!loadingData && activeTab === "merch_inventory" && (portalType === "fundraising" || portalType === "master") && (
            <div className="max-w-6xl mx-auto space-y-8">
              
              {/* BANNER MANAGEMENT */}
              <div className="bg-[#c1ff00] p-8 rounded-2xl shadow-[4px_4px_0_0_#000] border border-black mb-8">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b border-black pb-4">Hero Banners / Katalog Utama</h2>
                <form onSubmit={handleSaveBanner} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Banner Title</label>
                      <input type="text" required className="w-full px-4 py-3 bg-white border border-black rounded-xl" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} placeholder="e.g. Pre-Order Wearpack" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Link To Product (Optional URL)</label>
                      <input type="text" className="w-full px-4 py-3 bg-white border border-black rounded-xl" value={bannerForm.linkUrl} onChange={e => setBannerForm({...bannerForm, linkUrl: e.target.value})} placeholder="/merch?id=..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Banner Image (Landscape recommended)</label>
                    <div className="flex gap-2 items-center">
                       <input type="file" accept="image/*" onChange={(e) => setBannerUploadFile(e.target.files[0])} className="w-full px-4 py-2 bg-white border border-black rounded-xl text-sm" />
                       <span className="font-bold">OR</span>
                       <input type="url" placeholder="https://..." className="w-full px-4 py-3 bg-white border border-black rounded-xl" value={bannerForm.image} onChange={e => setBannerForm({...bannerForm, image: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" disabled={actionLoading} className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors disabled:opacity-50">
                    {actionLoading ? "Saving..." : (editingId && bannerForm.title ? "Update Banner" : "Add Banner")}
                  </button>
                </form>

                {merchBanners.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {merchBanners.map(b => (
                      <div key={b.id} className="bg-white p-4 border border-black rounded-xl relative group">
                        <div className="absolute top-2 right-2 flex gap-1 z-10 bg-white/80 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setBannerForm(b); setEditingId(b.id); }} className="text-blue-500 hover:text-blue-700 p-1"><FaEdit size={14} /></button>
                          <button onClick={() => handleDeleteBanner(b.id)} className="text-red-500 hover:text-red-700 p-1"><FaTrash size={14} /></button>
                        </div>
                        <div className="h-32 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           {b.image ? <img src={b.image} className="w-full h-full object-cover" alt={b.title} /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                        </div>
                        <h4 className="font-bold text-gray-900 uppercase truncate">{b.title}</h4>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-anton text-2xl uppercase">{editingId ? "Edit Merch Item" : "Add New Merch"}</h2>
                  {editingId && <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-black">CANCEL EDIT</button>}
                </div>
                <form onSubmit={handleSaveMerch} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.name} onChange={e => setMerchForm({...merchForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tagline (Short Desc)</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.tagline} onChange={e => setMerchForm({...merchForm, tagline: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Price String (e.g. 150K)</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.price} onChange={e => setMerchForm({...merchForm, price: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Exact Price (Number)</label>
                      <input type="number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.priceNumber} onChange={e => setMerchForm({...merchForm, priceNumber: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                      <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.category} onChange={e => setMerchForm({...merchForm, category: e.target.value})}>
                        <option value="APPAREL">APPAREL</option>
                        <option value="ACCESSORIES">ACCESSORIES</option>
                        <option value="BUNDLES">BUNDLES</option>
                        <option value="SAFETY WEAR">SAFETY WEAR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Weight (grams)</label>
                      <input type="number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.weight || 500} onChange={e => setMerchForm({...merchForm, weight: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Stock Type</label>
                      <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.stockType || "READY"} onChange={e => setMerchForm({...merchForm, stockType: e.target.value})}>
                        <option value="READY">Ready Stock</option>
                        <option value="PO">Pre-Order (PO)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Available Stock Amount</label>
                      <input type="number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.stockAmount !== undefined ? merchForm.stockAmount : 100} onChange={e => setMerchForm({...merchForm, stockAmount: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea required rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.description} onChange={e => setMerchForm({...merchForm, description: e.target.value})}></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Main Image (File or URL)</label>
                      <div className="flex gap-2 items-center">
                         <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                         <span className="text-gray-400 font-bold">OR</span>
                         <input type="url" placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.image} onChange={e => setMerchForm({...merchForm, image: e.target.value})} />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {merchForm.image && !uploadFile && <img src={merchForm.image} className="h-16 mt-2 object-cover rounded" alt="Preview" />}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Additional Images (Comma separated URLs)</label>
                      <textarea rows="2" placeholder="https://..., https://..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.additionalImages || ""} onChange={e => setMerchForm({...merchForm, additionalImages: e.target.value})}></textarea>
                      <p className="text-xs text-gray-500 mt-1">For catalog grid display</p>
                    </div>
                  </div>

                  <button type="submit" disabled={actionLoading} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase hover:bg-[#c1ff00] hover:text-black transition-colors disabled:opacity-50">
                    {actionLoading ? 'Saving...' : (editingId ? 'Update Merch' : 'Add to Store')}
                  </button>
                </form>
              </div>

              {merchandise.length === 0 && (
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={handleSeedMerch}
                    disabled={actionLoading}
                    className="bg-black text-white font-bold uppercase py-2 px-6 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    {actionLoading ? "Seeding..." : "Seed Initial Data"}
                  </button>
                </div>
              )}

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Store Inventory</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {merchandise.map(m => (
                    <div key={m.id} className="border border-gray-200 p-4 rounded-xl hover:shadow-md transition-shadow relative">
                      <div className="absolute top-2 right-2 flex gap-1 z-10 bg-white/80 p-1 rounded-lg">
                        <button onClick={() => { setMerchForm({ ...m, additionalImages: (m.additionalImages || []).join(', ') }); setEditingId(m.id); window.scrollTo(0,0); }} className="text-blue-500 hover:text-blue-700 p-1"><FaEdit size={14} /></button>
                        <button onClick={() => handleDeleteMerch(m.id)} className="text-red-500 hover:text-red-700 p-1"><FaTrash size={14} /></button>
                      </div>
                      <div className="h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {m.image ? <img src={m.image} className="w-full h-full object-cover" alt={m.name} /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                        <div className="absolute bottom-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Stock: {m.stockAmount !== undefined ? m.stockAmount : '-'}</div>
                        <div className="absolute top-2 left-2 bg-[#c1ff00] text-black text-[10px] font-bold px-2 py-1 rounded uppercase">{m.stockType || "READY"}</div>
                      </div>
                      <h4 className="font-bold text-gray-900 leading-tight mb-1">{m.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{m.category}</p>
                      <p className="font-anton text-lg">Rp {m.priceNumber.toLocaleString()}</p>
                    </div>
                  ))}
                  {merchandise.length === 0 && <div className="col-span-full text-center py-8 text-gray-400">No merchandise available.</div>}
                </div>
              </div>
            </div>
          )}

          {/* MERCH ORDERS TAB */}
          {!loadingData && activeTab === "merch_orders" && (portalType === "fundraising" || portalType === "master") && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="bg-[#c1ff00] p-6 rounded-2xl border border-black shadow-[4px_4px_0_0_#000] mb-8">
                <h3 className="font-anton text-2xl uppercase mb-2">Order Management</h3>
                <p className="font-poppins text-sm font-medium">Lacak pesanan merchandise. Sistem terintegrasi dengan Xendit webhook, sehingga pesanan otomatis berstatus PAID jika pembayaran berhasil.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="border-b-2 border-black text-xs font-bold uppercase tracking-widest text-gray-500">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Delivery</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {orders.sort((a,b) => {
                        const dateA = a.createdAt?.seconds || 0;
                        const dateB = b.createdAt?.seconds || 0;
                        return dateB - dateA;
                      }).map(o => (
                        <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 font-mono text-xs">{o.id.substring(0,8)}...</td>
                          <td className="py-4 px-4">
                            <div className="font-bold">{o.userDetails?.name}</div>
                            <div className="text-xs text-gray-500">{o.userDetails?.email}</div>
                          </td>
                          <td className="py-4 px-4">
                            <ul className="text-xs list-disc list-inside">
                              {o.items?.map((item, idx) => (
                                <li key={idx}>{item.quantity}x {item.name} {item.size && `(Sz ${item.size})`}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-4 px-4 text-xs">
                            <span className="font-bold uppercase block">{o.deliveryMethod}</span>
                            {o.deliveryMethod === "shipping" && o.shippingCost > 0 && <span className="text-gray-500">Rp {(o.shippingCost/1000).toLocaleString()}k</span>}
                          </td>
                          <td className="py-4 px-4 font-bold">Rp {o.totalAmount?.toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs font-bold uppercase rounded border ${
                              o.status === 'PAID' || o.status === 'SETTLED' ? 'bg-[#c1ff00] border-[#c1ff00] text-black' : 
                              o.status === 'EXPIRED' ? 'bg-red-100 border-red-500 text-red-600' : 'bg-orange-100 border-orange-500 text-orange-600'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan="6" className="text-center py-8 text-gray-400">No orders placed yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {!loadingData && activeTab === "settings" && (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Account Settings</h2>
                <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-sm font-bold text-orange-800 mb-1">Security Notice</p>
                  <p className="text-xs text-orange-700">Mengubah password memerlukan &quot;Recent Login&quot;. Jika Anda baru saja mengubahnya atau sesi login Anda sudah lama, Firebase mungkin meminta Anda untuk logout dan login kembali demi keamanan.</p>
                </div>
                
                <form onSubmit={handleUpdateAccount} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Logged in as</label>
                    <input type="email" disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-semibold" value={userEmail} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Change Password</label>
                    <input type="password" placeholder="Enter new password (min 6 chars)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={settingsForm.newPassword} onChange={e => setSettingsForm({...settingsForm, newPassword: e.target.value})} />
                  </div>
                  
                  <button type="submit" disabled={actionLoading || !settingsForm.newPassword} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase hover:bg-[#c1ff00] hover:text-black transition-colors disabled:opacity-50">
                    {actionLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* EDIT STAFF MODAL */}
      {editStaffModal.isOpen && editStaffModal.data && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-lg border-2 border-black shadow-[4px_4px_0_0_#000] relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-anton text-2xl uppercase mb-4 border-b-2 border-gray-100 pb-2">Edit Staff Data</h3>
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div><label className="block text-xs font-bold uppercase text-gray-500">Name</label><input required className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={editStaffModal.data.name} onChange={e => setEditStaffModal({...editStaffModal, data:{...editStaffModal.data, name: e.target.value}})} /></div>
              <div><label className="block text-xs font-bold uppercase text-gray-500">NIM</label><input required className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={editStaffModal.data.nim} onChange={e => setEditStaffModal({...editStaffModal, data:{...editStaffModal.data, nim: e.target.value}})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500">Role</label>
                  <select className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={editStaffModal.data.role} onChange={e => setEditStaffModal({...editStaffModal, data:{...editStaffModal.data, role: e.target.value}})}>
                    <option value="Operator">Operator</option>
                    <option value="Admin">Admin</option>
                    <option value="Fundraising">Fundraising</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500">Status</label>
                  <select className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={editStaffModal.data.status} onChange={e => setEditStaffModal({...editStaffModal, data:{...editStaffModal.data, status: e.target.value}})}>
                    <option value="APPROVED">APPROVED</option><option value="PENDING">PENDING</option><option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase text-gray-500">Dept</label><input className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={editStaffModal.data.department} onChange={e => setEditStaffModal({...editStaffModal, data:{...editStaffModal.data, department: e.target.value}})} /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-500">Division</label><input className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={editStaffModal.data.division} onChange={e => setEditStaffModal({...editStaffModal, data:{...editStaffModal.data, division: e.target.value}})} /></div>
              </div>
              <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                <button type="button" onClick={() => setEditStaffModal({isOpen:false, data:null})} className="flex-1 bg-white border-2 border-black text-black font-bold uppercase py-2 rounded-xl">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-1 bg-black text-white font-bold uppercase py-2 rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MANUAL MODAL */}
      {addStaffModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-lg border-2 border-black shadow-[4px_4px_0_0_#000] relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-anton text-2xl uppercase mb-4 border-b-2 border-gray-100 pb-2">Register Staff Manually</h3>
            <form onSubmit={handleRegisterStaffManual} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase text-gray-500">Email (Login)</label><input type="email" required className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={addStaffModal.email} onChange={e => setAddStaffModal({...addStaffModal, email: e.target.value})} /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-500">Password</label><input type="password" required minLength="6" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={addStaffModal.password} onChange={e => setAddStaffModal({...addStaffModal, password: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase text-gray-500">Full Name</label><input required className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={addStaffModal.name} onChange={e => setAddStaffModal({...addStaffModal, name: e.target.value})} /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-500">NIM</label><input required className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={addStaffModal.nim} onChange={e => setAddStaffModal({...addStaffModal, nim: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500">Role</label>
                  <select className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={addStaffModal.role} onChange={e => setAddStaffModal({...addStaffModal, role: e.target.value})}>
                    <option value="Operator">Operator</option>
                    <option value="Admin">Admin</option>
                    <option value="Fundraising">Fundraising</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold uppercase text-gray-500">Position</label><input required placeholder="Staff / Head" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={addStaffModal.position} onChange={e => setAddStaffModal({...addStaffModal, position: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase text-gray-500">Dept</label><input required className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={addStaffModal.department} onChange={e => setAddStaffModal({...addStaffModal, department: e.target.value})} /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-500">Division</label><input required className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" value={addStaffModal.division} onChange={e => setAddStaffModal({...addStaffModal, division: e.target.value})} /></div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                <button type="button" onClick={() => setAddStaffModal({...addStaffModal, isOpen:false})} className="flex-1 bg-white border-2 border-black text-black font-bold uppercase py-2 rounded-xl">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-1 bg-[#c1ff00] border-2 border-black text-black font-bold uppercase py-2 rounded-xl shadow-[2px_2px_0_0_#000]">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFY PARTICIPANT MODAL */}
      {participantModal.isOpen && participantModal.data && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl border-2 border-black shadow-[4px_4px_0_0_#000] relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-anton text-2xl uppercase mb-4 border-b-2 border-gray-100 pb-2">Verify Participant</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div><span className="text-gray-500 font-bold text-xs block uppercase">Full Name</span><span className="font-semibold text-gray-900">{participantModal.data.fullName}</span></div>
              <div><span className="text-gray-500 font-bold text-xs block uppercase">Email</span><span className="font-semibold text-gray-900">{participantModal.data.email}</span></div>
              <div><span className="text-gray-500 font-bold text-xs block uppercase">WhatsApp</span><span className="font-semibold text-gray-900">{participantModal.data.whatsapp || "-"}</span></div>
              <div><span className="text-gray-500 font-bold text-xs block uppercase">Birth Date & Gender</span><span className="font-semibold text-gray-900">{participantModal.data.birthDate || "-"} ({participantModal.data.gender || "-"})</span></div>
              
              <div><span className="text-gray-500 font-bold text-xs block uppercase">Institution</span><span className="font-semibold text-gray-900">{participantModal.data.institution || "-"}</span></div>
              <div><span className="text-gray-500 font-bold text-xs block uppercase">Student ID</span><span className="font-semibold text-gray-900">{participantModal.data.studentId || "-"}</span></div>
              <div><span className="text-gray-500 font-bold text-xs block uppercase">Education Lvl</span><span className="font-semibold text-gray-900">{participantModal.data.educationLevel || "-"}</span></div>
              <div><span className="text-gray-500 font-bold text-xs block uppercase">T-Shirt Size</span><span className="font-semibold text-gray-900">{participantModal.data.tshirtSize || "-"}</span></div>

              <div><span className="text-gray-500 font-bold text-xs block uppercase">Country</span><span className="font-semibold text-gray-900">{participantModal.data.country || "-"}</span></div>
              <div>
                <span className="text-gray-500 font-bold text-xs block uppercase">Location</span>
                <span className="font-semibold text-gray-900">{[participantModal.data.province, participantModal.data.city, participantModal.data.district, participantModal.data.village].filter(Boolean).join(", ") || "-"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 font-bold text-xs block uppercase">Full Address</span>
                <span className="font-semibold text-gray-900">{participantModal.data.address || "-"}</span>
              </div>

              <div><span className="text-gray-500 font-bold text-xs block uppercase">Dietary Rstrc.</span><span className="font-semibold text-gray-900">{participantModal.data.dietary || "-"}</span></div>
              <div><span className="text-gray-500 font-bold text-xs block uppercase">Medical Hist.</span><span className="font-semibold text-gray-900">{participantModal.data.medicalHistory || "-"}</span></div>
              <div className="col-span-2"><span className="text-gray-500 font-bold text-xs block uppercase">Emergency Contact</span><span className="font-semibold text-gray-900">{participantModal.data.emergencyContact || "-"}</span></div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setActionLoading(true);
              try {
                const previousStatus = participants.find(p => p.id === participantModal.data.id)?.registrationStatus;
                
                const dataToUpdate = {
                  registrationStatus: participantModal.data.registrationStatus || "UNVERIFIED"
                };
                if (participantModal.data.registrationStatus === "NEEDS REVISION") {
                  dataToUpdate.verificationNote = participantModal.data.verificationNote;
                } else {
                  dataToUpdate.verificationNote = null;
                }

                await updateDoc(doc(db, "users", participantModal.data.id), dataToUpdate);

                if (previousStatus !== dataToUpdate.registrationStatus && participantModal.data.email) {
                    let emailText = "";
                    if (dataToUpdate.registrationStatus === "VERIFIED") {
                        emailText = `Hello ${participantModal.data.fullName},\n\nCongratulations! Your registration data for YMCC VII has been successfully VERIFIED.\n\nYou can now log in to the participant portal to download your official ID Card (Event Pass).\n\nBest regards,\nYMCC VII Team`;
                    } else if (dataToUpdate.registrationStatus === "NEEDS REVISION") {
                        emailText = `Hello ${participantModal.data.fullName},\n\nWe have reviewed your registration data for YMCC VII, and it requires some revision.\n\nAdmin Note: ${dataToUpdate.verificationNote}\n\nPlease log in to the portal and update your profile accordingly to proceed with verification.\n\nBest regards,\nYMCC VII Team`;
                    }
                    
                    if (emailText) {
                        try {
                            const idToken = await auth.currentUser.getIdToken();
                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${idToken}`
                                },
                                body: JSON.stringify({
                                    to: participantModal.data.email,
                                    subject: 'YMCC VII Registration Update',
                                    text: emailText
                                })
                            });
                        } catch (e) {
                            console.error("Failed to send verification email", e);
                        }
                    }
                }

                setParticipantModal({ isOpen: false, data: {} });
                toast.success("Participant status updated & email sent.");
              } catch (err) {
                console.error(err);
                toast.error("Failed to update status");
              }
              setActionLoading(false);
            }} className="space-y-4 border-t-2 border-gray-200 pt-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Verification Status</label>
                <select className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-black" value={participantModal.data.registrationStatus || "UNVERIFIED"} onChange={e => setParticipantModal({...participantModal, data:{...participantModal.data, registrationStatus: e.target.value}})}>
                  <option value="UNVERIFIED">UNVERIFIED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="NEEDS REVISION">NEEDS REVISION</option>
                </select>
              </div>
              
              {participantModal.data.registrationStatus === "NEEDS REVISION" && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Revision Note (Visible to Participant)</label>
                  <textarea required rows="3" placeholder="Explain what is wrong (e.g. Please update your address...)" className="w-full bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" value={participantModal.data.verificationNote || ""} onChange={e => setParticipantModal({...participantModal, data:{...participantModal.data, verificationNote: e.target.value}})}></textarea>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setParticipantModal({isOpen:false, data:{}})} className="flex-1 bg-white border-2 border-black text-black font-bold uppercase py-3 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-1 bg-black text-white font-bold uppercase py-3 rounded-xl hover:bg-gray-800 transition-colors">Save Status</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TICKET REPLY MODAL */}
      {ticketModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border-4 border-black w-full max-w-md overflow-hidden shadow-[8px_8px_0_0_#000]">
            <div className="bg-[#c1ff00] p-6 border-b-4 border-black flex justify-between items-center">
              <h2 className="font-anton text-2xl uppercase tracking-wide">Reply to Ticket</h2>
              <button onClick={() => setTicketModal({ isOpen: false, ticketId: null, reply: "" })} className="text-black hover:scale-110 transition-transform"><FaTimes className="text-2xl" /></button>
            </div>
            <form onSubmit={handleReplyTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Your Reply</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-black"
                  value={ticketModal.reply}
                  onChange={(e) => setTicketModal({...ticketModal, reply: e.target.value})}
                ></textarea>
              </div>
              <button disabled={actionLoading} className="w-full bg-black text-white font-bold uppercase py-4 rounded-xl hover:bg-[#c1ff00] hover:text-black border-2 border-transparent hover:border-black transition-colors disabled:opacity-50">
                {actionLoading ? "Sending..." : "Send Reply"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
