"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword } from "firebase/auth";
import { FaSignOutAlt, FaWallet, FaSnowflake, FaCopy, FaCheck, FaLock, FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { resetUserPassword, getFriendlyErrorMessage } from "@/lib/auth";

export default function AffiliateDashboard() {
  const [user, setUser] = useState(null);
  const [promos, setPromos] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [pendingPayout, setPendingPayout] = useState(null);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    const fetchPromos = async () => {
      try {
        const { getDocs, collection, query, where } = await import("firebase/firestore");
        
        const payoutsRef = collection(db, "payout_requests");
        const qPayouts = query(payoutsRef, where("email", "==", user.email), where("status", "==", "PENDING"));
        const payoutsSnap = await getDocs(qPayouts);
        if (!payoutsSnap.empty) {
          setPendingPayout({ id: payoutsSnap.docs[0].id, ...payoutsSnap.docs[0].data() });
        } else {
          setPendingPayout(null);
        }

        const promosRef = collection(db, "promos");
        const q = query(promosRef, where("affiliateEmail", "==", user.email));
        const snapshot = await getDocs(q);
        const fetchedPromos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let allOrders = [];
        if (fetchedPromos.length > 0) {
          const promoCodes = fetchedPromos.map(p => p.code);
          const ordersRef = collection(db, "merch_orders");
          // Handle max 10 codes per 'in' query
          for (let i = 0; i < promoCodes.length; i += 10) {
            const chunk = promoCodes.slice(i, i + 10);
            const qOrders = query(ordersRef, where("customerInfo.referralCode", "in", chunk));
            const oSnap = await getDocs(qOrders);
            oSnap.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));
          }
        }
        
        if (isMounted) {
          setPromos(fetchedPromos);
          setOrders(allOrders);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };
    
    fetchPromos();
    const interval = setInterval(fetchPromos, 15000); // Poll every 15s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
    } catch (err) {
      toast.error("Login failed: Invalid email or password");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success("Password changed successfully!");
        setChangePwdOpen(false);
        setNewPassword("");
      }
    } catch (err) {
      toast.error("Failed to change password. You may need to re-login first.");
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-anton text-2xl">LOADING...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 font-sans">
        <h1 className="font-anton text-5xl uppercase mb-4 text-center">Affiliate Portal</h1>
        <p className="font-bold text-gray-500 mb-8 text-center max-w-md">Enter your registered affiliate email and password to view your real-time earnings.</p>
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0_0_#000] space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Email Address</label>
            <input type="email" required className="w-full border-2 border-black rounded-xl px-4 py-3 outline-none focus:bg-gray-50" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold uppercase">Password</label>
              <button 
                type="button" 
                onClick={() => setShowResetModal(true)}
                className="text-xs font-bold text-gray-500 hover:text-black underline transition-colors focus:outline-none"
              >
                Lupa Password?
              </button>
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required className="w-full border-2 border-black rounded-xl px-4 py-3 outline-none focus:bg-gray-50" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-500 hover:text-black">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#c1ff00] text-black border-2 border-black px-8 py-3 rounded-xl font-bold uppercase shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] transition-all">
            Secure Login
          </button>
        </form>

        {/* RESET PASSWORD MODAL */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in text-left">
            <div className="bg-white border-4 border-black p-8 rounded-[2rem] max-w-md w-full shadow-[8px_8px_0_0_#000] relative">
              <button 
                onClick={() => setShowResetModal(false)}
                className="absolute right-6 top-6 text-gray-500 hover:text-black transition-colors focus:outline-none"
              >
                <FaTimes className="text-xl" />
              </button>
              <h3 className="font-anton text-3xl uppercase mb-2">Reset Password</h3>
              <p className="font-poppins text-gray-600 mb-6 font-semibold text-sm leading-relaxed">
                Masukkan alamat email afiliasi Anda yang terdaftar. Kami akan mengirimkan tautan reset kata sandi.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block font-bold text-xs uppercase tracking-widest text-[#111] mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c1ff00] transition-all lowercase"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-[#c1ff00] text-[#111] font-anton text-xl uppercase tracking-widest py-3.5 rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
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

  // Calculate totals dynamically from orders for absolute transparency, or fallback to promo snapshots.
  // Actually, let's use the promo snapshots for balances, but show orders below.
  const totalAvailable = promos.reduce((sum, p) => sum + (Number(p.availableBalance) || 0), 0);
  const totalFrozen = promos.reduce((sum, p) => sum + (Number(p.frozenBalance) || 0), 0);

  const handleRequestPayout = async () => {
    if (totalAvailable < 50000) {
      toast.error("Minimum payout is Rp 50.000");
      return;
    }
    setRequestingPayout(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "payout_requests"), {
        email: user.email,
        amount: totalAvailable,
        status: "PENDING",
        createdAt: serverTimestamp()
      });
      toast.success("Payout request submitted successfully!");
      setPendingPayout({ amount: totalAvailable, status: "PENDING" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to request payout.");
    } finally {
      setRequestingPayout(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6 md:px-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="font-anton text-4xl uppercase">Affiliate Dashboard</h1>
            <p className="font-bold text-gray-500">Welcome back, {user.email}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setChangePwdOpen(true)} className="flex items-center gap-2 bg-white border-2 border-black px-4 py-2 font-bold uppercase rounded-xl hover:bg-gray-100 transition-colors text-sm">
              <FaLock /> Change Password
            </button>
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 bg-white border-2 border-black px-4 py-2 font-bold uppercase rounded-xl hover:bg-red-500 hover:text-white transition-colors text-sm">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {promos.length === 0 ? (
          <div className="bg-white border-4 border-black p-12 text-center rounded-3xl shadow-[8px_8px_0_0_#000]">
            <h2 className="font-anton text-3xl uppercase mb-2">No Active Referrals</h2>
            <p className="font-bold text-gray-500">Your email is not associated with any active referral codes. Please contact the Fundraising team if you believe this is a mistake.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0_0_#000] flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#c1ff00] rounded-full border-4 border-black flex items-center justify-center text-3xl">
                    <FaWallet />
                  </div>
                  <div>
                    <p className="font-bold text-gray-500 uppercase text-sm tracking-widest">Available Balance</p>
                    <p className="font-anton text-4xl">Rp {totalAvailable.toLocaleString("id-ID")}</p>
                  </div>
                </div>
                <div>
                  {pendingPayout ? (
                    <div className="bg-yellow-100 border-2 border-black px-4 py-2 rounded-xl text-center">
                      <p className="text-xs font-bold uppercase text-yellow-700">Pending Payout</p>
                      <p className="font-anton text-lg">Rp {Number(pendingPayout.amount).toLocaleString("id-ID")}</p>
                    </div>
                  ) : (
                    <button onClick={handleRequestPayout} disabled={requestingPayout || totalAvailable < 50000} className="bg-black text-[#c1ff00] border-2 border-black font-bold uppercase text-sm px-4 py-3 rounded-xl shadow-[4px_4px_0_0_#c1ff00] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#c1ff00] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {requestingPayout ? "Processing..." : "Request Payout"}
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0_0_#000] flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full border-4 border-black flex items-center justify-center text-3xl text-blue-500">
                  <FaSnowflake />
                </div>
                <div>
                  <p className="font-bold text-gray-500 uppercase text-sm tracking-widest">Frozen Balance (Pending)</p>
                  <p className="font-anton text-4xl">Rp {totalFrozen.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0_0_#000]">
              <h2 className="font-anton text-2xl uppercase mb-6">Your Referral Codes</h2>
              <div className="space-y-4">
                {promos.map(promo => (
                  <div key={promo.id} className="border-2 border-black rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-anton text-3xl uppercase text-purple-600">{promo.code}</span>
                        <button onClick={() => handleCopy(promo.code)} className="text-gray-400 hover:text-black transition-colors" title="Copy Code">
                          {copiedCode === promo.code ? <FaCheck className="text-green-500" /> : <FaCopy />}
                        </button>
                      </div>
                      <p className="text-sm font-bold text-gray-500">
                        Offers: {promo.discountType === "PERCENT" ? `${promo.discount}% Off` : `Rp ${Number(promo.discount).toLocaleString("id-ID")} Off`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 bg-white border-2 border-black p-3 rounded-lg">
                      <div className="text-center px-4 border-r-2 border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commission / Item</p>
                        <p className="font-bold">Rp {Number(promo.commission).toLocaleString("id-ID")}</p>
                      </div>
                      <div className="text-center px-4 border-r-2 border-gray-200">
                        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Frozen</p>
                        <p className="font-bold text-orange-500">Rp {Number(promo.frozenBalance).toLocaleString("id-ID")}</p>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Available</p>
                        <p className="font-bold text-green-500">Rp {Number(promo.availableBalance).toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0_0_#000]">
              <h2 className="font-anton text-2xl uppercase mb-2">Recent Conversions (Real-time)</h2>
              <p className="font-bold text-gray-500 text-sm mb-6">Transparansi penuh: Berikut adalah daftar pesanan yang menggunakan kode referral Anda. Komisi hanya akan cair ke Available Balance jika status pesanan PAID.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="border-b-2 border-black text-xs font-bold uppercase tracking-widest text-gray-500">
                      <th className="p-4 border-b border-gray-200">Date</th>
                      <th className="p-4 border-b border-gray-200">Order ID (Masked)</th>
                      <th className="p-4 border-b border-gray-200">Code Used</th>
                      <th className="p-4 border-b border-gray-200">Items Qty</th>
                      <th className="p-4 border-b border-gray-200">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium">
                    {orders.length > 0 ? orders.map((o) => {
                      const qty = o.items ? o.items.reduce((sum, item) => sum + item.quantity, 0) : 1;
                      const maskedId = o.id.substring(0, 8) + "***" + o.id.substring(o.id.length - 2);
                      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);
                      const dateStr = orderDate && !isNaN(orderDate.getTime()) 
                        ? orderDate.toLocaleDateString("id-ID", {day:'numeric', month:'short', year:'numeric'}) 
                        : "-";
                      return (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="p-4 border-b border-gray-100">{dateStr}</td>
                          <td className="p-4 border-b border-gray-100">{maskedId}</td>
                          <td className="p-4 border-b border-gray-100 font-bold text-purple-600">{o.customerInfo?.referralCode}</td>
                          <td className="p-4 border-b border-gray-100">{qty} Items</td>
                          <td className="p-4 border-b border-gray-100">
                            <span className={`px-2 py-1 text-xs rounded-full border ${o.status === "PAID" ? "bg-green-100 text-green-800 border-green-500" : o.status === "EXPIRED" ? "bg-red-100 text-red-800 border-red-500" : "bg-orange-100 text-orange-800 border-orange-500"}`}>
                              {o.status || "PENDING"}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500 font-bold">No orders found using your codes yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {changePwdOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm border-4 border-black shadow-[8px_8px_0_0_#000]">
            <h3 className="font-anton text-2xl uppercase mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-2">New Password</label>
                <input type="password" required minLength="6" className="w-full border-2 border-black rounded-xl px-4 py-3 outline-none focus:bg-gray-50" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setChangePwdOpen(false)} className="flex-1 bg-white border-2 border-black text-black font-bold uppercase py-3 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 bg-black text-white font-bold uppercase py-3 rounded-xl hover:bg-gray-800">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
