import Link from 'next/link';

export default function CompetitionCard({ title, subtitle, target, description, rulesLink, icon }) {
  return (
    <div className="neo-box p-8 flex flex-col h-full hover:-translate-y-1 transition-transform">
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* Badge */}
          <div className="inline-block bg-[var(--color-ymcc-green)] border-2 border-black rounded-full px-3 py-1 text-[10px] font-bold uppercase mb-4">
            {subtitle}
          </div>
          <h3 className="text-2xl font-black uppercase mb-1">{title}</h3>
          <p className="text-sm font-bold text-gray-800">{target}</p>
        </div>
        {/* Icon placeholder */}
        <div className="w-12 h-12 border-2 border-black rounded-lg bg-gray-100 flex items-center justify-center text-xl">
          {icon || "🏆"}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 flex-grow mb-8 leading-relaxed">
        {description}
      </p>
      
      <Link href={rulesLink}>
        <button className="neo-button w-full bg-white text-black py-3 uppercase text-sm border-2">
          Inspect Rules
        </button>
      </Link>
    </div>
  );
}

