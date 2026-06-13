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

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  const isSolid = isScrolled || pathname !== "/";

  if (pathname?.startsWith("/operator") || pathname?.startsWith("/admin") || pathname?.startsWith("/staff") || pathname?.startsWith("/portal")) return null;

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-screen-xl z-[90]">
      <div
        id="navbar"
        className={`border-2 rounded-full px-6 flex justify-between items-center w-full transition-all duration-400 ${
          isSolid ? "nav-solid" : "nav-transparent"
        }`}
      >
        <div className="flex items-center gap-2 cursor-pointer group">
          <Link href="/">
            <Image
              src="/LOGO YMCC.png"
              alt="YMCC Logo"
              width={120}
              height={40}
              className={`h-8 object-contain transition-all duration-300 ${
                !isSolid && pathname === "/" ? "brightness-0 invert" : ""
              }`}
            />
          </Link>
        </div>

        <div
          className={`hidden lg:flex items-center gap-8 text-[12px] font-bold uppercase tracking-widest transition-colors duration-300 ${
            !isSolid && pathname === "/" ? "text-white" : "text-[#111]"
          }`}
        >
          {[
            { href: "/", label: "Home" },
            { href: "/about-us", label: "About Us" },
            { href: "/events", label: "Events & Competitions" },
            { href: "/news", label: "News & Articles" },
            { href: "/merch", label: "Merch Shop" },
            { href: "/contact", label: "Contact & FAQ" },
          ].map((link) => {
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

        <div className="flex gap-2">
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
      </div>
    </nav>
  );
}
