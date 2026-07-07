"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AboutUs() {
  const departments = [
    {
        name: "BOARD OF DIRECTORS",
        head: "Executive Board",
        isBoard: true,
        subs: [
            { title: "Executive Director", lead: "Aghniyo Hammaddankhairi Putra Hermawan" },
            { title: "Vice Executive Director", lead: "Faiz Marvel Attaurrahman Ridwan" },
            { title: "Secretary I", lead: "Kartika Rahmadani" }, 
            { title: "Secretary II", lead: "Nabila Khairun Nisa" },
            { title: "Finance Director I", lead: "Rizky Mayfandra" },
            { title: "Finance Director II", lead: "Naila Farihiya" }
        ]
    },
    {
        name: "COMPETITION",
        head: "Kevin Ananda Daud",
        isBoard: false,
        subs: [
            { title: "Intellectual Challenges", lead: "Salmahera Putri Saktiawan" },
            { title: "Mining Games", lead: "Muhammad Abdul Khaaliq Akbar" },
            { title: "Mining Strategy & Innovation Competition", lead: "Viola Naftali Pakpahan" },
            { title: "Paper Competition", lead: "Rizky Kurnia Nur Ramadhan" }
        ]
    },
    {
        name: "EVENT",
        head: "Stieven Valentino Simanungkalit",
        isBoard: false,
        subs: [
            { title: "Minexplo", lead: "Pilar Febianne Harsono" },
            { title: "Mining Camp", lead: "Muhammad Farrel Avandanur" },
            { title: "Opening & Closing", lead: "Chalizah Azzahra" },
            { title: "Seminar Nasional", lead: "Bram Moresby Hasudungan Gultom" },
            { title: "Society Project", lead: "Vincentius Valentino Aristo" },
            { title: "Studium General", lead: "Yehezkiel Krisfando Napitupulu" }
        ]
    },
    {
        name: "FUNDRAISING",
        head: "Bani Abdullah Al Fikri",
        isBoard: false,
        subs: [
            { title: "Entrepreneurship", lead: "Irshad Mawla Usmana" },
            { title: "Sponsorship", lead: "Muhammad Almaz Ramadanov" }
        ]
    },
    {
        name: "MEDIA",
        head: "Muhammad Fairuz Adhimul Arifin",
        isBoard: false,
        subs: [
            { title: "Branding & Public Relation", lead: "Keysya Maharani Sandy" },
            { title: "Creative Production", lead: "Brevian Revaliando Wonata" },
            { title: "Secretariat", lead: "Nadzua Aurelia Jarfi" }
        ]
    },
    {
        name: "OPERATIONAL",
        head: "Marcello Karel Abisena",
        isBoard: false,
        subs: [
            { title: "Consumption", lead: "Muhammad Razi Novrin" },
            { title: "General Affair", lead: "Ahmad Rifai Hanan" },
            { title: "Liaison Officer", lead: "Dafa Hafidz Abdillah" },
            { title: "Logistic", lead: "Althofany Bima Ghofarolly" },
            { title: "Safety, Security, Health, and Care", lead: "Bisma Raditya Asari" }
        ]
    }
  ];

  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const revealOnScroll = () => {
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
  }, []);

  return (
    <>
      {/* 1. DECODING THE COALITION */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-24 relative z-20 mt-16">
        <div className="flex flex-col lg:flex-row items-stretch bg-white border-2 border-[#111] rounded-[3rem] shadow-brutal-lg overflow-hidden reveal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 cursor-default">
          <div className="lg:w-5/12 relative h-80 lg:h-auto overflow-hidden shrink-0 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-[#111]">
            <Image 
              src="/ABOUT_US/HERO_NEW.jpg" 
              alt="YMCC Field Operations" 
              fill
              className="object-cover w-full h-full transition-opacity duration-1000 opacity-0"
              onLoad={(e) => e.target.classList.remove("opacity-0")}
              priority
            />
          </div>
          
          <div className="lg:w-7/12 p-6 md:p-16 flex flex-col justify-center bg-white" style={{ transitionDelay: "100ms" }}>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-anton uppercase text-[#111] leading-[1] md:leading-[0.9] tracking-wide mb-6 md:mb-8">
              DECODING THE<br/>COALITION
            </h1>
            <div className="text-gray-700 font-poppins text-sm md:text-base leading-relaxed space-y-6">
              <p>
                The Youth Mining Camp Competition (YMCC) is the flagship biennial event organized by the Student Association of Mining Engineering (Himpunan Mahasiswa Teknik Pertambangan - HMTA) of Universitas Pembangunan Nasional &quot;Veteran&quot; Yogyakarta.
              </p>
              <p>
                Founded as a platform to showcase national engineering talent, YMCC has evolved into a prestigious multinational summit, serving as a critical nexus where future mining leaders, researchers, and energy industry representatives collaborate to address real-world industrial and environmental challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE SEVEN-STAGE EVOLUTION */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <h2 className="text-3xl md:text-5xl font-anton uppercase text-[#111] leading-[1] tracking-wide mb-10 md:mb-16 reveal">
          THE SEVEN-STAGE EVOLUTION
        </h2>

        <div className="relative pl-8 md:pl-0">
          {/* Vertical Line */}
          <div className="absolute left-10 md:left-14 top-4 bottom-4 w-1.5 bg-[#111] reveal"></div>

          <div className="flex flex-col gap-10">
            {/* Timeline Item 1 */}
            <div className="flex items-center gap-6 md:gap-12 reveal">
              <div className="w-8 h-8 rounded-full border-2 border-[#111] bg-grass z-10 shrink-0 shadow-sm relative left-[-24px] md:left-10"></div>
              <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-10 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 w-full ml-0 md:ml-12 cursor-default">
                <div className="inline-block bg-[#a855f7] text-white font-anton text-sm md:text-base uppercase px-6 py-2.5 rounded-md border-2 border-[#111] mb-4 shadow-brutal hover:shadow-none transition-all duration-300">
                  THE FOUNDATION ERA
                </div>
                <h3 className="text-2xl md:text-3xl font-anton text-[#111] uppercase tracking-wide mb-3">YMCC I - IV</h3>
                <p className="font-poppins text-sm text-[#111] leading-relaxed">
                  Initiated as a localized tournament to bridge academic theories with standard field operations, focusing heavily on basic mining games and national safety standards.
                </p>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="flex items-center gap-6 md:gap-12 reveal">
              <div className="w-8 h-8 rounded-full border-2 border-[#111] bg-grass z-10 shrink-0 shadow-sm relative left-[-24px] md:left-10"></div>
              <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-10 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 w-full ml-0 md:ml-12 cursor-default">
                <div className="inline-block bg-[#f97316] text-white font-anton text-sm md:text-base uppercase px-6 py-2.5 rounded-md border-2 border-[#111] mb-4 shadow-brutal hover:shadow-none transition-all duration-300">
                  THE REGIONAL EXPANSION
                </div>
                <h3 className="text-2xl md:text-3xl font-anton text-[#111] uppercase tracking-wide mb-3">YMCC V - VI</h3>
                <p className="font-poppins text-sm text-[#111] leading-relaxed">
                  Transformed into a regional-scale summit, integrating complex infrastructure mapping (MSIC) and introducing the initial digital registration interfaces.
                </p>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="flex items-center gap-6 md:gap-12 reveal">
              <div className="w-8 h-8 rounded-full border-2 border-[#111] bg-grass z-10 shrink-0 shadow-sm relative left-[-24px] md:left-10"></div>
              <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-10 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 w-full ml-0 md:ml-12 cursor-default">
                <div className="inline-block bg-[#22c55e] text-white font-anton text-sm md:text-base uppercase px-6 py-2.5 rounded-md border-2 border-[#111] mb-4 shadow-brutal hover:shadow-none transition-all duration-300">
                  THE SOVEREIGN TRANSITION
                </div>
                <h3 className="text-2xl md:text-3xl font-anton text-[#111] uppercase tracking-wide mb-3">YMCC VII</h3>
                <p className="font-poppins text-sm text-[#111] leading-relaxed">
                  The current era. Guided by &quot;The Green Compass,&quot; YMCC VII introduces state-of-the-art proctored Exam Engines, bilingual standardizations, and a heavy strategic focus on sustainable mineral extraction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE STUDENT ASSOCIATION */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row gap-6 items-stretch reveal">
          <div className="md:w-1/4 flex flex-row md:flex-col gap-6 shrink-0">
            <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 shadow-brutal flex-1 flex items-center justify-center animate-float" style={{ animationDelay: "0s" }}>
              <Image src="/LOGO UPN.png" alt="UPN Logo" width={120} height={120} className="object-contain w-24 h-24 drop-shadow-md" />
            </div>
            <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 shadow-brutal flex-1 flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
              <Image src="/LOGO HMTA.png" alt="HMTA Logo" width={120} height={120} className="object-contain w-24 h-24 drop-shadow-md" />
            </div>
          </div>
          
          <div className="md:w-3/4 bg-[#eefcf0] border-2 border-[#111] rounded-[2.5rem] p-6 md:p-14 shadow-brutal-lg flex flex-col justify-center">
            <h2 className="text-3xl md:text-6xl font-anton uppercase text-[#111] leading-[1] md:leading-[0.95] tracking-wide mb-6 md:mb-8">
              THE STUDENT ASSOCIATION OF MINING ENGINEERING
            </h2>
            <p className="font-poppins text-[#111] text-sm md:text-base leading-relaxed">
              HMTA UPN &quot;Veteran&quot; Yogyakarta is one of Indonesia's most prominent, active, and long-established student engineering associations. Guided by the principles of discipline, technical excellence, and strong camaraderie, HMTA serves as an incubator for future mining engineers. Every aspect of YMCC VII is planned, managed, and executed by our dedicated student committee members—collectively known as the Strategic Force—under close academic and professional supervision.
            </p>
          </div>
        </div>
      </section>

      {/* 3.5. STRUCTURAL DIRECTORY */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10 md:mb-16 reveal">
          <h2 className="text-3xl md:text-5xl font-anton uppercase text-[#111] leading-[1] tracking-wide">
            STRATEGIC FORCE
          </h2>
          <p className="font-poppins font-bold text-lg md:text-xl text-[#111] mt-3">
            YMCC VII Organizational Structure
          </p>
        </div>

        <div className="flex flex-col gap-10 reveal">
          {/* Board of Directors Card */}
          {departments.filter(d => d.isBoard).map((board, idx) => (
            <div key={idx} className="bg-[#111] border-2 border-[#111] rounded-[2.5rem] p-6 md:p-12 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 w-full relative overflow-hidden cursor-default">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10">
                <h1 className="text-7xl md:text-9xl font-anton text-white">BOD</h1>
              </div>
              <div className="relative z-10">
                <div className="inline-block bg-grass text-[#111] font-anton text-sm uppercase px-4 py-1.5 rounded-sm border-2 border-[#111] mb-6">
                  {board.name}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {board.subs.map((sub, sidx) => (
                    <div key={sidx} className="flex flex-col border-l-2 border-grass pl-4">
                      <span className="font-poppins text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{sub.title}</span>
                      <span className="font-anton text-white text-xl tracking-wide">{sub.lead}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Other Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments.filter(d => !d.isBoard).map((dept, idx) => (
              <div key={idx} className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-8 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 cursor-default flex flex-col h-full">
                <div className="mb-6 pb-6 border-b-2 border-dashed border-[#111]">
                  <h3 className="text-2xl md:text-3xl font-anton text-[#111] uppercase tracking-wide mb-1">{dept.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#a855f7] text-white font-poppins text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">HEAD</span>
                    <span className="font-poppins text-sm font-bold text-[#111]">{dept.head}</span>
                  </div>
                </div>
                <div className="flex-grow flex flex-col gap-5">
                  {dept.subs.map((sub, sidx) => (
                    <div key={sidx} className="flex flex-col">
                      <span className="font-poppins text-[10px] text-gray-500 font-bold uppercase tracking-wider">{sub.title}</span>
                      <span className="font-poppins text-sm font-bold text-[#111]">{sub.lead}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VISUAL METAPHORS */}
      <section className="max-w-6xl mx-auto px-6 py-12 text-center">
        <h2 className="text-3xl md:text-5xl font-anton uppercase text-[#111] leading-[1] tracking-wide reveal">
          VISUAL METAPHORS OF THE TRANSITION
        </h2>
        <p className="font-poppins font-bold text-base md:text-xl text-[#111] mt-3 mb-10 md:mb-16 reveal">
          Logo Anatomy Breakdown
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch reveal">
          {/* Left Grid: 2x2 */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* YOUTH */}
            <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-8 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 flex flex-col items-center cursor-default">
              <div className="h-24 md:h-32 flex items-center justify-center mb-6">
                <Image src="/ABOUT_US/LOGO ANATOMY BREAKDOWN/YOUTH (Y).png" alt="YOUTH" width={100} height={100} className="object-contain h-full" />
              </div>
              <div className="bg-grass text-[#111] font-anton text-sm uppercase px-6 py-1 rounded-full border-2 border-[#111] mb-4 shadow-brutal-hover">
                YOUTH
              </div>
              <p className="font-poppins text-xs text-[#111] leading-relaxed text-center">
                Represents the raw energy, aggressiveness, and progressive innovation of global engineering students.
              </p>
            </div>
            
            {/* MINE */}
            <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-8 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 flex flex-col items-center cursor-default">
              <div className="h-24 md:h-32 flex items-center justify-center mb-6">
                <Image src="/ABOUT_US/LOGO ANATOMY BREAKDOWN/MINING (M).png" alt="MINE" width={100} height={100} className="object-contain h-full" />
              </div>
              <div className="bg-grass text-[#111] font-anton text-sm uppercase px-6 py-1 rounded-full border-2 border-[#111] mb-4 shadow-brutal-hover">
                MINING
              </div>
              <p className="font-poppins text-xs text-[#111] leading-relaxed text-center">
                Represents the physical depth of resource extraction and the intellectual depth of earth sciences.
              </p>
            </div>

            {/* CAMP */}
            <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-8 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 flex flex-col items-center cursor-default">
              <div className="h-24 md:h-32 flex items-center justify-center mb-6">
                <Image src="/ABOUT_US/LOGO ANATOMY BREAKDOWN/CAMP (C1).png" alt="CAMP" width={100} height={100} className="object-contain h-full" />
              </div>
              <div className="bg-grass text-[#111] font-anton text-sm uppercase px-6 py-1 rounded-full border-2 border-[#111] mb-4 shadow-brutal-hover">
                CAMP
              </div>
              <p className="font-poppins text-xs text-[#111] leading-relaxed text-center">
                Represents environmental responsibility and a deep commitment to sustainability.
              </p>
            </div>

            {/* COMPETITION */}
            <div className="bg-white border-2 border-[#111] rounded-[2rem] p-6 md:p-8 shadow-brutal hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 flex flex-col items-center cursor-default">
              <div className="h-24 md:h-32 flex items-center justify-center mb-6">
                <Image src="/ABOUT_US/LOGO ANATOMY BREAKDOWN/COMPETITION (C2).png" alt="COMPETITION" width={100} height={100} className="object-contain h-full" />
              </div>
              <div className="bg-grass text-[#111] font-anton text-sm uppercase px-6 py-1 rounded-full border-2 border-[#111] mb-4 shadow-brutal-hover">
                COMPETITION
              </div>
              <p className="font-poppins text-xs text-[#111] leading-relaxed text-center">
                Represents the highest level of intelligence, skill, and sportsmanship in the Youth Mining Camp Competition.
              </p>
            </div>
          </div>

          {/* Right Tall Card */}
          <div className="lg:col-span-4 bg-white border-2 border-[#111] rounded-[2.5rem] p-6 md:p-10 shadow-brutal flex flex-col items-center justify-center hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all duration-500 cursor-default">
            <div className="flex-grow flex items-center justify-center mb-8">
              <Image src="/ABOUT_US/LOGO ANATOMY BREAKDOWN/VII.png" alt="VII" width={180} height={180} className="object-contain animate-float" />
            </div>
            <div className="bg-grass text-[#111] font-anton text-lg uppercase px-8 py-1.5 rounded-full border-2 border-[#111] mb-6 shadow-brutal-hover">
              VII
            </div>
            <p className="font-poppins text-sm text-[#111] leading-relaxed text-center">
              Represents copper as a critical energy-transition metal, symbolizing precision and technological advancement.
            </p>
          </div>
        </div>
      </section>

      {/* 5. MASCOT */}
      <section className="max-w-5xl mx-auto px-6 py-16 mb-16 reveal">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
          <div className="w-64 md:w-96 shrink-0 relative animate-float">
            <Image src="/ABOUT_US/MASKOT YMCC.png" alt="TGC Mascot" width={400} height={400} className="object-contain w-full drop-shadow-xl" />
          </div>
          <div className="flex-grow text-center md:text-left">
            <p className="font-poppins font-bold text-sm text-grass bg-[#111] px-4 py-1.5 rounded-full inline-block mb-4 border-2 border-grass">
              MASCOT PHILOSOPHY
            </p>
            <h2 className="text-3xl md:text-6xl font-anton uppercase text-[#111] leading-[1] md:leading-[0.95] tracking-wide mb-4 md:mb-6">
              YOTTA
            </h2>
            <p className="font-poppins text-sm md:text-base text-[#111] leading-relaxed">
              Yotta is depicted as a sleek geometric compass, complemented by a rugged tactical visor. The mascot embodies clarity under pressure, guiding delegates through complex mining challenges with ethical judgment and data-driven decision-making.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

