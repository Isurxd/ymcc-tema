"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { FaArrowLeft, FaFileExcel, FaTrash, FaCheck, FaSearch } from "react-icons/fa";
import Link from "next/link";
import { useConfirm } from "@/context/ConfirmContext";
import * as XLSX from 'xlsx';

export default function SessionDetailPage(props) {
  const params = use(props.params);
  const router = useRouter();
  const confirmAction = useConfirm();
  const [sessionData, setSessionData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestInstansi, setGuestInstansi] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const { sessionId } = params;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }
      setUserEmail(user.email);
      
      // Verify admin access by attempting to read a protected collection
      try {
        const testSnap = await getDoc(doc(db, "audit_logs", "test"));
      } catch (err) {
        if (err.code === "permission-denied") {
          router.push("/portal");
          return;
        }
      }

      fetchSessionData();
    });
    return () => unsubAuth();
  }, []);

  const fetchSessionData = async () => {
    try {
      const snap = await getDoc(doc(db, "attendance_sessions", sessionId));
      if (snap.exists()) {
        setSessionData(snap.data());
      } else {
        toast.error("Session not found");
        router.push("/admin");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load session");
    }
  };

  useEffect(() => {
    if (!sessionData) return;
    
    // Fetch logs
    const qLogs = query(collection(db, "attendance_logs"), where("sessionId", "==", sessionId));
    const unsubLogs = onSnapshot(qLogs, async (logsSnap) => {
      const rawLogs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // We need to fetch user data for logs that have participantId
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersData); // store all users for manual search

      const enrichedLogs = rawLogs.map(log => {
        if (log.participantId) {
          const user = usersData.find(u => u.id === log.participantId);
          return {
            ...log,
            displayName: user ? user.fullName : "Unknown User",
            displayInstansi: user ? user.institution : "-",
            displayEmail: user ? user.email : "-",
            isGuest: false
          };
        } else if (log.guestData) {
          return {
            ...log,
            displayName: log.guestData.name,
            displayInstansi: log.guestData.instansi,
            displayEmail: log.guestData.email || "-",
            isGuest: true
          };
        }
        return log;
      }).sort((a, b) => b.scannedAt?.seconds - a.scannedAt?.seconds);

      setLogs(enrichedLogs);
      setLoading(false);
    });

    return () => unsubLogs();
  }, [sessionData]);

  const handleManualCheckIn = async (userId) => {
    try {
      const alreadyCheckedIn = logs.some(l => l.participantId === userId);
      if (alreadyCheckedIn) {
        toast.error("User is already checked in!");
        return;
      }
      
      await addDoc(collection(db, "attendance_logs"), {
        sessionId: sessionId,
        participantId: userId,
        scannedAt: serverTimestamp(),
        scannedBy: userEmail
      });
      toast.success("Checked in manually");
      setSearchQuery("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to check in");
    }
  };

  const handleManualGuestCheckIn = async (e) => {
    e.preventDefault();
    if (!guestName || !guestInstansi) {
      toast.error("Nama dan Instansi tamu wajib diisi.");
      return;
    }
    try {
      await addDoc(collection(db, "attendance_logs"), {
        sessionId: sessionId,
        guestData: {
          name: guestName.toUpperCase(),
          instansi: guestInstansi.toUpperCase(),
          email: guestEmail.toLowerCase()
        },
        scannedAt: serverTimestamp(),
        scannedBy: userEmail
      });
      toast.success("Guest checked in manually!");
      setGuestName("");
      setGuestInstansi("");
      setGuestEmail("");
      setShowGuestForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to check in guest");
    }
  };

  const handleDeleteLog = async (logId) => {
    if(!(await confirmAction("Delete this attendance log?"))) return;
    try {
      await deleteDoc(doc(db, "attendance_logs", logId));
      toast.success("Log deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete log");
    }
  };

  const exportExcel = () => {
    const headers = ["Name", "Email", "Institution", "Type", "Scanned At", "Scanned By"];
    const aoaData = [headers];

    logs.forEach(l => {
      const date = l.scannedAt ? new Date(l.scannedAt.seconds * 1000).toLocaleString() : "";
      const type = l.isGuest ? "Guest" : "Registered";
      aoaData.push([
        l.displayName || "",
        l.displayEmail || "",
        l.displayInstansi || "",
        type,
        date,
        l.scannedBy || ""
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${sessionData?.name || 'session'}_export_${new Date().getTime()}.xlsx`;
    a.click();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">Loading Session...</div>;
  }

  const filteredUsers = searchQuery ? users.filter(u => u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) : [];

  const filteredLogs = logs.filter(l => {
    if (!logSearchQuery) return true;
    const q = logSearchQuery.toLowerCase();
    return (
      l.displayName?.toLowerCase().includes(q) ||
      l.displayEmail?.toLowerCase().includes(q) ||
      l.displayInstansi?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#fafafa] font-poppins">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-8 font-bold">
          <FaArrowLeft /> Back to Dashboard
        </Link>
        
        <div className="bg-[#c1ff00] p-8 rounded-2xl border-4 border-black shadow-[8px_8px_0_0_#000] mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <h1 className="font-anton text-4xl uppercase mb-2">{sessionData.name}</h1>
            <p className="font-bold text-gray-700 tracking-wider">Activity: {sessionData.activityName}</p>
            <p className="font-bold text-gray-700 tracking-wider">Method: {sessionData.method} | Status: {sessionData.status}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={exportExcel} className="bg-white text-black font-bold uppercase px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all flex items-center gap-2">
              <FaFileExcel /> Export Excel
            </button>
            {sessionData.method === "SELF_SERVICE" && sessionData.status === "OPEN" && (
              <Link href={`/admin/attendance/${sessionId}/projector`} target="_blank">
                <button className="bg-black text-[#c1ff00] font-bold uppercase px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all">
                  Open Projector
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000]">
              <h3 className="font-anton text-xl uppercase mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold text-gray-500">Total Checked In</span>
                  <span className="font-anton text-2xl">{logs.length}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold text-gray-500">Registered Users</span>
                  <span className="font-anton text-xl">{logs.filter(l => !l.isGuest).length}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="font-bold text-gray-500">Guests</span>
                  <span className="font-anton text-xl">{logs.filter(l => l.isGuest).length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000]">
              <h3 className="font-anton text-xl uppercase mb-4">Manual Check-In</h3>
              
              {/* Tab Selector */}
              <div className="flex border-b-2 border-black mb-4 gap-2 text-xs font-bold uppercase">
                <button 
                  type="button"
                  onClick={() => setShowGuestForm(false)}
                  className={`pb-2 px-2 transition-all ${!showGuestForm ? "border-b-4 border-[#c1ff00] text-black" : "text-gray-400"}`}
                >
                  Peserta
                </button>
                <button 
                  type="button"
                  onClick={() => setShowGuestForm(true)}
                  className={`pb-2 px-2 transition-all ${showGuestForm ? "border-b-4 border-[#c1ff00] text-black" : "text-gray-400"}`}
                >
                  Tamu / Guest
                </button>
              </div>

              {!showGuestForm ? (
                <>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-black rounded-xl font-bold focus:ring-4 focus:ring-[#c1ff00]"
                    />
                  </div>
                  {filteredUsers.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
                      {filteredUsers.map(u => {
                        const isPresent = logs.some(l => l.participantId === u.id);
                        return (
                          <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="font-bold text-xs truncate">{u.fullName}</p>
                              <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                            </div>
                            {isPresent ? (
                              <span className="text-green-500 text-sm font-bold shrink-0"><FaCheck /></span>
                            ) : (
                              <button onClick={() => handleManualCheckIn(u.id)} className="px-2.5 py-1 bg-black text-[#c1ff00] text-[10px] font-bold uppercase rounded-lg shrink-0">Check In</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {searchQuery && filteredUsers.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2 font-semibold">Peserta tidak ditemukan.</p>
                  )}
                </>
              ) : (
                <form onSubmit={handleManualGuestCheckIn} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Nama Tamu</label>
                    <input 
                      type="text" 
                      required 
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="NAMA LENGKAP"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#c1ff00] uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Instansi / Organisasi</label>
                    <input 
                      type="text" 
                      required 
                      value={guestInstansi}
                      onChange={e => setGuestInstansi(e.target.value)}
                      placeholder="UPN / INSTITUSI"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#c1ff00] uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Email (Opsional)</label>
                    <input 
                      type="email" 
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      placeholder="email@tamu.com"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#c1ff00] lowercase"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-black text-[#c1ff00] font-bold uppercase py-2.5 rounded-lg text-xs border border-black hover:bg-[#c1ff00] hover:text-black transition-colors"
                  >
                    Check In Tamu
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="font-anton text-xl uppercase">Attendance Logs</h3>
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
                  <input 
                    type="text" 
                    placeholder="Cari logs kehadiran..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#c1ff00]"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-y border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-bold">Participant</th>
                      <th className="px-6 py-4 font-bold">Institution</th>
                      <th className="px-6 py-4 font-bold">Type</th>
                      <th className="px-6 py-4 font-bold">Time</th>
                      <th className="px-6 py-4 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-bold">{log.displayName}</p>
                          <p className="text-xs text-gray-500">{log.displayEmail}</p>
                        </td>
                        <td className="px-6 py-4">{log.displayInstansi}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${log.isGuest ? 'bg-orange-100 text-orange-700' : 'bg-[#c1ff00] text-black'}`}>
                            {log.isGuest ? 'Guest' : 'Registered'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {log.scannedAt ? new Date(log.scannedAt.seconds * 1000).toLocaleTimeString() : '...'}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleDeleteLog(log.id)} className="text-red-500 hover:text-red-700">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-400 font-bold">
                          {logSearchQuery ? "Tidak ada logs yang cocok dengan kata kunci." : "No attendance recorded yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
