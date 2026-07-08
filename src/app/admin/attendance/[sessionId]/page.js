"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { FaArrowLeft, FaFileCsv, FaTrash, FaCheck, FaSearch } from "react-icons/fa";
import Link from "next/link";
import { useConfirm } from "@/context/ConfirmContext";

export default function SessionDetailPage(props) {
  const params = use(props.params);
  const router = useRouter();
  const confirmAction = useConfirm();
  const [sessionData, setSessionData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState("");

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

  const exportCSV = () => {
    let csv = "Name,Email,Institution,Type,Scanned At,Scanned By\n";
    logs.forEach(l => {
      const date = l.scannedAt ? new Date(l.scannedAt.seconds * 1000).toLocaleString() : "";
      const type = l.isGuest ? "Guest" : "Registered";
      csv += `"${l.displayName}","${l.displayEmail}","${l.displayInstansi}","${type}","${date}","${l.scannedBy}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `attendance_${sessionData?.name || 'session'}.csv`);
    a.click();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">Loading Session...</div>;
  }

  const filteredUsers = searchQuery ? users.filter(u => u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) : [];

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
            <button onClick={exportCSV} className="bg-white text-black font-bold uppercase px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all flex items-center gap-2">
              <FaFileCsv /> Export CSV
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

            {(sessionData.method === "MANUAL" || sessionData.method === "QR_ADMIN") && (
              <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000]">
                <h3 className="font-anton text-xl uppercase mb-4">Manual Check-In</h3>
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
                  <div className="mt-4 space-y-2">
                    {filteredUsers.map(u => {
                      const isPresent = logs.some(l => l.participantId === u.id);
                      return (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <div>
                            <p className="font-bold text-sm">{u.fullName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                          {isPresent ? (
                            <span className="text-green-500 text-sm font-bold"><FaCheck /></span>
                          ) : (
                            <button onClick={() => handleManualCheckIn(u.id)} className="px-3 py-1 bg-black text-[#c1ff00] text-xs font-bold uppercase rounded-lg">Check In</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000]">
              <h3 className="font-anton text-xl uppercase mb-6">Attendance Logs</h3>
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
                    {logs.map((log) => (
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
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-400 font-bold">No attendance recorded yet.</td>
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
