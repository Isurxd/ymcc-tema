"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import imageCompression from 'browser-image-compression';
import { auth, db, storage, secondaryAuth } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, createUserWithEmailAndPassword, updatePassword, updateEmail } from "firebase/auth";
import { FaEdit, FaTrash, FaPlus, FaSignOutAlt, FaTimes, FaCheck, FaTimesCircle, FaNewspaper, FaQuestionCircle, FaHandshake, FaTrophy, FaUsers, FaTasks, FaCog, FaChartBar, FaQrcode, FaCamera, FaEnvelope, FaPaperPlane, FaFileAlt, FaSearch, FaDownload, FaChevronDown, FaChevronRight, FaWhatsapp, FaCopy, FaWallet, FaImage, FaClock, FaTags, FaStore, FaShoppingBag, FaUserShield, FaPrint, FaCalendarCheck, FaDatabase, FaEye } from "react-icons/fa";
import QRCode from "react-qr-code";
import { Scanner } from '@yudiel/react-qr-scanner';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, LabelList } from "recharts";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmContext";

export default function StaffDashboard({ portalType = "operator" }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenuGroup, setActiveMenuGroup] = useState(null);
  const confirmAction = useConfirm();

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
  
  // Modern Promise-based confirmation modal
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: "", resolve: null });

  const confirmActionModal = (message) => {
    return new Promise((resolve) => {
      setConfirmState({ isOpen: true, message, resolve });
    });
  };

  const handleConfirmChoice = (choice) => {
    if (confirmState.resolve) confirmState.resolve(choice);
    setConfirmState({ isOpen: false, message: "", resolve: null });
  };

  const [shippingModal, setShippingModal] = useState({ isOpen: false, order: null, resolve: null });
  const [shippingForm, setShippingForm] = useState({ trackingNumber: "", courier: "REGULER" });

  const requestShippingDetails = (order) => {
    setShippingForm({ 
      trackingNumber: order.shippingDetails?.trackingNumber || "", 
      courier: (order.shippingDetails?.courier && order.shippingDetails.courier !== "REGULER_YMCC") ? order.shippingDetails.courier : "" 
    });
    return new Promise((resolve) => {
      setShippingModal({ isOpen: true, order, resolve });
    });
  };

  const handleShippingModalClose = (success) => {
    if (shippingModal.resolve) {
      if (success && shippingForm.trackingNumber && shippingForm.courier) {
        shippingModal.resolve(shippingForm);
      } else if (success) {
        toast.error("Tracking number and courier cannot be empty.");
        return; // prevent closing
      } else {
        shippingModal.resolve(null);
      }
    }
    setShippingModal({ isOpen: false, order: null, resolve: null });
  };

  const [activeTab, setActiveTab] = useState(portalType === "admin" ? "participants" : portalType === "fundraising" ? "merch_orders" : "dashboard");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const [dateFilter, setDateFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [roleModal, setRoleModal] = useState({ isOpen: false, staffId: null, role: "Operator" });
  
  // DB State
  const [news, setNews] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [activities, setActivities] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [staffApps, setStaffApps] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [newsFeedback, setNewsFeedback] = useState([]);
  const [activityClicks, setActivityClicks] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [merchandise, setMerchandise] = useState([]);
  const [merchOrders, setMerchOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [recruitmentSubmissions, setRecruitmentSubmissions] = useState([]);
  const [promos, setPromos] = useState([]);
  const [ticketOrders, setTicketOrders] = useState([]);
  const [dbSelectedActivity, setDbSelectedActivity] = useState("ALL");
  const [dbSearchQuery, setDbSearchQuery] = useState("");
  const [dbStatusFilter, setDbStatusFilter] = useState("ALL");
  const [selectedQrParticipant, setSelectedQrParticipant] = useState(null);
  const [dbCurrentPage, setDbCurrentPage] = useState(1);
  const [promoForm, setPromoForm] = useState({ code: "", type: "VOUCHER", discount: "", discountType: "PERCENT", maxUses: "", commission: "", affiliateEmail: "" });
  
  // NEW FILTERS & SEARCH STATES
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSort, setOrderSort] = useState("NEWEST");
  const [orderDateRange, setOrderDateRange] = useState({ start: "", end: "" });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantFilter, setParticipantFilter] = useState("ALL");
  const [participantSort, setParticipantSort] = useState("NEWEST");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffSort, setStaffSort] = useState("NEWEST");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionSort, setSubmissionSort] = useState("NEWEST");
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliateSort, setAffiliateSort] = useState("NEWEST");
  const [affiliateApps, setAffiliateApps] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  
  // Enterprise States
  const [submissions, setSubmissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  // Attendance States
  const [attendanceForm, setAttendanceForm] = useState({
    activityId: "",
    name: "",
    method: "QR_ADMIN",
    status: "OPEN"
  });
  const [scannerSessionId, setScannerSessionId] = useState("");
  const [scannerMode, setScannerMode] = useState("CAMERA"); // CAMERA, HARDWARE
  
  // Hardware Scanner Global Listener Ref
  const lastKeyTimeRef = useRef(Date.now());
  const hardwareBufferRef = useRef("");
  const latestHandleQrScan = useRef(null);

  useEffect(() => {
    // Keep reference to latest handleQrScan to avoid stale closures
    latestHandleQrScan.current = handleQrScan;
  });

  useEffect(() => {
    if (activeTab !== "attendance" || scannerMode !== "HARDWARE") return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 60) {
        hardwareBufferRef.current = "";
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === "Enter") {
        if (hardwareBufferRef.current.length > 5 && latestHandleQrScan.current) {
          latestHandleQrScan.current([{ rawValue: hardwareBufferRef.current }]);
        }
        hardwareBufferRef.current = "";
      } else if (e.key.length === 1) {
        hardwareBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, scannerMode]);

  
  // Helper: Audit Logger
  
  const deleteFileFromStorage = async (url) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return;
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
      console.log("Deleted file:", url);
    } catch (e) {
      console.warn("Could not delete file:", e);
    }
  };

  
  const formatUrl = (url) => {
    if (!url) return url;
    let trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return 'https://' + trimmed;
    }
    return trimmed;
  };
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

  const handleBackup = async () => {
    if (isBackingUp) return;
    if (!(await confirmAction("Apakah Anda yakin ingin memicu pencadangan database manual? Seluruh koleksi penting akan diekspor sebagai CSV dan dikirimkan sebagai lampiran email ke alamat Superadmin."))) return;
    
    setIsBackingUp(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Pengguna tidak terautentikasi.");
      const token = await currentUser.getIdToken();
      
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
      } else {
        throw new Error(data.error || "Gagal membuat cadangan database.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Forms
  const initNews = { title: "", category: "ANNOUNCEMENTS", content: "", author: "Superadmin", imageUrl: "", status: "PUBLISHED" };
  const initFaq = { q: "", a: "" };
  const initSponsor = { name: "", websiteUrl: "", imageUrl: "", priority: 0 };
  const initActivity = { type: "COMPETITIONS", title: "", description: "", timeline: "", buttonText: "DOWNLOAD GUIDELINES", guidebookUrl: "", icon: "", pills: [] };
  
  const [newsForm, setNewsForm] = useState(initNews);
  const [faqForm, setFaqForm] = useState(initFaq);
  const [sponsorForm, setSponsorForm] = useState({ name: "", type: "PLATINUM", logo: "" });
  const [merchForm, setMerchForm] = useState({ name: "", tagline: "", price: "", priceNumber: 0, costPrice: 0, category: "SAFETY WEAR", description: "", image: "" });
  const [activityForm, setActivityForm] = useState(initActivity);
  const [operatorForm, setOperatorForm] = useState({ email: "", password: "" });

  const [editStaffModal, setEditStaffModal] = useState({ isOpen: false, data: null });
  const [addStaffModal, setAddStaffModal] = useState({ isOpen: false, email: "", password: "", confirmPassword: "", role: "Operator", name: "", nim: "", department: "", division: "", position: "Staff", driveLink: "" });

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

  // Recruitment Settings & Status
  const [recruitmentSettings, setRecruitmentSettings] = useState("OPEN");
  const [recruitmentStatusModal, setRecruitmentStatusModal] = useState({ isOpen: false, docId: null, newStatus: "", applicant: null, acceptedDivision: "", showCustomDivision: false });

  const divisionsList = [
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

  const router = useRouter();

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const cleanEmail = user.email ? user.email.toLowerCase().trim() : "";
        if (["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "suryatripatih2003@gmail.com", "noreply@ymccvii.com"].includes(cleanEmail)) {
           setIsAuthenticated(true);
           setUserEmail(cleanEmail);
           setUserRole("Superadmin");
        } else {
           const staffDoc = await getDoc(doc(db, "staff_applications", user.email));
           if (staffDoc.exists() && staffDoc.data().status === "APPROVED") {
             const role = staffDoc.data().role;
             let allowed = false;
             if (portalType === "master") allowed = false;
             else if (portalType === "admin" && role === "Admin") allowed = true;
             else if (portalType === "fundraising" && role === "Fundraising") allowed = true;
             else if (portalType === "operator" && ["Operator", "Fundraising", "Admin"].includes(role)) allowed = true;
             
             if (allowed) {
               setIsAuthenticated(true);
               setUserEmail(cleanEmail);
               setUserRole(role);
             } else {
               setIsAuthenticated(false);
               setUserEmail("");
               setUserRole("");
               setErrorMsg("Access Denied: Your role does not permit access to this portal.");
               signOut(auth);
               router.push("/staff");
             }
           } else {
             setIsAuthenticated(false);
             setUserEmail("");
             setUserRole("");
             setErrorMsg("Access Denied: You are not an approved Staff.");
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
    let unsubRecruitment = () => {};
    let unsubAudit = () => {};
    let unsubTickets = () => {};
    let unsubPromos = () => {};
    let unsubAffiliateApps = () => {};
    let unsubTicketOrders = () => {};

    let unsubRecruitmentSettings = () => {};

    if (portalType === "admin" || portalType === "master") {
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(list);
        setParticipants(list.filter(u => u.role === "participant"));
      });
      unsubTicketOrders = onSnapshot(collection(db, "Orders"), (snap) => {
        setTicketOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      unsubRecruitment = onSnapshot(query(collection(db, "recruitment_submissions"), orderBy("submittedAt", "desc")), (snap) => {
        setRecruitmentSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      unsubRecruitmentSettings = onSnapshot(doc(db, "site_settings", "recruitment"), (snap) => {
        if (snap.exists()) setRecruitmentSettings(snap.data().status || "OPEN");
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

      unsubOrders = onSnapshot(collection(db, "merch_orders"), (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMerchOrders(list);
        setOrders(list);
      });

      unsubBanners = onSnapshot(collection(db, "merch_banners"), (snap) => {
        setMerchBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      
      const unsubPromosClient = onSnapshot(collection(db, "promos"), (snap) => {
        setPromos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubAffClient = onSnapshot(collection(db, "affiliate_applications"), (snap) => {
        setAffiliateApps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubPayoutsClient = onSnapshot(query(collection(db, "payout_requests"), orderBy("createdAt", "desc")), (snap) => {
        setPayoutRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      unsubPromos = () => { unsubPromosClient(); unsubAffClient(); unsubPayoutsClient(); };
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
    const unsubAttendanceSessions = onSnapshot(collection(db, "attendance_sessions"), (snap) => {
      setAttendanceSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubTickets = onSnapshot(query(collection(db, "tickets"), orderBy("createdAt", "desc")), (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Simulate loading finish
    setTimeout(() => setLoadingData(false), 800);

    return () => {
      unsubUsers(); unsubMerch(); unsubOrders(); unsubBanners();
      unsubStaffApps(); unsubSubscribers(); unsubFeedback(); unsubClicks();
      unsubNews(); unsubFaqs(); unsubSponsors(); unsubActivities(); unsubBroadcasts();
      unsubSubmissions(); unsubAudit(); unsubTickets(); unsubPromos(); unsubAffiliateApps(); unsubAttendanceSessions(); unsubRecruitment();
      unsubTicketOrders();
      unsubRecruitmentSettings();
    };
  }, [isAuthenticated, portalType, userEmail]);

  useEffect(() => {
    setDbCurrentPage(1);
  }, [dbSelectedActivity, dbSearchQuery, dbStatusFilter]);

  const updateRecruitmentSettings = async (status) => {
    if (await confirmAction(`Change recruitment status to ${status}?`)) {
      try {
        await setDoc(doc(db, "site_settings", "recruitment"), { status }, { merge: true });
        toast.success(`Recruitment is now ${status}`);
      } catch (err) {
        toast.error("Failed to update status");
      }
    }
  };

  const submitRecruitmentStatus = async (sendEmail) => {
    const { docId, newStatus, applicant, acceptedDivision } = recruitmentStatusModal;
    setRecruitmentStatusModal({ ...recruitmentStatusModal, isOpen: false });
    const toastId = toast.loading("Updating status...");
    
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/recruitment/status-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          docId,
          newStatus,
          email: applicant.email,
          fullName: applicant.fullName,
          sendEmail,
          acceptedDivision: newStatus === "ACCEPTED" ? acceptedDivision : ""
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Applicant status updated successfully!", { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  const filteredData = useMemo(() => {
    const filterByDate = (items) => {
      if (dateFilter === "all") return items;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return items.filter(item => {
        let timestampVal = item.createdAt || item.timestamp || item.appliedAt || item.created_at;
        if (timestampVal && timestampVal.seconds) timestampVal = timestampVal.seconds * 1000;
        if (!timestampVal) return false;
        const itemDate = new Date(timestampVal);
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
    const totalSales = fOrders.filter(o => o.paymentStatus === "PAID" || o.paymentStatus === "SETTLED").reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const paidOrdersList = fOrders.filter(o => o.paymentStatus === "PAID" || o.paymentStatus === "SETTLED");
    const paidOrdersCount = paidOrdersList.length;
    const pendingOrdersCount = fOrders.filter(o => o.paymentStatus === "UNPAID" || !o.paymentStatus).length;
    
    // Net Profit Calculations
    let totalCogs = 0;
    let affiliatePayouts = 0;
    paidOrdersList.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          const merchItem = merchandise.find(m => m.name === item.name);
          const cost = merchItem?.costPrice ? merchItem.costPrice : (item.price * 0.5); // Fallback assumption 50%
          totalCogs += (cost * item.quantity);
        });
      }
      if (o.discountAmount) {
        affiliatePayouts += o.discountAmount; // Assume discount is the payout
      }
    });
    const netProfit = totalSales - totalCogs - affiliatePayouts;


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
    const paidOrders = fOrders.filter(o => o.paymentStatus === "PAID" || o.paymentStatus === "SETTLED");
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
      { name: 'PAID', count: fOrders.filter(o => (o.paymentStatus === "PAID" || o.paymentStatus === "SETTLED") && !["SHIPPED", "DELIVERED", "COMPLETED"].includes(o.orderStatus)).length },
      { name: 'FULFILLED', count: fOrders.filter(o => ["SHIPPED", "DELIVERED", "COMPLETED"].includes(o.orderStatus)).length },
    ];

    // Master Metrics
    const funnelData = [
      { name: 'Subscribers', count: fSubscribers.length },
      { name: 'Registrations', count: fUsers.length },
      { name: 'Verified', count: verifiedUsers }
    ];

    // === MONTHLY AGGREGATIONS ===
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
    
    // 1. Activity Clicks Trend
    const activityClicksByMonthObj = {};
    const activityTitleSet = new Set();
    fActivityClicks.forEach(click => {
      let tVal = click.createdAt || click.timestamp || click.appliedAt || click.created_at;
      if (tVal && tVal.seconds) tVal = tVal.seconds * 1000;
      if (!tVal) return;
      const d = new Date(tVal);
      if (isNaN(d)) return;
      const monthName = monthFormatter.format(d);
      if (!activityClicksByMonthObj[monthName]) activityClicksByMonthObj[monthName] = { month: monthName };
      const title = click.activityTitle || "Unknown";
      activityTitleSet.add(title);
      activityClicksByMonthObj[monthName][title] = (activityClicksByMonthObj[monthName][title] || 0) + 1;
    });
    const monthlyActivityTrend = Object.values(activityClicksByMonthObj).sort((a, b) => new Date(a.month) - new Date(b.month));
    const uniqueActivityTitles = Array.from(activityTitleSet);

    // 2. Registration Trend
    const registrationByMonthObj = {};
    fUsers.forEach(u => {
      let tVal = u.createdAt || u.timestamp || u.created_at;
      if (tVal && tVal.seconds) tVal = tVal.seconds * 1000;
      if (!tVal) return;
      const d = new Date(tVal);
      if (isNaN(d)) return;
      const monthName = monthFormatter.format(d);
      registrationByMonthObj[monthName] = (registrationByMonthObj[monthName] || 0) + 1;
    });
    const monthlyRegistrationTrend = Object.keys(registrationByMonthObj).map(month => ({
      month, count: registrationByMonthObj[month]
    })).sort((a, b) => new Date(a.month) - new Date(b.month));

    // 3. Revenue Trend
    const revenueByMonthObj = {};
    paidOrders.forEach(o => {
      let tVal = o.createdAt || o.timestamp || o.created_at;
      if (tVal?.seconds) tVal = tVal.seconds * 1000;
      else if (tVal?.toMillis) tVal = tVal.toMillis();
      if (!tVal) return;
      const d = new Date(tVal);
      if (isNaN(d)) return;
      const monthName = monthFormatter.format(d);
      revenueByMonthObj[monthName] = (revenueByMonthObj[monthName] || 0) + (o.totalAmount || 0);
    });
    const monthlyRevenueTrend = Object.keys(revenueByMonthObj).map(month => ({
      month, revenue: revenueByMonthObj[month]
    })).sort((a, b) => new Date(a.month) - new Date(b.month));

    return { 
      subscribersCount: fSubscribers.length, 
      activitiesCount: fActivities.length,
      newsCount: fNews.length,
      sponsorsCount: fSponsors.length,
      totalSales,
      totalCogs,
      affiliatePayouts,
      netProfit,
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
      monthlyActivityTrend,
      uniqueActivityTitles,
      monthlyRegistrationTrend,
      monthlyRevenueTrend
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
    setMerchForm({ name: "", tagline: "", price: "", priceNumber: 0, costPrice: 0, category: "SAFETY WEAR", description: "", image: "" });
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
      toast.success("Banner saved successfully!");
    } catch (err) {
      toast.error("Error saving banner.");
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleDeleteBanner = async (id) => {
    if (!(await confirmAction("Delete this banner?"))) return;
    try {
      await deleteDoc(doc(db, "merch_banners", id));
      toast.success("Banner deleted!");
      toast.success("Banner deleted!");
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
        additionalImagesArray = (additionalImagesArray || "").toString().split(",").map(s => s.trim()).filter(Boolean);
      } else if (!additionalImagesArray) {
        additionalImagesArray = [];
      }

      const dataToSave = {
        ...merchForm,
        image: finalImageUrl,
        additionalImages: additionalImagesArray,
      };

      if (dataToSave.sizes && dataToSave.sizes.length > 0 && dataToSave.stockPerSize) {
        dataToSave.stockAmount = dataToSave.sizes.reduce((sum, size) => sum + (dataToSave.stockPerSize[size] || 0), 0);
      }

      if (editingId) {
        dataToSave.updatedAt = new Date().toISOString();
        await setDoc(doc(db, "merchandise", editingId), dataToSave, { merge: true });
      } else {
        dataToSave.createdAt = new Date().toISOString();
        await addDoc(collection(db, "merchandise"), dataToSave);
      }
      resetForm();
      toast.success("Merchandise saved successfully.");
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
      toast.success("Initial merchandise data seeded successfully!");
    } catch (err) {
      toast.error("Error seeding merchandise.");
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleDeleteMerch = async (id) => {
    if (!(await confirmAction("Delete this merchandise?"))) return;
    try {
      const item = merchandise.find(m => m.id === id);
      if (item && item.image) await deleteFileFromStorage(item.image);
      await deleteDoc(doc(db, "merchandise", id));
      toast.success("Merchandise deleted.");
      toast.success("Merchandise deleted.");
    } catch (err) { toast.error("Error deleting merch."); }
  };

  const handleDeleteAffiliate = async (id) => {
    if (!(await confirmAction("Delete this affiliate application?"))) return;
    try {
      await deleteDoc(doc(db, "affiliate_applications", id));
      toast.success("Affiliate deleted.");
      logAuditAction("delete_affiliate", `Deleted affiliate application ${id}`);
    } catch (error) {
      toast.error("Error deleting affiliate.");
    }
  };

  const handleRequestCourier = async (orderId) => {
    if (!(await confirmAction("Are you sure you want to request a courier pickup via Biteship for this order?"))) return;
    const toastId = toast.loading("Requesting courier via Biteship...");
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const res = await fetch("/api/biteship/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Courier requested! Waybill: ${data.tracking.waybill_id}`, { id: toastId });
        logAuditAction("request_courier", `Requested Biteship courier for order ${orderId}`);
      } else {
        toast.error(`Error: ${data.error}`, { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to request courier.", { id: toastId });
    }
  };

  const handleUpdateOrderStatus = async (o, newStatus) => {
    try {
      const updateData = { orderStatus: newStatus };
      if (newStatus === 'SHIPPED' && o.deliveryMethod !== 'pickup') {
         const details = await requestShippingDetails(o);
         if (!details) return; // Cancelled
         updateData['shippingDetails.trackingNumber'] = details.trackingNumber.trim();
         updateData['shippingDetails.courier'] = details.courier.trim();
      }
      await updateDoc(doc(db, "merch_orders", o.id), updateData);
      toast.success(`Order status updated to ${newStatus}`);
      logAuditAction("update_order", `Updated order ${o.id} status to ${newStatus}`);
    } catch (err) {
      toast.error("Error updating order status.");
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!(await confirmAction("Delete this order permanently?"))) return;
    try {
      await deleteDoc(doc(db, "merch_orders", id));
      toast.success("Order deleted.");
      toast.success("Order deleted.");
    } catch (e) {
      toast.error("Failed to delete order: " + e.message);
    }
  };

  // --- PROMOS & AFFILIATES ---
  const handleSavePromo = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let codeToSave = promoForm.code;
      if (promoForm.type === "REFERRAL") {
         codeToSave = "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
         if(!promoForm.affiliateEmail) throw new Error("Affiliate Email is required for Referral.");
      }
      const promoData = {
        code: codeToSave.toUpperCase(),
        type: promoForm.type,
        discount: Number(promoForm.discount),
        discountType: promoForm.discountType || "PERCENT",
        status: promoForm.status || "ACTIVE",
        maxUses: promoForm.maxUses ? Number(promoForm.maxUses) : null,
        commission: promoForm.commission ? Number(promoForm.commission) : null,
        affiliateEmail: promoForm.affiliateEmail || null,
        createdAt: new Date().toISOString()
      };
      
      await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_promo',
          payload: { id: promoForm.id, promoData }
        })
      });
      
      
      setPromoForm({ id: null, code: "", type: "VOUCHER", discount: "", discountType: "PERCENT", maxUses: "", commission: "", affiliateEmail: "", status: "ACTIVE" });
      setEditingId(null);
      toast.success("Promo saved successfully.");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error saving Promo.");
    }
    setActionLoading(false);
  };

  const handleTogglePromoStatus = async (promo) => {
    setActionLoading(true);
    try {
      const newStatus = promo.isActive === false ? true : false;
      await updateDoc(doc(db, "promos", promo.id), { isActive: newStatus });
      toast.success(newStatus ? "Promo activated." : "Promo deactivated.");
      logAuditAction("TOGGLE_PROMO", `Promo ${promo.code} set to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to toggle status");
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleApprovePayout = async (payout) => {
    if (!(await confirmAction("Approve this payout? This will reset all promos available balance for this affiliate to 0."))) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "payout_requests", payout.id), { 
        status: "PAID", 
        resolvedAt: serverTimestamp() 
      });
      const affiliatePromos = promos.filter(p => p.affiliateEmail === payout.email);
      for (const p of affiliatePromos) {
        await updateDoc(doc(db, "promos", p.id), { availableBalance: 0 });
      }
      toast.success("Payout approved!");
      logAuditAction("APPROVE_PAYOUT", `Payout ${payout.id} for ${payout.email} approved.`);
    } catch (err) {
      toast.error("Failed to approve payout");
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleDeletePromo = async (id) => {
    if (!(await confirmAction("Delete this promo/referral?"))) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_promo',
          payload: { id }
        })
      });
      setPromos(prev => prev.filter(p => p.id !== id));
      toast.success("Promo deleted.");
    } catch (error) {
      toast.error("Error deleting Promo.");
      console.error(error);
    }
    setActionLoading(false);
  };

  const handleApproveAffiliate = async (app) => {
    if (!(await confirmAction(`Approve ${app.fullName} and generate Referral Code?`))) return;
    setActionLoading(true);
    try {
      const generatedCode = "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const appId = app.id;
      const promoType = "REFERRAL";
      const promoValue = "10";
      
      const promoData = {
        code: generatedCode,
        type: promoType,
        value: Number(promoValue),
        status: "ACTIVE",
        affiliateEmail: app.email,
        affiliateName: app.fullName,
        usageCount: 0,
        createdAt: new Date().toISOString()
      };
      
      await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_affiliate',
          payload: { id: appId, promoData }
        })
      });

      // Update local state instead of relying on real-time listener
      setAffiliateApps(prev => prev.map(a => a.id === appId ? { ...a, status: "APPROVED" } : a));
      setPromos(prev => [{ id: Math.random().toString(), ...promoData }, ...prev]);
      
      toast.success("Affiliate Approved & Code Generated!");
    } catch (err) {
      console.error(err);
      toast.error("Error approving affiliate");
    }
    setActionLoading(false);
  };

  const handleRejectAffiliate = async (appId) => {
    if (!(await confirmAction("Reject this affiliate?"))) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_affiliate',
          payload: { id: appId }
        })
      });
      setAffiliateApps(prev => prev.map(a => a.id === appId ? { ...a, status: "REJECTED" } : a));
      toast.success("Affiliate Rejected.");
    } catch (error) {
      console.error(error);
      toast.error("Error rejecting affiliate");
    }
    setActionLoading(false);
  };

  // --- ATTENDANCE SESSIONS ---
  const handleSaveAttendanceSession = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const selectedActivity = activities.find(a => a.id === attendanceForm.activityId);
      const payload = { 
        ...attendanceForm, 
        activityName: selectedActivity ? selectedActivity.title : "General",
        createdBy: userEmail
      };
      
      if (editingId) {
        await updateDoc(doc(db, "attendance_sessions", editingId), payload);
      } else {
        await addDoc(collection(db, "attendance_sessions"), { ...payload, createdAt: serverTimestamp() });
      }
      resetForm();
      toast.success("Attendance session saved.");
    } catch (err) {
      console.error(err);
      toast.error("Error saving session.");
    }
    setActionLoading(false);
  };

  const handleDeleteAttendanceSession = async (id) => {
    if (!(await confirmAction("Delete this attendance session?"))) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "attendance_sessions", id));
      toast.success("Session deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting session.");
    }
    setActionLoading(false);
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
    if (!(await confirmAction("Delete this FAQ?"))) return;
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

  const handleSaveNews = async (e, forceStatus) => {
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
    if (!(await confirmAction("Delete this news article?"))) return;
    try { 
      const item = news.find(n => n.id === id);
      if (item && item.image) await deleteFileFromStorage(item.image);
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
    if (!(await confirmAction("Delete this sponsor?"))) return;
    setActionLoading(true);
    try { 
        const item = sponsors.find(s => s.id === id);
      if (item && item.logo) await deleteFileFromStorage(item.logo);
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
      
      let parsedPills = Array.isArray(activityForm.pills) ? activityForm.pills : (activityForm.pills || "").toString().split(',').map(p => p.trim()).filter(p => p);
      
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
    if (!(await confirmAction("Delete this activity?"))) return;
    setActionLoading(true);
    try { 
        const item = activities.find(a => a.id === id);
      if (item && item.image) await deleteFileFromStorage(item.image);
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
      toast.error("Error: " + err.message);
    }
    setActionLoading(false);
    setRoleModal({ isOpen: false, staffId: null, role: "Operator" });
  };

  const handleRejectStaff = async (id) => {
    if (!(await confirmAction("Reject this staff application?"))) return;
    setActionLoading(true);
    try { await updateDoc(doc(db, "staff_applications", id), { status: "REJECTED" }); } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const handleDeleteStaff = async (id) => {
    if (!(await confirmAction("Permanently delete this staff record? This will revoke their portal access."))) return;
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
    } catch (err) { console.error(err); toast.error("Error: " + err.message); }
    setActionLoading(false);
  };

  const handleRegisterStaffManual = async (e) => {
    e.preventDefault();
    if (addStaffModal.password !== addStaffModal.confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }
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

      toast.success("Staff registered successfully!");
      setAddStaffModal({ isOpen: false, email: '', password: '', confirmPassword: '', role: 'Operator', name: '', nim: '', department: '', division: '', position: 'Staff', driveLink: '' });
      setAddStaffModal({ isOpen: false, email: '', password: '', confirmPassword: '', role: 'Operator', name: '', nim: '', department: '', division: '', position: 'Staff', driveLink: '' });
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
  
  const handleUpdateShipping = async (orderId, trackingNumber) => {
    try {
      await updateDoc(doc(db, "merch_orders", orderId), {
        shippingTracking: trackingNumber,
        status: "SHIPPED"
      });
      toast.success("Tracking number saved and status updated to SHIPPED!");
    } catch (e) {
      toast.error("Failed: " + e.message);
    }
  };

  
  const handleToggleSelectAll = (e, filteredList) => {
    if (e.target.checked) {
      setSelectedParticipants(filteredList.map(p => p.id));
    } else {
      setSelectedParticipants([]);
    }
  };

  const handleToggleSelectParticipant = (id) => {
    setSelectedParticipants(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const handleBulkVerify = async () => {
    if (selectedParticipants.length === 0) return;
    if (!(await confirmAction(`Verify ${selectedParticipants.length} selected participants?`))) return;
    setActionLoading(true);
    try {
      await Promise.all(selectedParticipants.map(id => 
        updateDoc(doc(db, "users", id), { registrationStatus: "VERIFIED" })
      ));
      toast.success(`${selectedParticipants.length} participants verified successfully!`);
      setSelectedParticipants([]);
    } catch (e) {
      toast.error("Bulk verification failed: " + e.message);
    }
    setActionLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedParticipants.length === 0) return;
    if (!(await confirmAction(`PERMANENTLY DELETE ${selectedParticipants.length} selected participants?`))) return;
    setActionLoading(true);
    try {
      await Promise.all(selectedParticipants.map(id => 
        deleteDoc(doc(db, "users", id))
      ));
      toast.success(`${selectedParticipants.length} participants deleted successfully!`);
      setSelectedParticipants([]);
    } catch (e) {
      toast.error("Bulk delete failed: " + e.message);
    }
    setActionLoading(false);
  };

  const exportParticipantsToCSV = () => {
    const headers = ["ID,Full Name,Email,Phone,Institution,Registration Status,Role,Attendance,Created At"];
    const csvData = participants.filter(p => p.role === "participant").map(p => {
      let tVal = p.createdAt || p.timestamp || p.created_at;
      if (tVal && tVal.seconds) tVal = tVal.seconds * 1000;
      const date = tVal ? new Date(tVal).toLocaleString() : "";
      return `"${p.id}","${p.fullName}","${p.email}","${p.phone || ""}","${p.institution || ""}","${p.registrationStatus || "UNVERIFIED"}","${p.role}","${p.attendance ? "Present" : "Absent"}","${date}"`;
    });
    
    const blob = new Blob([headers.join("\n") + "\n" + csvData.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "ymcc_participants.csv";
    a.click();
  };

  const getUserPaidCompetitions = (email) => {
    if (!email) return [];
    const paidOrders = ticketOrders.filter(order => 
      (order.userDetails?.email || "").toLowerCase() === email.toLowerCase() &&
      (order.status === "PAID" || order.status === "SETTLED")
    );
    const comps = [];
    paidOrders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          comps.push({ id: item.productId || item.id, name: item.name });
        });
      }
    });
    return comps;
  };

  const getFilteredDatabasePeserta = () => {
    return participants.filter(p => {
      if (dbSearchQuery) {
        const queryVal = dbSearchQuery.toLowerCase();
        const matchName = (p.fullName || "").toLowerCase().includes(queryVal);
        const matchEmail = (p.email || "").toLowerCase().includes(queryVal);
        const matchPhone = (p.whatsapp || p.phone || "").toLowerCase().includes(queryVal);
        const matchInst = (p.institution || "").toLowerCase().includes(queryVal);
        if (!matchName && !matchEmail && !matchPhone && !matchInst) return false;
      }
      if (dbStatusFilter !== "ALL") {
        if ((p.registrationStatus || "UNVERIFIED") !== dbStatusFilter) return false;
      }
      if (dbSelectedActivity !== "ALL") {
        const paidComps = getUserPaidCompetitions(p.email);
        const hasComp = paidComps.some(c => 
          c.id === dbSelectedActivity || 
          (c.name || "").toLowerCase().includes(dbSelectedActivity.toLowerCase())
        );
        if (!hasComp) return false;
      }
      return true;
    });
  };

  const exportDatabaseToCSV = () => {
    const filtered = getFilteredDatabasePeserta();
    const headers = ["UID,Nama Lengkap,Email,WhatsApp,Asal Negara,Asal Provinsi,Institusi,NPM/NIM/NISN,Status Verifikasi,Status Presensi,Aktivitas Terdaftar"];
    const csvData = filtered.map(p => {
      const paidComps = getUserPaidCompetitions(p.email);
      const compsStr = paidComps.map(c => c.name).join("; ");
      const fullName = p.fullName || "";
      const email = p.email || "";
      const whatsapp = p.whatsapp || p.phone || "";
      const country = p.country || "";
      const province = p.province || "";
      const institution = p.institution || "";
      const studentId = p.studentId || "";
      const status = p.registrationStatus || "UNVERIFIED";
      const attendance = p.attendance ? "HADIR" : "ABSEN";
      return `"${p.id}","${fullName}","${email}","${whatsapp}","${country}","${province}","${institution}","${studentId}","${status}","${attendance}","${compsStr}"`;
    });
    const blob = new Blob([headers.join("\n") + "\n" + csvData.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database_peserta_export_${new Date().getTime()}.csv`;
    a.click();
  };

  const downloadQR = (participantId, participantName) => {
    const svgElement = document.getElementById(`qr-svg-${participantId}`);
    if (!svgElement) return;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 400, 400);
      context.drawImage(image, 50, 50, 300, 300);
      const png = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = png;
      downloadLink.download = `QR_${participantName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const exportAffiliatesToCSV = () => {
    const headers = ["ID,Full Name,Email,Institution,Bank Name,Account Number,Account Name,Status,Created At"];
    const csvData = affiliateApps.map(p => {
      let tVal = p.createdAt;
      if (tVal && tVal.seconds) tVal = tVal.seconds * 1000;
      const date = tVal ? new Date(tVal).toLocaleString() : "";
      return `"${p.id}","${p.fullName}","${p.email}","${p.institution || ""}","${p.bankName || ""}","${p.accountNumber || ""}","${p.accountName || ""}","${p.status}","${date}"`;
    });
    const blob = new Blob([headers.join("\n") + "\n" + csvData.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "ymcc_affiliates.csv";
    a.click();
  };

  const exportPayoutsToCSV = () => {
    const headers = ["ID,Email,Amount,Status,Created At"];
    const csvData = payoutRequests.map(p => {
      let tVal = p.createdAt;
      if (tVal && tVal.seconds) tVal = tVal.seconds * 1000;
      const date = tVal ? new Date(tVal).toLocaleString() : "";
      return `"${p.id}","${p.email}","${p.amount}","${p.status}","${date}"`;
    });
    const blob = new Blob([headers.join("\n") + "\n" + csvData.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "ymcc_payouts.csv";
    a.click();
  };

  const exportMerchOrdersToCSV = () => {
    const headers = ["Order ID,User Email,Total,Payment Status,Order Status,Resi,Created At"];
    const csvData = merchOrders.map(m => {
      let tVal = m.createdAt || m.created_at;
      if (tVal && tVal.seconds) tVal = tVal.seconds * 1000;
      const date = tVal ? new Date(tVal).toLocaleString() : "";
      return `"${m.id}","${m.userEmail}","${m.total}","${m.paymentStatus}","${m.status}","${m.shippingTracking || ""}","${date}"`;
    });
    const blob = new Blob([headers.join("\n") + "\n" + csvData.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "ymcc_merch_orders.csv";
    a.click();
  };

  const exportSubmissionsToCSV = () => {
    const headers = ["ID,Full Name,Email,Student ID,Submitted At,Score,Status"];
    const csvData = submissions.map(s => {
      const date = s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "";
      return `"${s.id}","${s.fullName}","${s.email}","${s.studentId || ""}","${date}","${s.score || ""}","${s.status || ""}"`;
    });
    
    const blob = new Blob([headers.join("\n") + "\n" + csvData.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_export_${new Date().getTime()}.csv`;
    a.click();
  };

  const exportOrdersToCSV = () => {
    const headers = ["Order ID,Customer Name,Customer Email,Customer WhatsApp,Referral Code,Items,Delivery Method,Waybill (Resi),Total Amount,Payment Status,Order Status,Created At"];
    const csvData = orders.map(o => {
      let tVal = o.createdAt || o.timestamp || o.created_at;
      if (tVal && tVal.seconds) tVal = tVal.seconds * 1000;
      const date = tVal ? new Date(tVal).toLocaleString() : "";
      const itemsStr = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join("; ");
      const cust = o.userDetails || o.customerInfo || {};
      const fullName = cust.name || cust.fullName || "";
      const email = cust.email || "";
      const whatsapp = cust.phone || cust.whatsapp || "";
      const referralCode = cust.referralCode || "";
      const waybill = o.waybillId || "";
      return `"${o.id}","${fullName}","${email}","${whatsapp}","${referralCode}","${itemsStr}","${o.deliveryMethod}","${waybill}","${o.totalAmount}","${o.paymentStatus}","${o.orderStatus}","${date}"`;
    });
    
    const blob = new Blob([headers.join("\n") + "\n" + csvData.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${new Date().getTime()}.csv`;
    a.click();
  };

  const exportRecruitmentToCSV = () => {
    const headers = ["ID,Full Name,NIM,Email,WhatsApp,Domicile,Division 1,Division 2,Submitted At,Status"];
    const csvData = recruitmentSubmissions.map(r => {
      const date = r.submittedAt ? new Date(r.submittedAt.seconds * 1000).toLocaleString() : "";
      return `"${r.id}","${r.fullName || ""}","${r.nim || ""}","${r.email || ""}","${r.whatsapp || ""}","${r.domicile || ""}","${r.division1 || ""}","${r.division2 || ""}","${date}","${r.status || ""}"`;
    });
    const blob = new Blob([headers.join("\n") + "\n" + csvData.join("\n")], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recruitment_export_${new Date().getTime()}.csv`;
    a.click();
  };

  // Helper for safe timestamp extraction for sorting
  const getSafeTimestamp = (obj, field = 'createdAt') => {
    const t = obj[field];
    if (!t) return 0;
    if (t.seconds) return t.seconds * 1000;
    const parsed = Date.parse(t);
    return isNaN(parsed) ? 0 : parsed;
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
    if (!(await confirmAction(`Are you sure you want to broadcast this message to ${broadcastTarget} participants?`))) return;

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
    if (!(await confirmAction("Are you sure you want to delete this broadcast history record?"))) return;
    try {
      await deleteDoc(doc(db, "broadcasts", id));
      await logAuditAction("DELETE_BROADCAST", `Deleted broadcast ${id}`);
      toast.success("Broadcast record deleted");
    } catch(err) {
      toast.error("Failed to delete record: " + err.message);
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!ticketModal.ticketId || !ticketModal.reply) return;
    try {
      setActionLoading(true);
      await updateDoc(doc(db, "tickets", ticketModal.ticketId), {
        reply: ticketModal.reply,
        status: "ANSWERED",
        repliedAt: new Date().toISOString(),
        repliedBy: userEmail
      });
      await logAuditAction("REPLY_TICKET", `Replied to ticket ${ticketModal.ticketId}`);
      toast.success("Reply sent successfully");
      setTicketModal({ isOpen: false, ticketId: null, reply: "" });
    } catch(err) {
      toast.error("Failed to reply: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseTicket = async (id) => {
    if (!(await confirmAction("Are you sure you want to close this ticket?"))) return;
    try {
      await updateDoc(doc(db, "tickets", id), { status: "CLOSED" });
      await logAuditAction("CLOSE_TICKET", `Closed ticket ${id}`);
      toast.success("Ticket closed");
    } catch(err) {
      toast.error("Failed to close ticket");
    }
  };

  const handleGradeSubmission = async (id) => {
    const scoreStr = window.prompt("Enter score for this submission (0-100):");
    if (scoreStr === null) return;
    const score = Number(scoreStr);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Invalid score");
      return;
    }
    try {
      setActionLoading(true);
      await updateDoc(doc(db, "submissions", id), {
        score: score,
        status: "GRADED",
        gradedAt: new Date().toISOString()
      });
      toast.success(`Score ${score} applied!`);
    } catch(err) {
      toast.error("Failed to update score");
    } finally {
      setActionLoading(false);
    }
  };

  // QR Scanner Logic
  
  const playBeep = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio not supported");
    }
  };

  async function handleQrScan(detectedCodes) {
    if (!scannerSessionId) {
      toast.error("Please select an active Attendance Session first!");
      return;
    }
    if (detectedCodes && detectedCodes.length > 0) {
      let scannedUid = detectedCodes[0].rawValue;
      if (scannedUid && scannedUid.includes("verify?id=")) {
          scannedUid = scannedUid.split("verify?id=")[1];
      }
      if (!scannedUid) return;
      
      setScannerActive(false); // Pause scanner
      
      const foundUser = participants.find(u => u.id === scannedUid);
      if (foundUser) {
        setScannedUser(foundUser);
        
        // Check if already scanned in attendance_logs
        try {
          const q = query(
            collection(db, "attendance_logs"), 
            orderBy("scannedAt", "desc") // just a basic query
          );
          // Actually, we can just fetch and filter client-side for simplicity if we don't have composite index
          const logsSnap = await getDocs(collection(db, "attendance_logs"));
          const alreadyScanned = logsSnap.docs.some(d => d.data().sessionId === scannerSessionId && d.data().participantId === scannedUid);
          
          if (alreadyScanned) {
            playBeep('error');
            setScanMessage("❌ ALREADY SCANNED: Participant has already checked in to this session.");
          } else {
            playBeep('success');
            setScanMessage("");
          }
        } catch(err) {
          console.error(err);
        }
      } else {
        setScannedUser(null);
        playBeep('error');
        setScanMessage("❌ Invalid QR Code: Participant not found in database.");
        setTimeout(() => setScannerActive(true), 3000);
      }
    }
  }

  const markAttendance = async (userId) => {
    if (!scannerSessionId) {
      toast.error("Please select an active Attendance Session first!");
      return;
    }
    try {
      setActionLoading(true);
      await addDoc(collection(db, "attendance_logs"), {
        sessionId: scannerSessionId,
        participantId: userId,
        scannedAt: serverTimestamp(),
        scannedBy: userEmail
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
      {/* SHIPPING MODAL */}
      {shippingModal.isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_0_#000] w-full max-w-md p-6">
            <h3 className="font-anton text-3xl uppercase mb-2 text-[#111]">Shipping Details</h3>
            <p className="font-poppins text-sm text-gray-600 mb-6">Please enter the courier name and tracking number to fulfill this order.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Courier Service</label>
                <input 
                  type="text" 
                  value={shippingForm.courier}
                  onChange={e => setShippingForm({...shippingForm, courier: e.target.value.toUpperCase()})}
                  placeholder="e.g. JNE, J&T, SICEPAT"
                  className="w-full border-2 border-black rounded-xl p-3 font-bold uppercase outline-none focus:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tracking Number (Resi)</label>
                <input 
                  type="text" 
                  value={shippingForm.trackingNumber}
                  onChange={e => setShippingForm({...shippingForm, trackingNumber: e.target.value})}
                  placeholder="Enter tracking number"
                  className="w-full border-2 border-black rounded-xl p-3 font-bold font-mono outline-none focus:bg-gray-50"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => handleShippingModalClose(false)}
                className="flex-1 bg-white border-2 border-black text-black font-bold uppercase py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleShippingModalClose(true)}
                className="flex-1 bg-black border-2 border-black text-[#c1ff00] font-bold uppercase py-3 rounded-xl hover:bg-[#111] transition-colors shadow-[4px_4px_0_0_#c1ff00]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PARTICIPANT QR MODAL */}
      {selectedQrParticipant && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_0_#000] w-full max-w-sm p-6 relative flex flex-col items-center">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedQrParticipant(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="text-[#111]" />
            </button>

            <h3 className="font-anton text-2xl uppercase mb-1 text-[#111] text-center">Participant QR Code</h3>
            <p className="font-poppins text-xs font-bold text-gray-400 mb-6 text-center">{selectedQrParticipant.fullName}</p>
            
            {/* QR Render Area */}
            <div className="bg-white border-2 border-black p-4 rounded-2xl mb-6 shadow-[4px_4px_0_0_#000]">
              <QRCode 
                id={`qr-svg-${selectedQrParticipant.id}`} 
                value={selectedQrParticipant.id} 
                size={200} 
              />
            </div>
            
            <p className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg mb-6 w-full text-center break-all select-all">
              UID: {selectedQrParticipant.id}
            </p>

            <button 
              onClick={() => downloadQR(selectedQrParticipant.id, selectedQrParticipant.fullName)}
              className="w-full bg-[#c1ff00] border-2 border-black text-black font-anton text-lg uppercase py-3 rounded-xl hover:bg-black hover:text-[#c1ff00] transition-colors shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-y-px"
            >
              <FaDownload className="inline-block mr-2" /> Download QR
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_0_#000] w-full max-w-sm p-6 text-center">
            <h3 className="font-anton text-2xl uppercase mb-4 text-[#111]">Confirmation</h3>
            <p className="font-poppins text-sm text-gray-600 mb-8">{confirmState.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleConfirmChoice(false)}
                className="flex-1 bg-white border-2 border-black text-black font-bold uppercase py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleConfirmChoice(true)}
                className="flex-1 bg-red-500 border-2 border-black text-white font-bold uppercase py-3 rounded-xl hover:bg-red-600 transition-colors shadow-[4px_4px_0_0_#000]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
          {/* Operator CMS Tabs */}
          {(userRole === "Operator" || userRole === "Superadmin") && (
            <div className="mt-4">
              <button 
                onClick={() => setActiveMenuGroup(activeMenuGroup === 'operator' ? null : 'operator')}
                className="w-full flex items-center justify-between text-gray-500 font-bold text-xs uppercase tracking-widest px-4 py-2 hover:text-white transition-colors"
              >
                <span>Operator CMS</span>
                {activeMenuGroup === 'operator' ? <FaChevronDown /> : <FaChevronRight />}
              </button>
              {activeMenuGroup === 'operator' && (
                <div className="pl-2 space-y-1 mt-1">
                  <button onClick={() => { setActiveTab("activities"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "activities" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaTasks /> Activities
                  </button>
                  <button onClick={() => { setActiveTab("tickets"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "tickets" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaEnvelope /> Helpdesk Tickets
                    {tickets.filter(t => t.status === "OPEN").length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tickets.filter(t => t.status === "OPEN").length}</span>}
                  </button>
                  <button onClick={() => { setActiveTab("news"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "news" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaNewspaper /> News & Articles
                  </button>
                  <button onClick={() => { setActiveTab("faqs"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "faqs" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaQuestionCircle /> FAQs
                  </button>
                  <button onClick={() => { setActiveTab("sponsors"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "sponsors" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaHandshake /> Sponsors
                  </button>
                </div>
              )}
            </div>
          )}

          {/* E-Commerce Tabs */}
          {(userRole === "Fundraising" || userRole === "Superadmin") && (
            <div className="mt-4">
              <button 
                onClick={() => setActiveMenuGroup(activeMenuGroup === 'ecommerce' ? null : 'ecommerce')}
                className="w-full flex items-center justify-between text-gray-500 font-bold text-xs uppercase tracking-widest px-4 py-2 hover:text-white transition-colors"
              >
                <span>E-Commerce</span>
                {activeMenuGroup === 'ecommerce' ? <FaChevronDown /> : <FaChevronRight />}
              </button>
              {activeMenuGroup === 'ecommerce' && (
                <div className="pl-2 space-y-1 mt-1">
                  <button onClick={() => { setActiveTab("payouts"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "payouts" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaWallet /> Payout Requests
                    {payoutRequests.filter(p => p.status === "PENDING").length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{payoutRequests.filter(p => p.status === "PENDING").length}</span>}
                  </button>
                  <button onClick={() => { setActiveTab("promos"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "promos" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaTags /> Promo & Affiliate
                    {affiliateApps.filter(a => a.status === "PENDING").length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{affiliateApps.filter(a => a.status === "PENDING").length}</span>}
                  </button>
                  <button onClick={() => { setActiveTab("merchandise"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "merchandise" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaStore /> Merchandise
                  </button>
                  <button onClick={() => { setActiveTab("merch_orders"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "merch_orders" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaShoppingBag /> Merch Orders
                    {merchOrders.filter(m => m.status === "PENDING").length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{merchOrders.filter(m => m.status === "PENDING").length}</span>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin Hub Tabs */}
          {(userRole === "Admin" || userRole === "Superadmin") && (
            <div className="mt-4">
              <button 
                onClick={() => setActiveMenuGroup(activeMenuGroup === 'admin' ? null : 'admin')}
                className="w-full flex items-center justify-between text-gray-500 font-bold text-xs uppercase tracking-widest px-4 py-2 hover:text-white transition-colors"
              >
                <span>Admin Hub</span>
                {activeMenuGroup === 'admin' ? <FaChevronDown /> : <FaChevronRight />}
              </button>
              {activeMenuGroup === 'admin' && (
                <div className="pl-2 space-y-1 mt-1">
                  <button onClick={() => { setActiveTab("participants"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "participants" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaUsers /> Verification Hub
                  </button>
                  <button onClick={() => { setActiveTab("database"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "database" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaDatabase /> Participant Database
                  </button>
                  <button onClick={() => { setActiveTab("submissions"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "submissions" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaFileAlt /> Submission Locker
                  </button>
                  <button onClick={() => { setActiveTab("attendance"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "attendance" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaCalendarCheck /> Attendance
                  </button>
                  <button onClick={() => { setActiveTab("qr_scanner"); resetForm(); setScannerActive(true); setScannedUser(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "qr_scanner" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaQrcode /> QR Scanner
                  </button>
                  <button onClick={() => { setActiveTab("broadcast"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "broadcast" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaEnvelope /> Broadcast Center
                  </button>
                  <button onClick={() => { setActiveTab("users"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "users" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaUserShield /> Staff Management
                    {staffApps.filter(s => s.status === "PENDING").length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{staffApps.filter(s => s.status === "PENDING").length}</span>}
                  </button>
                  <button onClick={() => { setActiveTab("recruitment"); resetForm(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "recruitment" ? "bg-[#c1ff00] text-black font-bold" : "text-gray-300 hover:bg-gray-900"}`}>
                    <FaFileAlt /> Recruitment Database
                  </button>
                </div>
              )}
            </div>
          )}
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
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">News & Articles</span>
                      <span className="text-5xl font-anton text-black">{filteredData.newsCount}</span>
                    </div>
                  </>
                )}
                {(portalType === "fundraising" || portalType === "master") && (
                  <>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Gross Revenue</span>
                      <span className="text-4xl font-anton text-black">Rp {(filteredData.totalSales / 1000).toLocaleString()}k</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">COGS / Modal</span>
                      <span className="text-4xl font-anton text-black text-gray-700">Rp {(filteredData.totalCogs / 1000).toLocaleString()}k</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Affiliate Payouts</span>
                      <span className="text-4xl font-anton text-black text-red-600">Rp {(filteredData.affiliatePayouts / 1000).toLocaleString()}k</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black flex flex-col hover:shadow-brutal transition-shadow duration-300 bg-[#c1ff00]">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 text-black">Net Profit</span>
                      <span className="text-4xl font-anton text-black">Rp {(filteredData.netProfit / 1000).toLocaleString()}k</span>
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
                  <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Article Feedback ({filteredData.rawFeedbackLength} Responses)</h3>
                  <div className="h-64 w-full">
                    {filteredData.rawFeedbackLength > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={filteredData.feedbackPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="#000"
                            strokeWidth={2}
                            label={({ name, value }) => `${value}`}
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
                  <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Most Inspected Competitions ({filteredData.rawClicksLength} Clicks)</h3>
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
                          <Bar dataKey="clicks" fill="#c1ff00" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="clicks" position="top" fill="#000" style={{ fontFamily: 'Poppins', fontWeight: 'bold', fontSize: 12 }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-bold text-center">No click data<br/>for selected period</div>
                    )}
                  </div>
                </div>

                {/* Operator Monthly Clicks Trend */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-3">
                  <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Activity Clicks Timeline</h3>
                  <div className="h-72 w-full">
                    {filteredData.monthlyActivityTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredData.monthlyActivityTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="month" tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 10 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                          <Legend wrapperStyle={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 10 }} />
                          {filteredData.uniqueActivityTitles.map((title, i) => (
                            <Line key={title} type="monotone" dataKey={title} stroke={['#c1ff00', '#111111', '#ff3366', '#ff9900', '#00ccff', '#cc00ff', '#33cc33'][i % 7]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-bold">No Timeline Data</div>
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

                    {/* Admin Registration Trend */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-3 mt-8">
                      <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Registration Trend (Monthly)</h3>
                      <div className="h-72 w-full">
                        {filteredData.monthlyRegistrationTrend.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredData.monthlyRegistrationTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis dataKey="month" tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 10 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                              <YAxis allowDecimals={false} tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                              <Line type="monotone" dataKey="count" name="Registrations" stroke="#111111" strokeWidth={4} dot={{ r: 4, fill: '#ff3366', stroke: '#000', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 font-bold">No Registration Data</div>
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

                {/* Fundraising / Master Revenue Chart */}
                {(portalType === "fundraising" || portalType === "master") && (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black lg:col-span-3">
                    <h3 className="font-anton text-2xl uppercase mb-6 border-b-2 border-gray-100 pb-4">Sales & Revenue Timeline (Monthly)</h3>
                    <div className="h-72 w-full">
                      {filteredData.monthlyRevenueTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={filteredData.monthlyRevenueTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 10 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                            <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                            <RechartsTooltip formatter={(value) => `Rp ${value.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold' }} />
                            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#000" strokeWidth={4} dot={{ r: 4, fill: '#c1ff00', stroke: '#000', strokeWidth: 2 }} activeDot={{ r: 6 }} />
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h3 className="font-anton text-2xl uppercase">Digital Submission Locker</h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <input type="text" placeholder="Search team or email..." className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-56" value={submissionSearch} onChange={e=>setSubmissionSearch(e.target.value)} />
                    <select className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-40" value={submissionSort} onChange={e=>setSubmissionSort(e.target.value)}>
                      <option value="NEWEST">Newest First</option>
                      <option value="OLDEST">Oldest First</option>
                    </select>
                    <button onClick={exportSubmissionsToCSV} className="bg-black text-[#c1ff00] px-4 py-2 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00] text-sm">
                      Export CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-black">
                        <th className="p-4 font-bold uppercase text-xs">Team / Name</th>
                        <th className="p-4 font-bold uppercase text-xs">Student ID</th>
                        <th className="p-4 font-bold uppercase text-xs">Submitted At</th>
                        <th className="p-4 font-bold uppercase text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.filter(sub => {
                        if (!submissionSearch) return true;
                        const q = submissionSearch.toLowerCase();
                        return (sub.fullName||"").toLowerCase().includes(q) || (sub.email||"").toLowerCase().includes(q);
                      }).sort((a,b) => {
                        const dateA = getSafeTimestamp(a, 'submittedAt');
                        const dateB = getSafeTimestamp(b, 'submittedAt');
                        return submissionSort === "NEWEST" ? dateB - dateA : dateA - dateB;
                      }).map(sub => (
                        <tr key={sub.id} className={`border-b border-gray-100 hover:bg-gray-50 ${sub.status === 'GRADED' ? 'bg-green-50/50' : ''}`}>
                          <td className="p-4">
                            <div className="font-bold text-sm">{sub.fullName}</div>
                            <div className="text-xs text-gray-500">{sub.email}</div>
                          </td>
                          <td className="p-4 text-sm">{sub.studentId || "-"}</td>
                          <td className="p-4 text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                          <td className="p-4 flex gap-2 items-center">
                            <a href={sub.driveLink} target="_blank" rel="noopener noreferrer" className="bg-[#c1ff00] px-4 py-2 rounded-xl text-xs font-bold border-2 border-black uppercase hover:bg-black hover:text-[#c1ff00] transition-colors inline-flex items-center gap-2">
                              <FaDownload /> Download
                            </a>
                            {sub.status === "GRADED" ? (
                              <span className="font-anton text-lg">Score: {sub.score}</span>
                            ) : (
                              <button onClick={() => handleGradeSubmission(sub.id)} className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-gray-800">
                                Grade
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {submissions.length === 0 && (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-bold">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-4xl mb-2">📁</span>
                            <p>No submissions found.</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loadingData && activeTab === "audit_logs" && ["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "suryatripatih2003@gmail.com", "noreply@ymccvii.com"].includes(userEmail) && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
              <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-black">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b-2 border-dashed border-gray-200 gap-4">
                  <h3 className="font-anton text-2xl uppercase">System Audit Trail</h3>
                  <button 
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="bg-[#c1ff00] text-black border-2 border-black px-6 py-3 rounded-xl font-anton uppercase text-sm hover:bg-black hover:text-[#c1ff00] transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isBackingUp ? "MEMBUAT CADANGAN..." : "Backup Database ke Email"}
                  </button>
                </div>
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

              <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000] mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Select Attendance Session</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={scannerSessionId} onChange={e => {setScannerSessionId(e.target.value); setScannedUser(null); setScanMessage("");}}>
                      <option value="">-- Choose an active session --</option>
                      {attendanceSessions.filter(s => s.status === 'OPEN').map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.activityName}) - {s.method}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-auto">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Scanner Mode</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button onClick={() => setScannerMode("CAMERA")} className={`flex-1 px-4 py-3 font-bold text-xs uppercase rounded-lg transition-all ${scannerMode === "CAMERA" ? "bg-white shadow-sm border border-gray-200" : "text-gray-500 hover:text-black"}`}>Camera</button>
                      <button onClick={() => setScannerMode("HARDWARE")} className={`flex-1 px-4 py-3 font-bold text-xs uppercase rounded-lg transition-all ${scannerMode === "HARDWARE" ? "bg-white shadow-sm border border-gray-200" : "text-gray-500 hover:text-black"}`}>Hardware</button>
                    </div>
                  </div>
                </div>
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
                    {scannerMode === "HARDWARE" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-900 text-white">
                        <FaQrcode className="text-6xl mb-4 text-[#c1ff00]" />
                        <h4 className="font-anton text-2xl uppercase mb-2">Hardware Scanner Active</h4>
                        <p className="text-sm text-gray-400 text-center mb-6">
                          No need to click anything. Just scan the QR code with your USB barcode scanner!
                        </p>
                        
                        <div className="w-full h-32 flex items-center justify-center border-4 border-dashed border-[#c1ff00] rounded-2xl bg-[#c1ff00]/10 animate-pulse">
                          <span className="font-mono text-xl text-[#c1ff00] font-bold tracking-widest uppercase">
                            READY TO SCAN
                          </span>
                        </div>
                      </div>
                    ) : (
                      scannerActive ? (
                        <Scanner onScan={handleQrScan} onError={(e) => console.log(e)} components={{ finder: false, zoom: true }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white bg-gray-900 font-bold uppercase">
                          {scannedUser ? "QR Captured!" : "Scanner Paused"}
                        </div>
                      )
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

          {/* ATTENDANCE TAB */}
          {!loadingData && activeTab === "attendance" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-anton text-2xl uppercase">{editingId ? "Edit Attendance Session" : "Create Session"}</h2>
                  {editingId && <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-black">CANCEL EDIT</button>}
                </div>
                <form onSubmit={handleSaveAttendanceSession} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Activity (Parent)</label>
                      <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={attendanceForm.activityId} onChange={e => setAttendanceForm({...attendanceForm, activityId: e.target.value})}>
                        <option value="">-- Select Activity --</option>
                        {activities.map(a => (
                          <option key={a.id} value={a.id}>{a.title} ({a.type})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Session Name</label>
                      <input type="text" placeholder="e.g., Opening Ceremony" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={attendanceForm.name} onChange={e => setAttendanceForm({...attendanceForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Attendance Method</label>
                      <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={attendanceForm.method} onChange={e => setAttendanceForm({...attendanceForm, method: e.target.value})}>
                        <option value="QR_ADMIN">Admin QR Scanner (For Registered)</option>
                        <option value="MANUAL">Manual Check (Admin Ticking)</option>
                        <option value="SELF_SERVICE">Self-Service QR (For Public/Guests)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                      <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={attendanceForm.status} onChange={e => setAttendanceForm({...attendanceForm, status: e.target.value})}>
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="OPEN">OPEN (Active)</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={actionLoading} className="w-full bg-[#c1ff00] text-black font-bold uppercase py-3 rounded-xl shadow-[4px_4px_0_0_#000] border-2 border-black hover:bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all disabled:opacity-50">
                    {actionLoading ? "SAVING..." : "SAVE SESSION"}
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Manage Sessions</h2>
                <div className="space-y-4">
                  {attendanceSessions.map(s => (
                    <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.status === 'OPEN' ? 'bg-green-100 text-green-700' : s.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{s.status}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-100 text-purple-700">{s.method}</span>
                        </div>
                        <h4 className="font-bold text-lg">{s.name}</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.activityName}</p>
                      </div>
                      <div className="flex gap-2">
                        {s.method === "SELF_SERVICE" && s.status === "OPEN" && (
                          <Link href={`/admin/attendance/${s.id}/projector`} target="_blank">
                            <button className="px-3 py-1.5 bg-black text-[#c1ff00] text-xs font-bold uppercase rounded-lg hover:bg-gray-800">
                              Show Projector
                            </button>
                          </Link>
                        )}
                        <Link href={`/admin/attendance/${s.id}`}>
                          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold uppercase rounded-lg hover:bg-blue-100">
                            View Logs
                          </button>
                        </Link>
                        <button onClick={() => { setAttendanceForm({ activityId: s.activityId, name: s.name, method: s.method, status: s.status }); setEditingId(s.id); window.scrollTo(0,0); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteAttendanceSession(s.id)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold uppercase rounded-lg hover:bg-red-100">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                  {attendanceSessions.length === 0 && (
                    <div className="text-center py-8 text-gray-400">No attendance sessions found.</div>
                  )}
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
                  <h2 className="font-anton text-2xl uppercase">{editingId ? "Edit Article" : "Publish Article"}</h2>
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
                    {actionLoading ? 'Publishing...' : (editingId ? 'Update Article' : 'Publish to Main Web')}
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-anton text-2xl uppercase mb-6 border-b pb-4">Published Articles</h2>
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
                  {news.length === 0 && <div className="col-span-full text-center py-8 text-gray-400">No articles available.</div>}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Priority Order</label>
                      <input type="number" placeholder="e.g. 100" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={sponsorForm.priority || 0} onChange={e => setSponsorForm({...sponsorForm, priority: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={sponsorForm.name} onChange={e => setSponsorForm({...sponsorForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Website / Social Media URL</label>
                      <input type="url" placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={sponsorForm.websiteUrl} onChange={e => setSponsorForm({...sponsorForm, websiteUrl: e.target.value})} onBlur={e => setSponsorForm({...sponsorForm, websiteUrl: formatUrl(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Logo Upload</label>
                    <div className="flex gap-4 items-center">
                      <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                      <span className="font-bold text-gray-400">OR</span>
                      <input type="url" placeholder="https://imgur.com/company-logo.png" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={sponsorForm.imageUrl || ""} onChange={e => setSponsorForm({...sponsorForm, imageUrl: e.target.value})} />
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
          {!loadingData && activeTab === "users" && ["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "suryatripatih2003@gmail.com", "noreply@ymccvii.com"].includes(userEmail) && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-[#c1ff00] p-6 rounded-2xl border border-black shadow-[4px_4px_0_0_#000] mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-anton text-2xl uppercase mb-2">Superadmin Privilege</h3>
                  <p className="font-poppins text-sm font-medium">You have exclusive access to review, add, and edit staff applications (Admin & Operator).</p>
                </div>
                <button onClick={() => setAddStaffModal({ ...addStaffModal, isOpen: true })} className="bg-black text-white px-6 py-3 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shrink-0">
                  + Add Staff Manually
                </button>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
                  <h2 className="font-anton text-2xl uppercase">Staff Directory</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <input type="text" placeholder="Search staff name/email..." className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-64" value={staffSearch} onChange={e=>setStaffSearch(e.target.value)} />
                    <select className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-40" value={staffSort} onChange={e=>setStaffSort(e.target.value)}>
                      <option value="NEWEST">Newest First</option>
                      <option value="OLDEST">Oldest First</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  {staffApps.filter(app => {
                    if(!staffSearch) return true;
                    const q = staffSearch.toLowerCase();
                    return (app.name||"").toLowerCase().includes(q) || (app.email||"").toLowerCase().includes(q);
                  }).sort((a,b) => {
                    const dateA = getSafeTimestamp(a, 'createdAt');
                    const dateB = getSafeTimestamp(b, 'createdAt');
                    return staffSort === "NEWEST" ? dateB - dateA : dateA - dateB;
                  }).map(app => (
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

          {/* DATABASE PESERTA TAB */}
          {!loadingData && activeTab === "database" && (userRole === "Superadmin" || userRole === "Admin") && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="bg-[#c1ff00] p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000] mb-8">
                <h3 className="font-anton text-2xl uppercase mb-2">Participant Database</h3>
                <p className="font-poppins text-sm font-medium text-black">
                  Manage and export registered participant data, and view QR Codes for check-in process.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-black shadow-[4px_4px_0_0_#000]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b-2 border-dashed border-gray-200 gap-4">
                  <h2 className="font-anton text-2xl uppercase">Participant Directory</h2>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {/* Search query input */}
                    <input 
                      type="text" 
                      placeholder="Search name/email/wa..." 
                      className="px-4 py-2 border-2 border-black rounded-xl text-sm font-poppins w-full sm:w-48 outline-none focus:bg-gray-50 text-black" 
                      value={dbSearchQuery} 
                      onChange={e => setDbSearchQuery(e.target.value)} 
                    />
                    
                    {/* Activity Filter Dropdown */}
                    <select 
                      className="px-4 py-2 border-2 border-black rounded-xl text-sm font-poppins font-semibold w-full sm:w-48 cursor-pointer outline-none text-black" 
                      value={dbSelectedActivity} 
                      onChange={e => setDbSelectedActivity(e.target.value)}
                    >
                      <option value="ALL">All Competitions</option>
                      {activities.filter(a => a.type === "COMPETITIONS").map(act => (
                        <option key={act.id} value={act.id}>{act.title}</option>
                      ))}
                    </select>

                    {/* Status Filter Dropdown */}
                    <select 
                      className="px-4 py-2 border-2 border-black rounded-xl text-sm font-poppins font-semibold w-full sm:w-40 cursor-pointer outline-none text-black" 
                      value={dbStatusFilter} 
                      onChange={e => setDbStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="UNVERIFIED">Unverified</option>
                      <option value="NEEDS REVISION">Needs Revision</option>
                    </select>

                    {/* Export Button */}
                    <button 
                      onClick={exportDatabaseToCSV} 
                      className="bg-black text-[#c1ff00] px-4 py-2 rounded-xl font-anton uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00] text-sm flex items-center gap-2"
                    >
                      <FaDownload /> Export Database
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="border-b-2 border-black text-xs font-anton uppercase tracking-wider text-gray-500 bg-gray-50">
                        <th className="p-4">Participant</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Institution</th>
                        <th className="p-4">Competition</th>
                        <th className="p-4">Status</th>
                        
                        <th className="text-right p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {(() => {
                        const filtered = getFilteredDatabasePeserta();
                        const ITEMS_PER_PAGE = 15;
                        const startIndex = (dbCurrentPage - 1) * ITEMS_PER_PAGE;
                        const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                        
                        if (paginated.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-gray-400 font-bold">
                                No participant data found.
                              </td>
                            </tr>
                          );
                        }

                        return paginated.map(p => {
                          const paidComps = getUserPaidCompetitions(p.email);
                          return (
                            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-black">
                              <td className="p-4">
                                <div className="font-bold text-gray-900">{p.fullName || "No Name"}</div>
                                <div className="text-xs text-gray-500 font-mono">UID: {p.id}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-xs font-semibold text-gray-700">{p.email}</div>
                                {p.whatsapp && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <FaWhatsapp className="text-green-500" /> {p.whatsapp}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-gray-800">{p.institution || "-"}</div>
                                <div className="text-xs text-gray-500">NPM/NIM: {p.studentId || "-"}</div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {paidComps.length > 0 ? (
                                    paidComps.map((c, i) => (
                                      <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                        {c.name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-400 text-xs italic">Not Registered</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${
                                  p.registrationStatus === 'VERIFIED' 
                                    ? 'bg-[#eefcf0] border-green-500 text-green-700' 
                                    : p.registrationStatus === 'NEEDS REVISION'
                                      ? 'bg-amber-50 border-amber-500 text-amber-700'
                                      : 'bg-red-50 border-red-500 text-red-700'
                                }`}>
                                  {p.registrationStatus || "UNVERIFIED"}
                                </span>
                              </td>
                              
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => setSelectedQrParticipant(p)}
                                  className="bg-white hover:bg-gray-100 border-2 border-black text-black font-anton text-xs uppercase px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] hover:shadow-none active:translate-y-px"
                                >
                                  <FaQrcode /> View QR
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {(() => {
                  const filtered = getFilteredDatabasePeserta();
                  const ITEMS_PER_PAGE = 15;
                  const totalItems = filtered.length;
                  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                  if (totalPages <= 1) return null;
                  return (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t-2 border-dashed border-gray-200 gap-4">
                      <p className="font-poppins text-xs font-bold text-gray-400 uppercase tracking-widest text-center sm:text-left">
                        Showing {(dbCurrentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(dbCurrentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} Participants
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDbCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={dbCurrentPage === 1}
                          className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white border-2 border-black px-4 py-2 rounded-xl text-xs font-anton uppercase transition-all shadow-[2px_2px_0_0_#000] hover:shadow-none active:translate-y-px text-black cursor-pointer disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setDbCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={dbCurrentPage === totalPages}
                          className="bg-[#c1ff00] text-black hover:bg-black hover:text-[#c1ff00] disabled:opacity-50 disabled:hover:bg-[#c1ff00] disabled:hover:text-black border-2 border-black px-4 py-2 rounded-xl text-xs font-anton uppercase transition-all shadow-[2px_2px_0_0_#000] hover:shadow-none active:translate-y-px cursor-pointer disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                })()}
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
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <input type="text" placeholder="Search name/email..." className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-48" value={participantSearch} onChange={e=>setParticipantSearch(e.target.value)} />
                    <select className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-40" value={participantFilter} onChange={e=>setParticipantFilter(e.target.value)}>
                      <option value="ALL">All Status</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="UNVERIFIED">Unverified</option>
                      <option value="NEEDS REVISION">Needs Revision</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-40" value={participantSort} onChange={e=>setParticipantSort(e.target.value)}>
                      <option value="NEWEST">Newest First</option>
                      <option value="OLDEST">Oldest First</option>
                    </select>
                    <button onClick={exportParticipantsToCSV} className="bg-black text-[#c1ff00] px-4 py-2 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00] text-sm">
                      Export Full Data (CSV)
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="border-b-2 border-black text-xs font-bold uppercase tracking-widest text-gray-500">
                                <th className="p-4 border-b border-gray-200">Participant</th>
                                <th className="p-4 border-b border-gray-200">Documents</th>
                                <th className="p-4 border-b border-gray-200">Status</th>
                                
                                <th className="text-right p-4 border-b border-gray-200">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                        {participants.filter(p => p.role === "participant").filter(p => {
                            if (participantFilter !== "ALL" && (p.registrationStatus || "UNVERIFIED") !== participantFilter) return false;
                            if (participantSearch) {
                                const q = participantSearch.toLowerCase();
                                const matchName = (p.fullName || "").toLowerCase().includes(q);
                                const matchEmail = (p.email || "").toLowerCase().includes(q);
                                return matchName || matchEmail;
                            }
                            return true;
                        }).sort((a,b) => {
                            const dateA = getSafeTimestamp(a, 'createdAt');
                            const dateB = getSafeTimestamp(b, 'createdAt');
                            return participantSort === "NEWEST" ? dateB - dateA : dateA - dateB;
                        }).map(p => (
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
                                
                                <td className="p-4 border-b border-gray-100 text-right">
                                    <div className="flex justify-end gap-2">
                                        
                                        <button onClick={() => setParticipantModal({ isOpen: true, data: p })} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg flex items-center gap-1 text-xs font-bold uppercase"><FaEye size={14}/> Detail</button>
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
          {!loadingData && activeTab === "merchandise" && (portalType === "fundraising" || portalType === "master") && (
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
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.name || ""} onChange={e => setMerchForm({...merchForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tagline (Short Desc)</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.tagline || ""} onChange={e => setMerchForm({...merchForm, tagline: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Price String (e.g. 150K)</label>
                      <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.price || ""} onChange={e => setMerchForm({...merchForm, price: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Exact Price (Number)</label>
                      <input type="number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.priceNumber || 0} onChange={e => setMerchForm({...merchForm, priceNumber: Number(e.target.value)})} />
                      <label className="block text-sm font-bold text-gray-700 mt-4 mb-2">Cost Price / Harga Modal (Number)</label>
                      <input type="number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.costPrice || 0} onChange={e => setMerchForm({...merchForm, costPrice: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                      <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.category || "SAFETY WEAR"} onChange={e => setMerchForm({...merchForm, category: e.target.value})}>
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
                      <label className="block text-sm font-bold text-gray-700 mb-2">Sizes (Comma separated, e.g. S, M, L)</label>
                      <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.sizesRaw !== undefined ? merchForm.sizesRaw : (merchForm.sizes ? merchForm.sizes.join(', ') : "")} onChange={e => {
                        const val = e.target.value;
                        const sizes = val.split(',').map(s => s.trim()).filter(Boolean);
                        setMerchForm({...merchForm, sizesRaw: val, sizes});
                      }} />
                    </div>
                  </div>

                  {merchForm.sizes && merchForm.sizes.length > 0 ? (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Available Stock Amount (Per Size)</label>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {merchForm.sizes.map(size => (
                          <div key={size}>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{size}</label>
                            <input type="number" required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl" value={(merchForm.stockPerSize && merchForm.stockPerSize[size]) || 0} onChange={e => setMerchForm({
                              ...merchForm,
                              stockPerSize: {
                                ...merchForm.stockPerSize,
                                [size]: Number(e.target.value)
                              }
                            })} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Available Stock Amount</label>
                      <input type="number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.stockAmount !== undefined ? merchForm.stockAmount : 0} onChange={e => setMerchForm({...merchForm, stockAmount: Number(e.target.value)})} />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea required rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={merchForm.description || ""} onChange={e => setMerchForm({...merchForm, description: e.target.value})}></textarea>
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
                      <p className="font-anton text-lg">Jual: Rp {m.priceNumber.toLocaleString()} | Modal: Rp {(m.costPrice || (m.priceNumber * 0.5)).toLocaleString()}</p>
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
                  <h2 className="font-anton text-2xl uppercase">Recent Orders</h2>
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <input 
                      type="text" 
                      placeholder="Search ID, Name, Email, Phone..." 
                      className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-64"
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                    />
                    <div className="flex gap-2 items-center">
                      <input type="date" className="px-2 py-2 border border-gray-300 rounded text-sm" value={orderDateRange.start} onChange={e => setOrderDateRange({...orderDateRange, start: e.target.value})} />
                      <span className="text-gray-400">-</span>
                      <input type="date" className="px-2 py-2 border border-gray-300 rounded text-sm" value={orderDateRange.end} onChange={e => setOrderDateRange({...orderDateRange, end: e.target.value})} />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-40" value={orderSort} onChange={e=>setOrderSort(e.target.value)}>
                      <option value="NEWEST">Newest First</option>
                      <option value="OLDEST">Oldest First</option>
                    </select>
                    <button onClick={exportOrdersToCSV} className="bg-black text-[#c1ff00] px-4 py-2 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00] text-sm whitespace-nowrap">
                      Export CSV
                    </button>
                    {selectedOrders.length > 0 && (
                      <button onClick={() => {
                        localStorage.setItem('bulkPrintOrderIds', JSON.stringify(selectedOrders));
                        window.open('/admin/print-label-bulk', '_blank');
                      }} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold uppercase hover:bg-blue-800 transition-colors shadow-[2px_2px_0_0_#000] text-sm whitespace-nowrap flex items-center justify-center gap-2" title="Print Labels">
                        <FaPrint size={16} /> ({selectedOrders.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {(() => {
                    const filteredOrdersList = orders.filter(o => {
                      if (orderSearch) {
                        const q = orderSearch.toLowerCase();
                        const cust = o.userDetails || o.customerInfo || {};
                        const fullName = cust.name || cust.fullName || "";
                        const email = cust.email || "";
                        const whatsapp = cust.phone || cust.whatsapp || "";
                        const matchId = o.id.toLowerCase().includes(q);
                        const matchName = fullName.toLowerCase().includes(q);
                        const matchEmail = email.toLowerCase().includes(q);
                        const matchPhone = whatsapp.toLowerCase().includes(q);
                        if (!matchId && !matchName && !matchEmail && !matchPhone) return false;
                      }
                      if (orderDateRange.start || orderDateRange.end) {
                        let tVal = o.createdAt || o.timestamp || o.created_at;
                        if (tVal && tVal.seconds) tVal = tVal.seconds * 1000;
                        if (!tVal) return false;
                        const d = new Date(tVal);
                        if (orderDateRange.start && d < new Date(orderDateRange.start)) return false;
                        if (orderDateRange.end) {
                          const endD = new Date(orderDateRange.end);
                          endD.setDate(endD.getDate() + 1);
                          if (d >= endD) return false;
                        }
                      }
                      return true;
                    }).sort((a,b) => {
                      const dateA = getSafeTimestamp(a, 'createdAt');
                      const dateB = getSafeTimestamp(b, 'createdAt');
                      return orderSort === "NEWEST" ? dateB - dateA : dateA - dateB;
                    });
                    
                    const handleSelectAll = (e) => {
                      if (e.target.checked) {
                        setSelectedOrders(filteredOrdersList.filter(o => o.deliveryMethod !== "pickup").map(o => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    };

                    const handleSelectOne = (id) => {
                      if (selectedOrders.includes(id)) {
                        setSelectedOrders(selectedOrders.filter(x => x !== id));
                      } else {
                        setSelectedOrders([...selectedOrders, id]);
                      }
                    };

                    return (
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                          <tr className="border-b-2 border-black text-xs font-bold uppercase tracking-widest text-gray-500">
                            <th className="py-3 px-4 w-10">
                              <input 
                                type="checkbox" 
                                checked={filteredOrdersList.length > 0 && selectedOrders.length === filteredOrdersList.length}
                                onChange={handleSelectAll}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </th>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">Items</th>
                            <th className="py-3 px-4">Delivery</th>
                            <th className="py-3 px-4">Total Amount</th>
                            <th className="py-3 px-4">Payment</th>
                            <th className="py-3 px-4">Order Status</th>
                            <th className="py-3 px-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                          {filteredOrdersList.map(o => (
                            <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <input 
                                  type="checkbox"
                                  checked={selectedOrders.includes(o.id)}
                                  onChange={() => handleSelectOne(o.id)}
                                  className={`w-4 h-4 ${o.deliveryMethod === 'pickup' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                  disabled={o.deliveryMethod === 'pickup'}
                                  title={o.deliveryMethod === 'pickup' ? 'Pickup orders cannot be bulk printed' : ''}
                                />
                              </td>
                              <td className="py-4 px-4 font-mono text-xs" title={o.id}>{o.id.substring(0,8)}...</td>
                          <td className="py-4 px-4">
                            {(() => {
                              const cust = o.userDetails || o.customerInfo || {};
                              const fullName = cust.name || cust.fullName || "-";
                              const email = cust.email || "-";
                              const whatsapp = cust.phone || cust.whatsapp || "";
                              const referralCode = cust.referralCode || "";
                              return (
                                <>
                                  <div className="font-bold">{fullName}</div>
                                  <div className="text-xs text-gray-500">{email}</div>
                                  {whatsapp && (
                                    <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                      <FaWhatsapp className="text-green-500" /> {whatsapp}
                                    </a>
                                  )}
                                  {referralCode && (
                                    <div className="mt-2 inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-[10px] font-bold">
                                      REF: {referralCode}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-4">
                            <ul className="text-xs list-disc list-inside">
                              {o.items?.map((item, idx) => (
                                <li key={idx}>{item.quantity}x {item.name} {item.size && `(Sz ${item.size})`}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-4 px-4 text-xs max-w-[200px]">
                            <span className="font-bold uppercase block">{o.deliveryMethod}</span>
                            {o.deliveryMethod === "shipping" && o.shippingCost > 0 && <span className="text-gray-500 block mb-1">Cost: Rp {(o.shippingCost/1000).toLocaleString()}k</span>}
                            {(o.waybillId || o.shippingDetails?.trackingNumber) && (
                              <div className="my-1 bg-[#c1ff00] text-black p-2 border-2 border-black rounded text-[10px] font-mono font-bold break-all shadow-[2px_2px_0_0_#000]">
                                {o.shippingDetails?.courier || "RESI"}: {o.waybillId || o.shippingDetails?.trackingNumber}
                              </div>
                            )}
                            {o.deliveryMethod === "shipping" && (o.shippingAddress?.address || o.shippingDetails?.address) && (
                              <div className="mt-1 bg-gray-50 p-2 rounded border border-gray-200">
                                <div className="flex justify-between items-start">
                                  <span className="text-gray-600 line-clamp-2" title={o.shippingAddress?.address || o.shippingDetails?.address}>{o.shippingAddress?.address || o.shippingDetails?.address}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(o.shippingAddress?.address || o.shippingDetails?.address);
                                      toast.success("Address copied!");
                                    }}
                                    className="text-gray-400 hover:text-black"
                                    title="Copy Address"
                                  >
                                    <FaCopy />
                                  </button>
                                </div>
                                <div className="text-gray-500 font-medium mt-1">{o.shippingAddress?.city || o.shippingDetails?.city}, {o.shippingAddress?.province || o.shippingDetails?.province}</div>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 font-bold">Rp {o.totalAmount?.toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs font-bold uppercase rounded border ${
                                o.paymentStatus === 'PAID' || o.paymentStatus === 'SETTLED' ? 'bg-[#c1ff00] border-[#c1ff00] text-black' : 
                                o.paymentStatus === 'EXPIRED' ? 'bg-red-100 border-red-500 text-red-600' : 'bg-orange-100 border-orange-500 text-orange-600'
                              }`}>
                              {o.paymentStatus || 'UNPAID'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <select 
                              value={o.orderStatus || 'PENDING'} 
                              onChange={(e) => handleUpdateOrderStatus(o, e.target.value)}
                              className={`px-2 py-1 text-xs font-bold uppercase rounded border outline-none cursor-pointer ${
                                o.orderStatus === 'COMPLETED' ? 'bg-[#c1ff00] border-[#c1ff00] text-black' : 
                                o.orderStatus === 'CANCELLED' ? 'bg-red-100 border-red-500 text-red-600' : 
                                o.orderStatus === 'SHIPPED' || o.orderStatus === 'READY_FOR_PICKUP' ? 'bg-blue-100 border-blue-500 text-blue-600' :
                                'bg-orange-100 border-orange-500 text-orange-600'
                              }`}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                          <td className="p-4 align-top flex flex-col gap-2">
                            {(o.paymentStatus === 'PAID' || o.paymentStatus === 'SETTLED') && o.deliveryMethod === 'shipping' && (
                              <button onClick={() => window.open(`/admin/print-label/${o.id}`, '_blank')} className="bg-black text-[#c1ff00] px-2 py-1 text-[10px] font-bold uppercase rounded hover:bg-[#c1ff00] hover:text-black transition-colors" title="Print Shipping Label">
                                Print Label
                              </button>
                            )}
                            <button onClick={() => handleDeleteOrder(o.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors self-start" title="Delete Order">
                              <FaTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredOrdersList.length === 0 && (
                        <tr><td colSpan="9" className="text-center py-8 text-gray-400">No orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
                  );
                  })()}
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

          {/* PROMOS AND AFFILIATES TAB */}
          {activeTab === "promos" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-anton text-4xl uppercase hidden md:block">Promos & Affiliates</h2>
                <button onClick={() => { resetForm(); setPromoForm({ code: "", type: "VOUCHER", discount: "", discountType: "PERCENT", maxUses: "", commission: "", affiliateEmail: "" }); window.scrollTo({top:0, behavior:'smooth'}); }} className="flex items-center gap-2 bg-[#c1ff00] border-2 border-black px-4 py-2 font-bold uppercase rounded-xl hover:bg-black hover:text-[#c1ff00] transition-colors shadow-[4px_4px_0_0_#000]">
                  <FaPlus /> Create New
                </button>
              </div>

              <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_#000] mb-8">
                <h3 className="font-bold text-xl uppercase mb-4">{editingId ? "Edit Promo" : "Create Promo/Affiliate"}</h3>
                <form onSubmit={handleSavePromo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Type</label>
                      <select className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-black" value={promoForm.type} onChange={(e) => setPromoForm({...promoForm, type: e.target.value})}>
                        <option value="VOUCHER">Voucher Code</option>
                        <option value="REFERRAL">Affiliate Referral</option>
                      </select>
                    </div>
                    {promoForm.type === "VOUCHER" ? (
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Promo Code</label>
                        <input required type="text" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-black" placeholder="e.g. FLASH44" value={promoForm.code} onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Affiliate Email</label>
                        <input required type="email" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-black" placeholder="partner@email.com" value={promoForm.affiliateEmail} onChange={(e) => setPromoForm({...promoForm, affiliateEmail: e.target.value})} />
                        <p className="text-xs text-gray-400 mt-1">*Code will be auto-generated.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Discount Type</label>
                      <select className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-black" value={promoForm.discountType} onChange={(e) => setPromoForm({...promoForm, discountType: e.target.value})}>
                        <option value="PERCENT">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (Rp)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Discount Value</label>
                      <input required type="number" min="0" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-black" placeholder={promoForm.discountType === "PERCENT" ? "e.g. 15" : "e.g. 20000"} value={promoForm.discount} onChange={(e) => setPromoForm({...promoForm, discount: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promoForm.type === "VOUCHER" && (
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Uses (Optional)</label>
                        <input type="number" min="1" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-black" placeholder="e.g. 50" value={promoForm.maxUses} onChange={(e) => setPromoForm({...promoForm, maxUses: e.target.value})} />
                      </div>
                    )}
                    {promoForm.type === "REFERRAL" && (
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Commission Amount (Rp)</label>
                        <input required type="number" min="0" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-black" placeholder="e.g. 15000" value={promoForm.commission} onChange={(e) => setPromoForm({...promoForm, commission: e.target.value})} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t-2 border-black">
                    {editingId && <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 text-black font-bold uppercase rounded hover:bg-gray-300 transition-colors">Cancel</button>}
                    <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-black text-[#c1ff00] font-bold uppercase rounded hover:bg-[#c1ff00] hover:text-black transition-colors border-2 border-black disabled:opacity-50">
                      {actionLoading ? "Saving..." : "Save Promo"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid gap-4">
                {promos.map((p) => (
                  <div key={p.id} className="bg-white border-2 border-black p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-[4px_4px_0_0_#000]">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-xl uppercase">{p.code}</h4>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase text-white ${p.type === 'REFERRAL' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                          {p.type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-600">
                        Discount: {p.discountType === "PERCENT" ? `${p.discount}%` : `Rp ${parseInt(p.discount).toLocaleString()}`}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gray-500">Status:</span>
                        <button onClick={() => handleTogglePromoStatus(p)} className={`relative w-10 h-5 rounded-full transition-colors ${p.isActive !== false ? 'bg-[#c1ff00] border-black border-2' : 'bg-gray-300 border-gray-400 border-2'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-transform ${p.isActive !== false ? 'translate-x-5' : 'translate-x-1'}`}></div>
                        </button>
                        <span className="text-xs font-bold uppercase">{p.isActive !== false ? 'Active' : 'Inactive'}</span>
                      </div>
                      {p.type === "REFERRAL" && (
                        <div className="mt-2 text-xs text-gray-500 font-bold bg-gray-100 p-2 rounded border border-gray-200">
                          <p>Affiliate: {p.affiliateEmail}</p>
                          <p>Commission: Rp {parseInt(p.commission).toLocaleString()}</p>
                          <div className="flex gap-4 mt-1">
                             <span className="text-orange-500">Frozen: Rp {parseInt(p.frozenBalance||0).toLocaleString()}</span>
                             <span className="text-green-500">Available: Rp {parseInt(p.availableBalance||0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      {p.type === "VOUCHER" && p.maxUses && (
                        <p className="text-xs text-gray-500 font-bold mt-1">Max Uses: {p.maxUses}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingId(p.id);
                        setPromoForm({ code: p.code||"", type: p.type||"VOUCHER", discount: p.discount||"", discountType: p.discountType||"PERCENT", maxUses: p.maxUses||"", commission: p.commission||"", affiliateEmail: p.affiliateEmail||"" });
                        window.scrollTo({top:0, behavior:'smooth'});
                      }} className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center hover:bg-black hover:text-[#c1ff00] transition-colors">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeletePromo(p.id)} className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
                {promos.length === 0 && (
                  <div className="text-center text-gray-500 font-bold py-8">No promos or affiliates found.</div>
                )}
              </div>

              <div className="mt-12 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-black pb-4">
                <h2 className="font-anton text-3xl uppercase">Affiliate Applications</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <input type="text" placeholder="Search name or email..." className="px-4 py-2 border-2 border-black rounded-xl text-sm w-full sm:w-56 outline-none focus:bg-gray-100" value={affiliateSearch} onChange={e=>setAffiliateSearch(e.target.value)} />
                  <select className="px-4 py-2 border-2 border-black rounded-xl text-sm w-full sm:w-40 outline-none focus:bg-gray-100" value={affiliateSort} onChange={e=>setAffiliateSort(e.target.value)}>
                    <option value="NEWEST">Newest First</option>
                    <option value="OLDEST">Oldest First</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {affiliateApps.filter(app => {
                  if (!affiliateSearch) return true;
                  const q = affiliateSearch.toLowerCase();
                  return (app.fullName||"").toLowerCase().includes(q) || (app.email||"").toLowerCase().includes(q);
                }).sort((a,b) => {
                  const dateA = getSafeTimestamp(a, 'createdAt');
                  const dateB = getSafeTimestamp(b, 'createdAt');
                  return affiliateSort === "NEWEST" ? dateB - dateA : dateA - dateB;
                }).map(app => (
                   <div key={app.id} className="bg-white border-2 border-black p-6 rounded-2xl shadow-[4px_4px_0_0_#000] flex flex-col justify-between">
                     <div className="mb-4">
                       <div className="flex justify-between items-start mb-2">
                         <h4 className="font-bold text-xl uppercase break-words w-2/3">{app.fullName}</h4>
                         <p className={`text-[10px] font-bold uppercase p-1 px-3 rounded-full border-2 ${app.status === 'APPROVED' ? 'bg-[#c1ff00] border-black text-black' : app.status === 'REJECTED' ? 'bg-red-200 border-red-500 text-red-800' : 'bg-orange-200 border-orange-500 text-orange-800'}`}>
                           {app.status}
                         </p>
                       </div>
                       <p className="text-sm font-bold text-gray-500 mb-4">{app.email} | {app.phone}</p>
                       
                       <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                         <p className="text-sm break-all"><span className="font-bold text-gray-700">Social:</span> <a href={app.socialLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{app.socialLink}</a></p>
                         <p className="text-sm break-words"><span className="font-bold text-gray-700">Bank:</span> {app.bankDetails}</p>
                         <details className="text-sm cursor-pointer group">
                           <summary className="font-bold text-gray-700 hover:text-black">Reason (Click to read)</summary>
                           <p className="mt-2 text-gray-600 break-words whitespace-pre-wrap">{app.reason}</p>
                         </details>
                       </div>
                     </div>
                     <div className="flex gap-2 justify-end shrink-0 pt-4 border-t border-gray-100">
                       {app.status === "PENDING" && (
                         <>
                           <button onClick={() => handleApproveAffiliate(app)} className="bg-[#c1ff00] text-black font-bold uppercase border-2 border-black px-4 py-2 rounded-xl hover:bg-black hover:text-[#c1ff00] transition-colors text-xs flex-1 text-center">
                             Approve
                           </button>
                           <button onClick={() => handleRejectAffiliate(app.id)} className="bg-orange-500 text-white font-bold uppercase border-2 border-black px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-xs flex-1 text-center">
                             Reject
                           </button>
                         </>
                       )}
                       <button onClick={async () => { if (await confirmAction("Are you sure you want to permanently delete this application?")) handleDeleteAffiliate(app.id); }} className="bg-red-500 text-white font-bold uppercase border-2 border-black px-4 py-2 rounded-xl hover:bg-red-600 transition-colors text-xs flex-1 text-center">
                         Delete
                       </button>
                     </div>
                   </div>
                ))}
                {affiliateApps.length === 0 && <div className="lg:col-span-2 text-center text-gray-500 font-bold py-12 border-2 border-dashed border-gray-300 rounded-2xl">No applications yet.</div>}
              </div>
            </div>
          )}

          {/* PAYOUTS TAB */}
          {activeTab === "payouts" && (
            <div className="animate-fade-in pb-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-anton text-4xl uppercase">Payout Requests</h2>
              </div>
              <div className="grid gap-4">
                {payoutRequests.length === 0 && (
                  <div className="text-center text-gray-500 font-bold py-8">No payout requests found.</div>
                )}
                {payoutRequests.map(req => (
                  <div key={req.id} className="bg-white border-2 border-black p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-[4px_4px_0_0_#000]">
                    <div>
                      <p className="font-bold text-lg">{req.email}</p>
                      <p className="text-sm font-semibold text-gray-600">Amount: Rp {Number(req.amount).toLocaleString("id-ID")}</p>
                      <p className="text-xs text-gray-500 mt-1">Requested at: {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex gap-2 items-center">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase border-2 ${req.status === 'PAID' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-yellow-100 border-yellow-500 text-yellow-700'}`}>
                        {req.status}
                      </span>
                      {req.status === 'PENDING' && (
                        <button onClick={() => handleApprovePayout(req)} className="bg-black text-[#c1ff00] font-bold text-xs uppercase px-4 py-2 rounded-lg border-2 border-black hover:bg-[#c1ff00] hover:text-black transition-colors shadow-[2px_2px_0_0_#000]">
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RECRUITMENT TAB */}
          {!loadingData && activeTab === "recruitment" && (portalType === "admin" || portalType === "master") && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
              <div className="bg-[#c1ff00] p-6 rounded-2xl border border-black shadow-[4px_4px_0_0_#000] mb-8">
                <h3 className="font-anton text-2xl uppercase mb-2">Staff Recruitment Database</h3>
                <p className="font-poppins text-sm font-medium">Review new staff applications and export their data for further processing.</p>
                <div className="mt-4 flex flex-wrap gap-4 items-center bg-white/50 p-4 rounded-xl border border-black/10">
                  <span className="font-bold text-sm uppercase">Pendaftaran Terbuka:</span>
                  <div className="flex gap-2">
                    {["UPCOMING", "OPEN", "CLOSED"].map(s => (
                      <button key={s} onClick={() => updateRecruitmentSettings(s)} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase border-2 transition-all ${recruitmentSettings === s ? 'bg-black text-[#c1ff00] border-black shadow-[2px_2px_0_0_#000]' : 'bg-white text-gray-500 border-gray-300 hover:border-black'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
                  <h2 className="font-anton text-2xl uppercase">Applicants</h2>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={exportRecruitmentToCSV} className="bg-black text-[#c1ff00] px-4 py-2 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors shadow-[2px_2px_0_0_#c1ff00] text-sm">
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="border-b-2 border-black text-xs font-bold uppercase tracking-widest text-gray-500">
                        <th className="p-4 border-b border-gray-200">Name & Contact</th>
                        <th className="p-4 border-b border-gray-200">Divisions</th>
                        <th className="p-4 border-b border-gray-200">Submitted At</th>
                        <th className="p-4 border-b border-gray-200">Status</th>
                        <th className="text-right p-4 border-b border-gray-200">Documents</th>
                      </tr>
                    </thead>
                    {recruitmentSubmissions.map(req => (
                      <tbody key={req.id} className="text-sm font-medium border-b border-gray-300">
                        <tr>
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{req.fullName}</div>
                            <div className="text-xs text-gray-500">{req.email} | {req.whatsapp}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">1. {req.division1}</div>
                            <div className="text-xs text-gray-500">2. {req.division2}</div>
                          </td>
                          <td className="p-4">
                            {req.submittedAt ? new Date(req.submittedAt.seconds * 1000).toLocaleString() : "-"}
                          </td>
                          <td className="p-4">
                            <select 
                              value={req.status || "PENDING_REVIEW"}
                              onChange={(e) => setRecruitmentStatusModal({ isOpen: true, docId: req.id, newStatus: e.target.value, applicant: req, acceptedDivision: e.target.value === "ACCEPTED" ? req.division1 : "" })}
                              className="px-2 py-1 text-xs font-bold uppercase rounded border border-gray-300 bg-white cursor-pointer outline-none focus:border-black"
                            >
                              <option value="PENDING_REVIEW">PENDING REVIEW</option>
                              <option value="INTERVIEW">INTERVIEW</option>
                              <option value="ACCEPTED">ACCEPTED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </td>
                          <td className="text-right p-4 space-y-2">
                            {req.ktaLink && <a href={req.ktaLink} target="_blank" className="text-blue-500 underline text-xs block hover:text-black">View KTA/KTM</a>}
                            {req.documentLink && <a href={req.documentLink} target="_blank" className="text-blue-500 underline text-xs block hover:text-black">View Support Docs</a>}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="5" className="p-4 pt-0">
                             <details className="text-xs group border border-gray-200 rounded-xl p-4 bg-gray-50 hover:border-black transition-colors">
                               <summary className="font-bold cursor-pointer text-[#c1ff00] bg-black inline-block px-4 py-2 rounded-lg tracking-widest uppercase">VIEW FULL DETAILS</summary>
                               <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 border-t border-gray-200 pt-4">
                                 <div>
                                   <strong className="block text-black mb-1">NIM / Domicile</strong>
                                   <p>{req.nim} / {req.domicile}</p>
                                 </div>
                                 <div>
                                   <strong className="block text-black mb-1">Academic Commitment</strong>
                                   <p>{req.academicCommitment}</p>
                                 </div>
                                 <div className="md:col-span-2">
                                   <strong className="block text-black mb-1">Organization Experience</strong>
                                   <p className="whitespace-pre-wrap leading-relaxed">{req.organizationExp}</p>
                                 </div>
                                 <div className="md:col-span-2">
                                   <strong className="block text-black mb-1">Achievement / Challenge</strong>
                                   <p className="whitespace-pre-wrap leading-relaxed">{req.achievementDesc}</p>
                                 </div>
                                 <div className="md:col-span-2">
                                   <strong className="block text-black mb-1">Specific Contribution</strong>
                                   <p className="whitespace-pre-wrap leading-relaxed">{req.specificContribution}</p>
                                 </div>
                               </div>
                             </details>
                          </td>
                        </tr>
                      </tbody>
                    ))}
                    {recruitmentSubmissions.length === 0 && (
                      <tbody>
                        <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-bold">No applications found.</td></tr>
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RECRUITMENT STATUS MODAL */}
      {recruitmentStatusModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-sm border-2 border-black shadow-[4px_4px_0_0_#000] text-center">
            <h3 className="font-anton text-2xl uppercase mb-2">Update Status</h3>
            <p className="text-sm font-medium text-gray-600 mb-6">Change status for <strong>{recruitmentStatusModal.applicant?.fullName}</strong> to <strong className="text-black">{recruitmentStatusModal.newStatus}</strong>?</p>
            
            {recruitmentStatusModal.newStatus === "ACCEPTED" && (
              <div className="mb-6 text-left">
                <label className="block text-xs font-bold uppercase text-gray-700 mb-2">Accepted into Division:</label>
                <select 
                  value={recruitmentStatusModal.showCustomDivision ? "KONDISIONAL" : (recruitmentStatusModal.acceptedDivision === recruitmentStatusModal.applicant?.division1 ? recruitmentStatusModal.applicant?.division1 : recruitmentStatusModal.applicant?.division2)}
                  onChange={(e) => {
                    if (e.target.value === "KONDISIONAL") {
                      setRecruitmentStatusModal({ ...recruitmentStatusModal, showCustomDivision: true, acceptedDivision: divisionsList[0] });
                    } else {
                      setRecruitmentStatusModal({ ...recruitmentStatusModal, showCustomDivision: false, acceptedDivision: e.target.value });
                    }
                  }}
                  className="w-full bg-gray-50 border-2 border-black rounded-lg px-3 py-2 text-sm font-semibold focus:ring-[#c1ff00] cursor-pointer mb-2"
                >
                  <option value={recruitmentStatusModal.applicant?.division1}>Option 1: {recruitmentStatusModal.applicant?.division1}</option>
                  <option value={recruitmentStatusModal.applicant?.division2}>Option 2: {recruitmentStatusModal.applicant?.division2}</option>
                  <option value="KONDISIONAL">Conditional (Other Division)</option>
                </select>
                
                {recruitmentStatusModal.showCustomDivision && (
                  <select 
                    value={recruitmentStatusModal.acceptedDivision}
                    onChange={(e) => setRecruitmentStatusModal({ ...recruitmentStatusModal, acceptedDivision: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-black rounded-lg px-3 py-2 text-sm focus:ring-[#c1ff00]"
                  >
                    {divisionsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <button onClick={() => submitRecruitmentStatus(true)} className="w-full bg-[#c1ff00] text-black border-2 border-black px-4 py-3 rounded-xl font-bold uppercase shadow-[2px_2px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                Yes & Send Email
              </button>
              <button onClick={() => submitRecruitmentStatus(false)} className="w-full bg-white text-black border-2 border-black px-4 py-3 rounded-xl font-bold uppercase hover:bg-gray-100 transition-colors">
                Yes (Without Email)
              </button>
              <button onClick={() => setRecruitmentStatusModal({ isOpen: false, docId: null, newStatus: "", applicant: null, acceptedDivision: "", showCustomDivision: false })} className="w-full bg-gray-200 text-gray-600 px-4 py-3 rounded-xl font-bold uppercase hover:bg-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ... previous modals like edit staff remain untouched ... */}


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
            <form onSubmit={handleRegisterStaffManual} className="flex flex-col gap-6 mt-4">
              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Full Legal Name</label>
                <input type="text" required placeholder="As written on ID/KTM" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all" value={addStaffModal.name} onChange={e => setAddStaffModal({...addStaffModal, name: e.target.value})} />
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Address</label>
                <input type="email" required placeholder="active.email@domain.com" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all" value={addStaffModal.email} onChange={e => setAddStaffModal({...addStaffModal, email: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Password</label>
                  <input type="password" required minLength="8" placeholder="Minimum 8 characters" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all" value={addStaffModal.password} onChange={e => setAddStaffModal({...addStaffModal, password: e.target.value})} />
                </div>
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Confirm Password</label>
                  <input type="password" required minLength="8" placeholder="Verify password" className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 transition-all ${addStaffModal.confirmPassword && addStaffModal.password !== addStaffModal.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-black focus:ring-[#c1ff00]"}`} value={addStaffModal.confirmPassword} onChange={e => setAddStaffModal({...addStaffModal, confirmPassword: e.target.value})} />
                  {addStaffModal.confirmPassword && addStaffModal.password !== addStaffModal.confirmPassword && (
                    <p className="text-red-500 text-xs mt-2 font-bold font-poppins">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Student ID (NIM)</label>
                  <input type="text" required placeholder="NIM / NPM" pattern="^[0-9]+$" title="Must contain numbers only" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all" value={addStaffModal.nim} onChange={e => setAddStaffModal({...addStaffModal, nim: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Position in YMCC</label>
                  <select required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer" value={addStaffModal.position} onChange={e => {
                    const value = e.target.value;
                    if (value === "BOD" || value === "Head") {
                      setAddStaffModal({...addStaffModal, position: value, division: ""});
                    } else {
                      setAddStaffModal({...addStaffModal, position: value});
                    }
                  }}>
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="Head">Head of Department</option>
                    <option value="BOD">Board of Directors (BOD)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Role</label>
                  <select required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer" value={addStaffModal.role} onChange={e => setAddStaffModal({...addStaffModal, role: e.target.value})}>
                    <option value="Operator">Operator</option>
                    <option value="Admin">Admin</option>
                    <option value="Fundraising">Fundraising</option>
                  </select>
                </div>
              </div>

              <div className={`grid grid-cols-1 ${addStaffModal.position === "BOD" || addStaffModal.position === "Head" ? "" : "md:grid-cols-2"} gap-6`}>
                <div>
                  <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">
                    {addStaffModal.position === "BOD" ? "Board of Directors Role" : "YMCC Department"}
                  </label>
                  {addStaffModal.position === "BOD" ? (
                    <select required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer" value={addStaffModal.department} onChange={e => setAddStaffModal({...addStaffModal, department: e.target.value, division: ""})}>
                      <option value="">-- Select BOD Role --</option>
                      {bodData.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  ) : (
                    <select required className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer" value={addStaffModal.department} onChange={e => setAddStaffModal({...addStaffModal, department: e.target.value, division: ""})}>
                      <option value="">-- Select Department --</option>
                      {Object.keys(departmentData).map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                  )}
                </div>
                
                {addStaffModal.position !== "BOD" && addStaffModal.position !== "Head" && (
                  <div>
                    <label className="block font-poppins font-bold text-xs uppercase tracking-widest text-[#111] mb-2">YMCC Division</label>
                    <select required disabled={!addStaffModal.department} className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all font-semibold cursor-pointer disabled:opacity-50" value={addStaffModal.division} onChange={e => setAddStaffModal({...addStaffModal, division: e.target.value})}>
                      <option value="">-- Select Division --</option>
                      {addStaffModal.department && departmentData[addStaffModal.department] && departmentData[addStaffModal.department].map(div => <option key={div} value={div}>{div}</option>)}
                    </select>
                  </div>
                )}
              </div>



              <div className="flex gap-4 pt-4 mt-2">
                <button type="button" onClick={() => setAddStaffModal({...addStaffModal, isOpen:false})} className="flex-1 bg-white border-2 border-black text-black font-poppins font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-1 bg-[#c1ff00] border-2 border-black text-black font-poppins font-bold uppercase tracking-widest py-3 rounded-xl shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  {actionLoading ? "PROCESSING..." : "REGISTER ACCOUNT"}
                </button>
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

            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center">
                <span className="text-gray-500 font-bold text-xs block uppercase mb-2">Formal Profile Photo</span>
                {participantModal.data.photoUrl ? (
                  <div className="w-32 h-40 bg-red-600 rounded-lg overflow-hidden border-2 border-black shadow-[4px_4px_0_0_#000]">
                    <img src={participantModal.data.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-40 bg-gray-100 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-400 text-gray-400 text-xs text-center p-2">
                    No Photo<br/>Uploaded
                  </div>
                )}
              </div>
            </div>

            
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
