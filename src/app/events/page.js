"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";

export default function EventsCompetitions() {
  const [activeTab, setActiveTab] = useState("ALL ACTIVITIES");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, "activities"), orderBy("title", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
          setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });
        return () => unsub();
      } catch (error) {
        console.error("Error fetching activities:", error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredData = data.filter((item) => {
    const matchesTab = activeTab === "ALL ACTIVITIES" || item.type === activeTab;
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-dots pt-32 pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dots pt-32 pb-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Search & Filter Bar */}
        <div className="mb-16 max-w-5xl mx-auto">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-[#111] rounded-full py-4 pl-12 pr-6 font-poppins text-[#111] focus:outline-none focus:ring-4 focus:ring-grass transition-all"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-4 border-b-2 border-gray-300 pb-8">
            <button
              onClick={() => setActiveTab("ALL ACTIVITIES")}
              className={`px-8 py-2.5 rounded-full border-2 border-[#111] font-poppins font-bold text-sm uppercase transition-all duration-300 ${
                activeTab === "ALL ACTIVITIES" ? "bg-[#111] text-white shadow-brutal-hover" : "bg-white text-[#111] hover:bg-gray-100"
              }`}
            >
              ALL ACTIVITIES
            </button>
            <button
              onClick={() => setActiveTab("EVENTS")}
              className={`px-8 py-2.5 rounded-full border-2 border-[#111] font-poppins font-bold text-sm uppercase transition-all duration-300 ${
                activeTab === "EVENTS" ? "bg-[#111] text-white shadow-brutal-hover" : "bg-white text-[#111] hover:bg-gray-100"
              }`}
            >
              EVENTS
            </button>
            <button
              onClick={() => setActiveTab("COMPETITIONS")}
              className={`px-8 py-2.5 rounded-full border-2 border-[#111] font-poppins font-bold text-sm uppercase transition-all duration-300 ${
                activeTab === "COMPETITIONS" ? "bg-[#111] text-white shadow-brutal-hover" : "bg-white text-[#111] hover:bg-gray-100"
              }`}
            >
              COMPETITIONS
            </button>
          </div>
        </div>

        {/* 2-Column Grid Cards List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 animate-fade-in-up"
              >
                <div>
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-16 h-16 shrink-0 bg-white border-2 border-[#111] rounded-2xl flex items-center justify-center p-2 shadow-brutal-sm">
                      <Image src={item.icon} alt={item.title} width={48} height={48} className="object-contain w-full h-full" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-3xl font-anton uppercase text-[#111] leading-[1] tracking-wide mb-2 line-clamp-2">
                        {item.title}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {item.pills.slice(0, 1).map((pill, pIdx) => (
                          <span key={pIdx} className="bg-grass border-2 border-[#111] text-[#111] font-poppins font-bold text-[10px] md:text-xs px-3 py-1 rounded-full">
                            {pill}
                          </span>
                        ))}
                        {item.pills.length > 1 && (
                          <span className="bg-gray-200 border-2 border-[#111] text-[#111] font-poppins font-bold text-[10px] md:text-xs px-3 py-1 rounded-full">
                            +{item.pills.length - 1} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="font-poppins text-[#111] text-sm leading-relaxed mb-6 line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t-2 border-gray-100 pt-6 mt-auto">
                  <div className="flex items-center gap-2 text-[#ea580c] font-poppins font-semibold text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Timeline: TBA</span>
                  </div>
                  
                  <button 
                    onClick={async () => {
                      setSelectedEvent(item);
                      try {
                        const { addDoc, collection } = await import("firebase/firestore");
                        await addDoc(collection(db, "activityClicks"), {
                          activityId: item.id,
                          activityTitle: item.title,
                          timestamp: new Date().toISOString()
                        });
                      } catch (err) { console.error("Tracking error", err); }
                    }}
                    className="bg-[#0f172a] text-white font-poppins font-bold text-xs uppercase px-5 py-2.5 rounded-full hover:bg-black transition-colors"
                  >
                    READ MORE →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 lg:col-span-2 text-center py-20">
              <p className="font-poppins text-lg text-gray-500 font-bold">No activities found matching your search.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal Popup (Read More) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white border-2 border-[#111] rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_rgba(0,0,0,1)] relative flex flex-col mt-12 md:mt-0">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white border-2 border-[#111] rounded-full flex items-center justify-center text-[#111] hover:bg-gray-200 transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {/* Modal Content */}
            <div className="p-6 md:p-12">
              <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-6 md:mb-8 pr-6 md:pr-8">
                <div className="w-20 h-20 shrink-0 bg-white border-2 border-[#111] rounded-2xl flex items-center justify-center p-3 shadow-brutal-sm">
                  <Image src={selectedEvent.icon} alt={selectedEvent.title} width={60} height={60} className="object-contain w-full h-full" />
                </div>
                <div>
                  <span className="text-gray-500 font-poppins font-bold text-xs tracking-widest uppercase mb-1 block">
                    {selectedEvent.type}
                  </span>
                  <h2 className="text-2xl md:text-5xl font-anton uppercase text-[#111] leading-[1] md:leading-[0.95] tracking-wide mb-4">
                    {selectedEvent.title}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {selectedEvent.pills.map((pill, pIdx) => (
                      <span key={pIdx} className="bg-grass border-2 border-[#111] text-[#111] font-poppins font-bold text-xs md:text-sm px-4 py-1.5 rounded-full inline-block w-max">
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full h-[2px] bg-gray-200 mb-8"></div>

              <div className="mb-10">
                <h3 className="font-poppins font-bold text-lg text-[#111] mb-3">About The Activity</h3>
                <p className="font-poppins text-[#111] text-base leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 bg-gray-50 border-2 border-[#111] rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-3 text-[#ea580c] font-poppins font-bold text-sm">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <span>{selectedEvent.timeline}</span>
                </div>
                
                {selectedEvent.guidebookUrl ? (
                  <a href={selectedEvent.guidebookUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-[#0f172a] text-white font-poppins font-bold text-sm uppercase px-8 py-3.5 rounded-full hover:bg-black shadow-brutal-hover transition-all text-center">
                    {selectedEvent.buttonText}
                  </a>
                ) : (
                  <button className="w-full sm:w-auto bg-[#0f172a] text-white font-poppins font-bold text-sm uppercase px-8 py-3.5 rounded-full hover:bg-black shadow-brutal-hover transition-all opacity-50 cursor-not-allowed">
                    {selectedEvent.buttonText} (TBA)
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

