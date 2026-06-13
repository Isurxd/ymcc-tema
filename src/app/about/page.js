import Image from "next/image";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Decoding the Coalition */}
      <section className="max-w-6xl mx-auto px-8 pt-16 w-full">
        <div className="neo-box overflow-hidden flex flex-col md:flex-row p-0">
          <div className="w-full md:w-1/2 relative h-[300px] md:h-auto">
            <Image src="/hero.jpg" alt="About Hero" fill className="object-cover" />
          </div>
          <div className="w-full md:w-1/2 p-12">
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-6 leading-tight">
              Decoding The Coalition
            </h1>
            <p className="text-sm leading-relaxed text-gray-700">
              The Youth Mining Camp Competition (YMCC) is the flagship biennial event organized by the Student Association of Mining Engineering (Himpunan Mahasiswa Teknik Pertambangan - HMTA) of Universitas Pembangunan Nasional "Veteran" Yogyakarta. Founded as a platform to test national engineering capabilities, YMCC has expanded into a prestigious multinational summit, serving as a critical nexus where future mining executives, global researchers, and energy corporations meet to solve real-world industrial and ecological challenges.
            </p>
          </div>
        </div>
      </section>

      {/* The Seven-Stage Evolution */}
      <section className="max-w-4xl mx-auto px-8 pt-20 w-full">
        <h2 className="text-4xl font-black uppercase mb-12">The Seven-Stage Evolution</h2>
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-black">
          {/* Stage 1 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="w-10 h-10 rounded-full border-3 border-black bg-[var(--color-ymcc-green)] absolute left-0 md:left-1/2 -translate-y-4 sm:translate-y-0 transform -translate-x-1/2 flex items-center justify-center shadow-[2px_2px_0px_#000]"></div>
            <div className="neo-box w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 ml-auto md:ml-0">
              <span className="bg-purple-200 text-purple-900 text-[10px] font-bold px-2 py-1 rounded uppercase border border-black mb-2 inline-block">The Foundation Era</span>
              <h3 className="text-2xl font-black uppercase mb-2">YMCC I - IV</h3>
              <p className="text-sm">Initiated as a localized tournament to bridge academic theories with standard field operations, focusing heavily on basic mining games and national safety standards.</p>
            </div>
          </div>
          {/* Stage 2 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="w-10 h-10 rounded-full border-3 border-black bg-[var(--color-ymcc-green)] absolute left-0 md:left-1/2 -translate-y-4 sm:translate-y-0 transform -translate-x-1/2 flex items-center justify-center shadow-[2px_2px_0px_#000]"></div>
            <div className="neo-box w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 mr-auto md:mr-0 ml-16 md:ml-0">
              <span className="bg-orange-200 text-orange-900 text-[10px] font-bold px-2 py-1 rounded uppercase border border-black mb-2 inline-block">The Regional Expansion</span>
              <h3 className="text-2xl font-black uppercase mb-2">YMCC V - VI</h3>
              <p className="text-sm">Transformed into a regional-scale summit, integrating complex infrastructure mapping (MSIC) and introducing the initial digital registration interfaces.</p>
            </div>
          </div>
          {/* Stage 3 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="w-10 h-10 rounded-full border-3 border-black bg-[var(--color-ymcc-green)] absolute left-0 md:left-1/2 -translate-y-4 sm:translate-y-0 transform -translate-x-1/2 flex items-center justify-center shadow-[2px_2px_0px_#000]"></div>
            <div className="neo-box w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 ml-auto md:ml-0">
              <span className="bg-green-200 text-green-900 text-[10px] font-bold px-2 py-1 rounded uppercase border border-black mb-2 inline-block">The Sovereign Transition</span>
              <h3 className="text-2xl font-black uppercase mb-2">YMCC VII</h3>
              <p className="text-sm">The current era. Guided by "The Green Compass," YMCC VII introduces state-of-the-art proctored Exam Engines, bilingual standardizations, and a heavy strategic focus on sustainable mineral extraction.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* HMTA Section */}
      <section className="max-w-6xl mx-auto px-8 pt-20 w-full">
        <div className="neo-box bg-[var(--color-ymcc-green)] p-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase mb-6 leading-tight">
            The Student Association<br/>Of Mining Engineering
          </h2>
          <p className="text-sm leading-relaxed font-medium">
            HMTA UPN "Veteran" Yogyakarta is one of the most prominent, active, and long-standing student engineering associations in Indonesia. Governed by principles of discipline, technical mastery, and strong fraternal bonds, HMTA serves as the incubator for student engineers. Every operational detail of YMCC VII is planned, managed, and executed by our dedicated student officers—collectively known as the Strategic Force—under strict academic and professional supervision.
          </p>
        </div>
      </section>
    </div>
  );
}
