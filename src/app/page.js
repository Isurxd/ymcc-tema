"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";

export default function Home() {
  const [newsIndex, setNewsIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);
  const [newsArticles, setNewsArticles] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    const unsubNews = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), (snap) => {
      setNewsArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSponsor = onSnapshot(collection(db, "sponsors"), (snap) => {
      setSponsors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubFaq = onSnapshot(query(collection(db, "faqs"), limit(3)), (snap) => {
      setFaqs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubComp = onSnapshot(query(collection(db, "activities"), where("type", "==", "COMPETITIONS")), (snap) => {
      setCompetitions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubNews();
      unsubSponsor();
      unsubFaq();
      unsubComp();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setItemsToShow(window.innerWidth < 768 ? 1 : 3);
    };
    // Only run on client
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (newsArticles.length === 0) return;
    const maxIndex = Math.max(0, newsArticles.length - itemsToShow);
    const interval = setInterval(() => {
      setNewsIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [itemsToShow, newsArticles]);

  useEffect(() => {
    const revealOnScroll = () => {
      const reveals = document.querySelectorAll(".reveal");
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 50;
        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add("active");
        }
      }
    };
    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); 
    return () => window.removeEventListener("scroll", revealOnScroll);
  }, [competitions.length, newsArticles.length, faqs.length, sponsors.length]);

  const toggleFaq = (e) => {
    const btn = e.currentTarget;
    const answer = btn.nextElementSibling;
    const icon = btn.querySelector(".vertical-line");
    if (answer.style.maxHeight) {
      answer.style.maxHeight = null;
      if (icon) icon.style.transform = "rotate(0deg)";
    } else {
      answer.style.maxHeight = answer.scrollHeight + "px";
      if (icon) icon.style.transform = "rotate(90deg)";
    }
  };

  return (
    <>
      {/* HERO SECTION */}
      <header className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-12 overflow-hidden bg-black mt-[-82px]">
        <div className="absolute inset-0 z-0">
          <Image
            src="/HERO FOTO.jpg"
            alt="Mining Engineers"
            fill
            className="w-full h-full object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#fafafa]"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center lg:items-start text-center lg:text-left w-full mt-24 md:mt-16">
          <h1 className="reveal text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] font-anton tracking-wide uppercase leading-[1.1] md:leading-[1.05] mb-4 text-white drop-shadow-lg max-w-3xl">
            NAVIGATE THE FUTURE
          </h1>
          <h2
            className="reveal text-lg sm:text-xl md:text-2xl font-poppins font-bold text-white mb-6 tracking-wide drop-shadow-md uppercase"
            style={{ transitionDelay: "100ms" }}
          >
            THE GREEN COMPASS INITIATIVE
          </h2>

          <p
            className="reveal text-sm md:text-base font-medium text-gray-200 max-w-2xl leading-relaxed mb-8 md:mb-10 drop-shadow-md px-2 lg:px-0"
            style={{ transitionDelay: "200ms" }}
          >
            Guided by "The Green Compass," YMCC VII unites ASEAN, China, and Australia's brightest engineering talents. We exist to drive sustainable innovation, technical precision, and future-ready energy solutions in the global mineral resources sector.
          </p>

          <div
            className="reveal flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto mb-16"
            style={{ transitionDelay: "300ms" }}
          >
            <Link href="/register" className="w-full sm:w-auto">
              <button className="btn-brutal bg-[var(--color-grass)] text-[#111] font-poppins font-bold text-[13px] px-8 py-3.5 rounded-full uppercase tracking-wider w-full sm:w-auto">
                REGISTER ACCOUNT
              </button>
            </Link>
            <button className="bg-transparent text-white font-poppins font-bold text-[13px] px-8 py-3.5 rounded-full uppercase tracking-wider border-2 border-white hover:bg-white hover:text-[#111] transition-colors w-full sm:w-auto">
              DOWNLOAD GUIDEBOOK
            </button>
          </div>
        </div>

        {/* Floating Badge (20+ Regional delegations) */}
        <div className="absolute bottom-8 md:bottom-12 right-1/2 translate-x-1/2 lg:translate-x-0 lg:right-24 bg-white rounded-full px-4 py-2 border-2 shadow-brutal flex items-center gap-3 reveal z-20 hover:-translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] transition-all duration-500 ease-out" style={{ transitionDelay: "400ms" }}>
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center shrink-0">
              <Image src="/BENDERA/MALAYSIA.png" alt="Malaysia" width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center shrink-0">
              <Image src="/BENDERA/CHINA.png" alt="China" width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center shrink-0">
              <Image src="/BENDERA/AUSTRALIA.png" alt="Australia" width={32} height={32} className="object-cover w-full h-full" />
            </div>
          </div>
          <span className="font-poppins font-bold text-xs text-[#111] mr-2">20+ Regional delegations</span>
        </div>
      </header>

      {/* INTRO SECTION */}
      <section className="max-w-6xl mx-auto px-6 py-24 relative z-20">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          <div className="lg:w-1/3 flex flex-col reveal">
            <div className="flex items-center mb-6 animate-float">
              <Image src="/LOGO YMCC RASIO 1X1.png" alt="YMCC Logo" width={220} height={80} className="object-contain transition-all duration-500 hover:rotate-6 hover:scale-110 cursor-pointer drop-shadow-md" />
            </div>
            <h2 className="text-4xl md:text-5xl font-anton uppercase text-[#111] leading-[1.1] tracking-wide mt-2">
              THE COALITION OF EARTH SCIENCE EXCELLENCE
            </h2>
            <Link
              href="/about-us"
              className="mt-8 bg-[#111] text-white font-poppins font-bold text-[11px] px-6 py-3 rounded-full uppercase tracking-widest w-max border border-[#111] hover:bg-[var(--color-grass)] hover:text-[#111] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              DECODE THE ARCHITECTURE &rarr;
            </Link>
          </div>

          <div
            className="lg:w-2/3 bg-white border-2 rounded-3xl p-10 md:p-14 shadow-brutal-lg w-full reveal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 ease-out cursor-default"
            style={{ transitionDelay: "100ms" }}
          >
            <p className="text-gray-600 font-poppins font-medium text-sm md:text-base leading-relaxed mb-6">
              Established by the Student Association of Mining Engineering (HMTA) at Universitas Pembangunan Nasional "Veteran" Yogyakarta, the Youth Mining Camp Competition (YMCC) has evolved from a local competition into the premier biennial summit for global mining engineering.
            </p>
            <p className="text-[#111] font-poppins font-bold text-sm md:text-base leading-relaxed">
              As the industry undergoes a monumental energy transition, YMCC VII acts as a structural anchor. We do not just test academic capacity; we forge elite pioneers who will manage the extraction of critical minerals ethically, sustainably, and with absolute engineering precision.
            </p>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <h2 className="reveal text-4xl md:text-5xl font-anton tracking-wide uppercase text-[#111] mb-12">
          THE CORE VALUE ARCHITECTURE
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="reveal md:col-span-5 bg-[#f4ffcc] border-[2px] border-black rounded-3xl p-10 shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-500 ease-out flex flex-col group overflow-hidden relative">
            <div className="w-10 h-10 bg-[var(--color-grass)] rounded-full border border-black flex items-center justify-center font-anton text-xl text-[#111] mb-6 shadow-sm">
              1
            </div>
            <h3 className="text-3xl font-anton uppercase text-[#111] mb-4 tracking-wide group-hover:text-gray-700 transition-colors">
              INTELLECTUAL VALIDITY
            </h3>
            <p className="text-[#111] font-poppins font-medium text-[13px] leading-relaxed mb-8 flex-grow">
              Upholding strict, peer-reviewed academic standards, accurate engineering calculations, and rigorous technical validation in every earth science category.
            </p>
            <Link href="/register">
              <button className="btn-brutal bg-[var(--color-grass)] text-[#111] font-poppins font-bold text-[11px] px-6 py-3 rounded-full uppercase tracking-widest w-max">
                REGISTER ACCOUNT
              </button>
            </Link>
          </div>

          <div className="md:col-span-7 flex flex-col gap-8">
            <div
              className="reveal bg-white border-[2px] border-black rounded-3xl p-8 md:p-10 shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-500 ease-out flex flex-col md:flex-row items-start gap-8 h-full group overflow-hidden relative"
              style={{ transitionDelay: "100ms" }}
            >
              <div className="w-10 h-10 shrink-0 bg-[var(--color-grass)] rounded-full border border-black flex items-center justify-center font-anton text-xl text-[#111] shadow-sm">
                2
              </div>
              <div>
                <h3 className="text-3xl font-anton uppercase text-[#111] mb-3 tracking-wide group-hover:text-gray-700 transition-colors">
                  ESG INTEGRATION
                </h3>
                <p className="text-gray-600 font-poppins font-medium text-[13px] leading-relaxed">
                  Positioning Environmental, Social, and Governance (ESG) variables as primary planning metrics, proving that resource extraction must coexist with ecological conservation.
                </p>
              </div>
            </div>

            <div
              className="reveal bg-white border-[2px] border-black rounded-3xl p-8 md:p-10 shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-500 ease-out flex flex-col md:flex-row items-start gap-8 h-full group overflow-hidden relative"
              style={{ transitionDelay: "200ms" }}
            >
              <div className="w-10 h-10 shrink-0 bg-[var(--color-grass)] rounded-full border border-black flex items-center justify-center font-anton text-xl text-[#111] shadow-sm">
                3
              </div>
              <div>
                <h3 className="text-3xl font-anton uppercase text-[#111] mb-3 tracking-wide group-hover:text-gray-700 transition-colors">
                  CROSS-BORDER NETWORKS
                </h3>
                <p className="text-gray-600 font-poppins font-medium text-[13px] leading-relaxed">
                  Constructing an elite professional bridge that connects ASEAN, Australian, and Chinese delegates directly with corporate giants and academic authorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPETITIONS ARCHITECTURE */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <div className="text-center mb-16 reveal">
          <h2 className="text-4xl md:text-5xl font-anton tracking-wide uppercase text-[#111] mb-4">
            THE COMPETITIONS ARCHITECTURE
          </h2>
          <p className="font-poppins font-bold text-sm text-[#111] underline decoration-2 underline-offset-4 decoration-[var(--color-grass)]">
            Select your technical discipline, inspect the rules, and register your team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {competitions.length > 0 ? competitions.map((comp, index) => (
            <div key={comp.id} className="reveal bg-white border-[2px] border-black rounded-[2rem] p-8 shadow-brutal-lg flex flex-col items-center text-center hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 ease-out group" style={{ transitionDelay: `${index % 2 === 0 ? 0 : 100}ms` }}>
              <div className="w-24 h-24 mb-6 bg-gray-50 rounded-full border-2 border-black flex items-center justify-center p-4 group-hover:scale-110 transition-transform duration-500 shadow-sm shrink-0">
                {comp.icon ? <Image src={comp.icon} alt={comp.title} width={80} height={80} className="object-contain" /> : <div className="text-3xl font-anton text-gray-300">?</div>}
              </div>
              <span className="bg-[#f4ffcc] border border-black px-4 py-1.5 rounded-full text-[10px] font-bold font-poppins text-[#111] uppercase mb-4 w-full truncate">
                {comp.pills && comp.pills.length > 0 ? comp.pills[0] : "COMPETITION"}
              </span>
              <h3 className="text-2xl font-anton uppercase text-[#111] leading-tight mb-8 flex-grow">{comp.title}</h3>
              
              <Link href="/events" className="w-full mt-auto">
                <button className="w-full border-2 border-black bg-black text-[#c1ff00] rounded-full py-3.5 font-poppins font-bold text-xs uppercase tracking-widest hover:bg-[#c1ff00] hover:text-black transition-colors duration-300 flex items-center justify-center gap-2">
                  VIEW DETAILS <span className="text-base leading-none">&rarr;</span>
                </button>
              </Link>
            </div>
          )) : (
            <div className="col-span-1 md:col-span-2 text-center py-12">
              <p className="font-poppins font-medium text-gray-400 text-lg">No competitions published yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* LATEST NEWS */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <div className="flex justify-between items-end mb-12 reveal">
          <h2 className="text-4xl md:text-5xl font-anton tracking-wide uppercase text-[#111]">
            Browse Our Latest News
          </h2>
          <Link href="/news">
            <button className="hidden md:block bg-[#111] text-white border border-[#111] font-poppins font-bold text-[10px] px-6 py-2.5 rounded-full uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-[var(--color-grass)] hover:text-[#111]">
              LEARN MORE
            </button>
          </Link>
        </div>

        <div className="relative overflow-hidden w-full py-4 -mx-4 px-4">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${(100 / itemsToShow) * newsIndex}%)` }}
          >
            {newsArticles.map((newsItem) => (
              <div 
                key={newsItem.id} 
                className={`shrink-0 px-4 ${itemsToShow === 1 ? 'w-full' : 'w-1/3'}`}
              >
                <Link href={`/news/${newsItem.slug || newsItem.id}`}>
                  <div className="bg-[#f4f4f5] rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-brutal transition-all duration-500 h-full flex flex-col cursor-pointer active:scale-[0.98]">
                    <div className="relative h-56 w-full border-b-[3px] border-[#111]">
                       <Image src={newsItem.imageUrl || "/EVENTS_COMP/IMG_8741.jpg"} alt={newsItem.title} fill className="object-cover" />
                       <div className="absolute top-4 left-4 bg-[var(--color-grass)] px-3 py-1 rounded border-2 border-black font-anton text-[#111] text-sm shadow-brutal-sm">{newsItem.category}</div>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col flex-grow">
                      <span className="text-gray-500 font-poppins font-bold text-[10px] tracking-widest uppercase mb-2">
                        {newsItem.date}
                      </span>
                      <h3 className="font-poppins font-bold text-[#111] text-lg md:text-xl mb-3 line-clamp-2 leading-tight">{newsItem.title}</h3>
                      <p className="text-sm font-poppins text-gray-600 mb-6 line-clamp-3 flex-grow">{newsItem.desc || newsItem.content}</p>
                      <span className="mt-auto bg-black text-[#c1ff00] border-2 border-black font-poppins font-bold text-[10px] px-4 py-2 rounded-full uppercase w-max max-w-full flex items-center gap-2 hover:bg-[#c1ff00] hover:text-black transition-colors">
                        READ DISPATCH <span className="text-sm">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
            {newsArticles.length === 0 && (
              <div className="w-full text-center py-10">
                 <p className="font-poppins font-medium text-gray-400 text-lg">No dispatches available at this moment.</p>
              </div>
            )}
          </div>
        </div>
        <Link href="/news" className="block md:hidden mt-8 w-full">
          <button className="w-full bg-[#111] text-white border border-[#111] font-poppins font-bold text-[10px] px-6 py-3 rounded-full uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-[var(--color-grass)] hover:text-[#111]">
            LEARN MORE
          </button>
        </Link>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-6 pb-24 reveal">
        <h2 className="text-4xl md:text-5xl font-anton tracking-wide text-[#111] text-center mb-12">
          FREQUENTLY ASKED QUESTIONS
        </h2>

        <div className="border-t border-gray-200" id="faq-container">
          {faqs.map((faq, index) => (
            <div key={faq.id || index} className="faq-item border-b border-gray-200 group">
              <button className="w-full flex justify-between items-center font-poppins font-bold text-lg cursor-pointer py-6 text-[#111] hover:text-gray-500 transition-colors text-left focus:outline-none" onClick={toggleFaq}>
                <span>{faq.q}</span>
                <span className="faq-icon text-gray-400 font-light text-2xl transition-transform duration-300 w-4 h-4 flex items-center justify-center shrink-0 relative">
                  <span className="absolute w-full h-[2px] bg-current"></span>
                  <span className="absolute h-full w-[2px] bg-current transition-transform duration-300 vertical-line"></span>
                </span>
              </button>
              <div className="faq-answer max-h-0 overflow-hidden transition-all duration-400 ease-in-out">
                <div className="pb-6 text-gray-600 font-poppins text-base leading-relaxed pr-8">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
          {faqs.length === 0 && (
            <div className="text-center py-12">
              <p className="font-poppins font-medium text-gray-400 text-lg">No data available at this moment.</p>
            </div>
          )}
        </div>

        <p className="text-left font-poppins font-bold text-[#111] mt-8 text-base">
          Have more questions? Check out our full{" "}
          <Link href="/faq" className="underline decoration-[#111] decoration-2 underline-offset-4 hover:text-gray-500 transition-colors">
            FAQ
          </Link>
          .
        </p>
      </section>

      {/* TRUSTED BY SPONSORS (Marquee) */}
      <section className="pb-24 overflow-hidden border-t border-gray-200 pt-12 reveal">
        <h3 className="text-center font-anton text-2xl uppercase tracking-widest text-[#111] mb-12">Trusted By Top Industry Networks</h3>
        <div className="relative w-full flex overflow-x-hidden group">
          {[0, 1].map((i) => (
            <div key={i} className="animate-marquee shrink-0 whitespace-nowrap flex items-center group-hover:[animation-play-state:paused]" aria-hidden={i === 1 ? "true" : "false"}>
              {Array.from({ length: Math.max(1, Math.ceil(20 / (sponsors.length || 1))) }).flatMap(() => sponsors).map((sponsor, idx) => (
                <a key={`${i}-${idx}`} href={sponsor.websiteUrl || "#"} target={sponsor.websiteUrl ? "_blank" : "_self"} rel={sponsor.websiteUrl ? "noopener noreferrer" : ""} className="flex justify-center items-center shrink-0 pr-16 transition-all duration-300 hover:scale-105 hover:-translate-y-1 drop-shadow-sm hover:drop-shadow-md">
                  {sponsor.imageUrl ? (
                    <Image src={sponsor.imageUrl} alt={sponsor.name} width={160} height={60} className="object-contain h-12 max-w-full" />
                  ) : (
                    <span className="font-poppins font-bold text-gray-800 text-xl">{sponsor.name}</span>
                  )}
                </a>
              ))}
            </div>
          ))}
        </div>
        {sponsors.length === 0 && (
          <div className="text-center mt-12 mb-8">
            <p className="font-poppins font-medium text-gray-400 text-lg">No data available at this moment.</p>
          </div>
        )}
      </section>
    </>
  );
}

