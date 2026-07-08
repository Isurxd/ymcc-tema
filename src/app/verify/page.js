"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { FaCheckCircle, FaTimesCircle, FaUser, FaTrophy, FaShoppingCart, FaSpinner } from "react-icons/fa";

function VerifyContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No Participant ID provided.");
      setLoading(false);
      return;
    }

    const fetchParticipantData = async () => {
      try {
        // 1. Fetch User Profile
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          setError("Participant not found. The ID might be invalid or the participant was removed.");
          setLoading(false);
          return;
        }
        
        const uData = userSnap.data();
        setUserData(uData);
        const userEmail = uData.email;

        // 2. Fetch Competitions (competition_documents)
        const compQ = query(collection(db, "competition_documents"), where("uid", "==", id));
        const compSnap = await getDocs(compQ);
        const comps = compSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Also fetch from Orders (paid competition tickets)
        if (userEmail) {
          const ordCompQ = query(collection(db, "Orders"), where("userDetails.email", "==", userEmail));
          const ordCompSnap = await getDocs(ordCompQ);
          ordCompSnap.docs.forEach(d => {
            const data = d.data();
            if (Array.isArray(data.items)) {
              data.items.forEach(item => {
                if (!comps.some(c => c.id === item.productId || c.fileName === item.name)) {
                  comps.push({
                    id: item.productId || d.id,
                    fileName: item.name,
                    status: data.status
                  });
                }
              });
            }
          });
        }
        setCompetitions(comps);

        // 3. Fetch Merch Orders
        let ords = [];
        if (userEmail) {
          const ordQ = query(collection(db, "merch_orders"), where("userDetails.email", "==", userEmail));
          const ordSnap = await getDocs(ordQ);
          ords = ordSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        setOrders(ords);

      } catch (err) {
        console.error(err);
        setError("Error fetching participant data. Please check your connection.");
      }
      setLoading(false);
    };

    fetchParticipantData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-poppins">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <FaSpinner className="animate-spin text-4xl text-[#c1ff00]" />
          <p className="font-bold uppercase tracking-widest">Verifying Participant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-poppins px-6">
        <div className="bg-white p-8 border-2 border-black rounded-2xl shadow-[8px_8px_0_0_#000] max-w-md w-full text-center">
          <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="font-anton text-3xl uppercase mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="inline-block bg-black text-[#c1ff00] font-bold uppercase px-6 py-3 border-2 border-black rounded-xl hover:bg-[#c1ff00] hover:text-black transition-colors">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-poppins py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Header / Brand */}
        <div className="text-center mb-8">
          <h1 className="font-anton text-4xl uppercase tracking-wider">YMCC VII</h1>
          <p className="text-sm font-bold tracking-widest text-gray-400">OFFICIAL VERIFICATION SYSTEM</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0_0_#000] overflow-hidden mb-8">
          <div className="bg-[#c1ff00] p-6 border-b-2 border-black flex items-center gap-3">
             <FaCheckCircle className="text-black text-3xl" />
             <h2 className="font-anton text-2xl uppercase">Verified Participant</h2>
          </div>
          
          <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
             {userData.profilePhotoUrl ? (
                 <img src={userData.profilePhotoUrl} alt="Profile" className="w-32 h-32 md:w-40 md:h-40 object-cover border-4 border-black rounded-2xl shadow-sm" />
             ) : (
                 <div className="w-32 h-32 md:w-40 md:h-40 border-4 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                    <FaUser className="text-4xl mb-2" />
                    <span className="text-[10px] font-bold uppercase">No Photo</span>
                 </div>
             )}
             
             <div className="flex-1 text-center sm:text-left">
                <h3 className="font-anton text-3xl uppercase mb-1">{userData.fullName || "Unnamed Participant"}</h3>
                <p className="font-bold text-gray-600 uppercase tracking-wide mb-4">{userData.institution || "Unknown Institution"}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                   <div>
                      <span className="block text-gray-400 text-xs font-bold uppercase">Country</span>
                      <span className="font-medium">{userData.country || "-"}</span>
                   </div>
                   <div>
                      <span className="block text-gray-400 text-xs font-bold uppercase">Student ID</span>
                      <span className="font-medium">{userData.studentId || "-"}</span>
                   </div>
                   <div>
                      <span className="block text-gray-400 text-xs font-bold uppercase">Registered Date</span>
                      <span className="font-medium">{userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "-"}</span>
                   </div>
                   <div>
                      <span className="block text-gray-400 text-xs font-bold uppercase">Profile Status</span>
                      <span className="font-bold text-green-600">COMPLETED</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Activity Track Record */}
        <h3 className="font-anton text-2xl uppercase mb-4 pl-2">Track Record</h3>
        
        {/* Competitions */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0_0_#000] p-6 mb-6">
           <div className="flex items-center gap-3 mb-4">
              <FaTrophy className="text-xl" />
              <h4 className="font-bold uppercase tracking-wide">Competitions / Events</h4>
           </div>
           {competitions.length > 0 ? (
               <div className="space-y-3">
                  {competitions.map((comp, i) => (
                     <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl gap-2">
                        <span className="font-semibold text-sm">{comp.fileName || "Document Submitted"}</span>
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${comp.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : comp.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                           {comp.status}
                        </span>
                     </div>
                  ))}
               </div>
           ) : (
               <p className="text-sm text-gray-500 italic">No events joined yet.</p>
           )}
        </div>

        {/* Merch */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0_0_#000] p-6 mb-8">
           <div className="flex items-center gap-3 mb-4">
              <FaShoppingCart className="text-xl" />
              <h4 className="font-bold uppercase tracking-wide">Merchandise Orders</h4>
           </div>
           {orders.length > 0 ? (
               <div className="space-y-3">
                  {orders.map((ord, i) => (
                     <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl gap-2">
                        <div className="text-sm">
                           <span className="font-bold block">{ord.id.substring(0,8).toUpperCase()}</span>
                           <span className="text-gray-500">{ord.items?.length || 0} items (Rp {ord.totalAmount?.toLocaleString('id-ID')})</span>
                        </div>
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${ord.status === 'PAID' ? 'bg-green-100 text-green-700' : ord.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                           {ord.status}
                        </span>
                     </div>
                  ))}
               </div>
           ) : (
               <p className="text-sm text-gray-500 italic">No merchandise orders.</p>
           )}
        </div>

        {/* Footer */}
        <div className="text-center">
           <Link href="/" className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors">
              Go to ymccvii.com
           </Link>
        </div>

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center"><FaSpinner className="animate-spin text-4xl text-[#c1ff00]" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
