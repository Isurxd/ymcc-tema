"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { subscribeToAuthChanges, logoutUser } from "@/lib/auth";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 0);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  const isSolid = isScrolled || pathname !== "/" || isMobileMenuOpen;

  const isPortalRoute = ["/admin", "/operator", "/fundraising", "/master", "/portal", "/login", "/register", "/staff-register", "/staff"].some(route => pathname?.startsWith(route));
  if (isPortalRoute) return null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about-us", label: "About Us" },
    { href: "/events", label: "Events & Competitions" },
    { href: "/news", label: "News & Articles" },
    { href: "/merch", label: "Merch Shop" },
    { href: "/contact", label: "Contact & FAQ" },
  ];

  return (
    <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-screen-xl z-[90]">
      <div
        id="navbar"
        className={`border-2 rounded-[2rem] px-4 md:px-6 flex justify-between items-center w-full transition-all duration-400 ${
          isSolid ? "nav-solid" : "nav-transparent"
        }`}
      >
        <div className="flex items-center gap-2 cursor-pointer group py-2 md:py-0">
          <Link href="/">
            <Image
              src="/LOGO YMCC.png"
              alt="YMCC Logo"
              width={120}
              height={40}
              className={`h-6 md:h-8 w-auto object-contain transition-all duration-300 ${
                !isSolid && pathname === "/" ? "brightness-0 invert" : ""
              }`}
            />
          </Link>
        </div>

        {/* DESKTOP LINKS */}
        <div
          className={`hidden lg:flex items-center gap-8 text-[12px] font-bold uppercase tracking-widest transition-colors duration-300 ${
            !isSolid && pathname === "/" ? "text-white" : "text-[#111]"
          }`}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-all duration-300 px-2 py-1 rounded-md ${
                  isActive
                    ? isSolid
                      ? "bg-[var(--color-grass)] text-[#111] opacity-100"
                      : "opacity-100"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* DESKTOP ACTIONS */}
        <div className="hidden lg:flex gap-2">
          {user ? (
            <Link href="/portal">
              <button
                className={`border px-6 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 ${
                  !isSolid && pathname === "/"
                    ? "bg-[#c1ff00] text-black border-[#c1ff00]"
                    : "bg-[#111] text-[#c1ff00] border-[#111] hover:bg-[#c1ff00] hover:text-[#111]"
                }`}
              >
                PORTAL
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button
                className={`border px-6 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 ${
                  !isSolid && pathname === "/"
                    ? "bg-transparent text-white border-white"
                    : "bg-[#111] text-white border-[#111] hover:bg-[var(--color-grass)] hover:text-[#111]"
                }`}
              >
                ENTER PORTAL
              </button>
            </Link>
          )}
        </div>

        {/* MOBILE HAMBURGER ICON */}
        <button 
          className={`lg:hidden flex items-center justify-center p-2 rounded-md ${!isSolid && pathname === '/' ? 'text-white' : 'text-[#111]'}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <div className="space-y-1.5 flex flex-col justify-center">
            <span className={`block w-6 h-0.5 transition-all duration-300 bg-current ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 transition-all duration-300 bg-current ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 transition-all duration-300 bg-current ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      <div 
        className={`absolute top-full left-0 w-full mt-2 bg-white border-2 border-black rounded-2xl shadow-brutal flex flex-col overflow-hidden transition-all duration-300 origin-top lg:hidden ${
          isMobileMenuOpen ? "scale-y-100 opacity-100 pointer-events-auto" : "scale-y-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col py-4 px-6 gap-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-bold uppercase tracking-widest transition-colors py-2 border-b border-gray-100 ${
                  isActive ? "text-[var(--color-grass-dark)]" : "text-gray-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          
          <div className="pt-2">
            {user ? (
              <Link href="/portal">
                <button className="w-full bg-[#111] text-[#c1ff00] border-2 border-[#111] px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest active:scale-95 transition-transform">
                  ENTER PORTAL
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="w-full bg-white text-[#111] border-2 border-[#111] px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest active:scale-95 transition-transform">
                  LOGIN / REGISTER
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
