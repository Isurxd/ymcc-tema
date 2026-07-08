"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import QRCode from "react-qr-code";

export default function ProjectorPage(props) {
  const params = use(props.params);
  const router = useRouter();
  const { sessionId } = params;
  
  const [sessionData, setSessionData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [token, setToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    // Fetch session Data
    const fetchSession = async () => {
      const snap = await getDoc(doc(db, "attendance_sessions", sessionId));
      if (snap.exists()) {
        const data = snap.data();
        if (data.method !== "SELF_SERVICE" || data.status !== "OPEN") {
          toast.error("This session is not open for self-service attendance.");
          router.push("/admin");
        } else {
          setSessionData(data);
        }
      }
    };
    fetchSession();
  }, [sessionId, router]);

  // Handle Token Rotation (Every 30 seconds)
  useEffect(() => {
    const generateToken = () => {
      const now = Date.now();
      setToken(now.toString());
      setTimeLeft(30);
    };

    generateToken();
    const interval = setInterval(generateToken, 30000);
    
    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, []);

  // Listen for live check-ins
  useEffect(() => {
    const qLogs = query(collection(db, "attendance_logs"), where("sessionId", "==", sessionId));
    const unsub = onSnapshot(qLogs, (snap) => {
      const liveLogs = snap.docs.map(d => d.data()).sort((a, b) => b.scannedAt?.seconds - a.scannedAt?.seconds);
      setLogs(liveLogs);
    });
    return () => unsub();
  }, [sessionId]);

  if (!sessionData) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-[#c1ff00] font-anton text-4xl">LOADING...</div>;
  }

  // Construct URL for the QR Code
  // Assumes the public attendance page will be at /attendance/[sessionId]?token=XYZ
  const attendanceUrl = typeof window !== "undefined" ? `${window.location.origin}/attendance/${sessionId}?t=${token}` : "";

  return (
    <div className="min-h-screen bg-[#fafafa] flex overflow-hidden font-poppins">
      
      {/* LEFT SIDE: QR CODE (60%) */}
      <div className="w-[60%] bg-[#c1ff00] p-12 flex flex-col justify-center items-center border-r-8 border-black shadow-[16px_0_0_0_#000] z-10 relative">
        <h1 className="font-anton text-6xl uppercase text-black mb-4 text-center leading-tight">
          {sessionData.name}
        </h1>
        <h2 className="font-bold text-2xl tracking-widest uppercase mb-12 bg-black text-[#c1ff00] px-6 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0_0_#000]">
          {sessionData.activityName}
        </h2>
        
        <div className="bg-white p-6 rounded-3xl border-8 border-black shadow-[12px_12px_0_0_#000] relative">
          <QRCode 
            value={attendanceUrl}
            size={400}
            level="H"
          />
          {/* Progress Bar for Token Expiry */}
          <div className="absolute -bottom-16 left-0 right-0 h-4 bg-black rounded-full overflow-hidden border-2 border-black shadow-[4px_4px_0_0_#000]">
             <div 
               className="h-full bg-white transition-all duration-1000 ease-linear"
               style={{ width: `${(timeLeft / 30) * 100}%` }}
             ></div>
          </div>
          <p className="absolute -bottom-24 left-0 right-0 text-center font-bold text-sm tracking-widest uppercase">
            Code Refreshes in {timeLeft}s
          </p>
        </div>

        <p className="mt-24 font-bold text-xl uppercase tracking-widest flex items-center gap-4">
           Scan to Mark Attendance
        </p>
      </div>

      {/* RIGHT SIDE: LIVE UPDATES (40%) */}
      <div className="w-[40%] bg-white p-12 flex flex-col relative">
        <div className="flex justify-between items-center border-b-8 border-[#c1ff00] pb-6 mb-8">
           <h3 className="font-anton text-4xl uppercase">Live Attendance</h3>
           <span className="font-anton text-5xl text-[#c1ff00] bg-black px-6 py-2 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_#000]">
             {logs.length}
           </span>
        </div>

        <div className="flex-1 overflow-y-hidden relative">
          <div className="absolute inset-0 overflow-y-auto pr-4 space-y-4 pb-24 mask-image-b">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-300 font-bold text-2xl uppercase text-center">
                Waiting for participants to check in...
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0_0_#000] animate-slideIn flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-xl uppercase line-clamp-1">
                      {log.guestData ? log.guestData.name : log.participantId /* In a real app we'd join participant details here if registered, but self-service is usually guestData */}
                    </h4>
                    <span className="text-xs bg-[#c1ff00] px-2 py-1 rounded font-bold border border-black shadow-[2px_2px_0_0_#000]">
                      JUST NOW
                    </span>
                  </div>
                  {log.guestData && (
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                      {log.guestData.instansi}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <style jsx global>{`
          .animate-slideIn {
            animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .mask-image-b {
            mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
          }
        `}</style>
      </div>
    </div>
  );
}
