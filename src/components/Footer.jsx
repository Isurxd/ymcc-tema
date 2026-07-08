"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaXTwitter, FaInstagram, FaTiktok, FaLinkedinIn } from "react-icons/fa6";

export default function Footer() {
  const pathname = usePathname();
  const internalRoutes = ["/admin", "/operator", "/fundraising", "/master", "/portal", "/login", "/register", "/staff-register", "/staff"];
  if (internalRoutes.some(route => pathname?.startsWith(route))) return null;

  return (
    <footer className="max-w-screen-2xl mx-auto px-4 pb-4 mt-8 relative z-0">
      <div className="bg-[#18181b] text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 border border-black overflow-hidden relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16 relative z-10">
          {/* Column 1 */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/LOGO YMCC.png" alt="YMCC Logo White" width={150} height={50} className="h-10 object-contain brightness-0 invert" />
            </div>
            <div className="font-poppins font-bold text-sm mb-4">NAVIGATE THE FUTURE.</div>
            <p className="text-gray-400 font-poppins text-xs leading-relaxed">
              The premier international student engineering forum organized by the Student Association of Mining Engineering (HMTA), Universitas Pembangunan Nasional &quot;Veteran&quot; Yogyakarta.
            </p>

            <div className="flex items-center gap-4 mt-6">
              <a href="https://www.upnyk.ac.id/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <Image src="/LOGO UPN.png" alt="UPN Logo" width={40} height={40} className="h-10 w-10 object-contain" />
              </a>
              <a href="https://www.instagram.com/hmta_upnyk/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <Image src="/LOGO HMTA.png" alt="HMTA Logo" width={40} height={40} className="h-10 w-10 object-contain" />
              </a>
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="font-poppins font-bold text-white mb-6 text-sm uppercase tracking-widest">PORTAL NAVIGATION</h4>
            <ul className="flex flex-col gap-4 text-sm font-poppins text-gray-300">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/events" className="hover:text-white transition-colors">Events & Competitions</Link></li>
              <li><Link href="/news" className="hover:text-white transition-colors">News & Articles</Link></li>
              <li><Link href="/merch" className="hover:text-white transition-colors">Merch Shop</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact & FAQ</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="font-poppins font-bold text-white mb-6 text-sm uppercase tracking-widest">SECURITY & COMPLIANCE</h4>
            <ul className="flex flex-col gap-4 text-sm font-poppins text-gray-300">
              <li><Link href="/tos" className="hover:text-white transition-colors">Terms of Service (ToS)</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Universal Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie & Tracking Policy</Link></li>
              <li><Link href="/refund" className="hover:text-white transition-colors">Refund & Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="font-poppins font-bold text-white mb-6 text-sm uppercase tracking-widest">CONTACT & COORDINATION CENTER</h4>
            <div className="flex flex-col gap-4 text-sm font-poppins text-gray-300 mb-8">
              <a href="mailto:contact@ymccvii.com" className="hover:text-white transition-colors">contact@ymccvii.com</a>
              <p>0858 1722 2427</p>
            </div>

            <div className="flex gap-3">
              <a href="https://twitter.com/ymcc_upnyk" target="_blank" rel="noreferrer" className="w-10 h-10 bg-[var(--color-grass)] rounded-full flex items-center justify-center hover:scale-110 transition-transform text-[#111]">
                <FaXTwitter className="text-lg" />
              </a>
              <a href="https://instagram.com/ymcc_upnyk" target="_blank" rel="noreferrer" className="w-10 h-10 bg-[var(--color-grass)] rounded-full flex items-center justify-center hover:scale-110 transition-transform text-[#111]">
                <FaInstagram className="text-xl" />
              </a>
              <a href="https://tiktok.com/@ymcc_upnyk" target="_blank" rel="noreferrer" className="w-10 h-10 bg-[var(--color-grass)] rounded-full flex items-center justify-center hover:scale-110 transition-transform text-[#111]">
                <FaTiktok className="text-lg" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-10 h-10 bg-[var(--color-grass)] rounded-full flex items-center justify-center hover:scale-110 transition-transform text-[#111]">
                <FaLinkedinIn className="text-lg" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-poppins font-medium text-gray-400 relative z-10">
          <p>© 2026 Organizing Committee of YMCC VII. All Rights Reserved.</p>
          <p>Engineered and Powered by <a href="https://arc-indonesia.site" target="_blank" rel="noreferrer" className="text-white hover:text-grass transition-colors font-bold">ARC Studio.</a></p>
        </div>
      </div>
    </footer>
  );
}
