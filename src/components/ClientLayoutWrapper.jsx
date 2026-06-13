"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

export default function ClientLayoutWrapper({ children }) {
  const pathname = usePathname();
  const isPortalRoute = [
    "/admin", 
    "/operator", 
    "/fundraising", 
    "/master", 
    "/portal", 
    "/login", 
    "/register", 
    "/staff-register",
    "/staff"
  ].some(route => pathname?.startsWith(route));

  if (isPortalRoute) {
    return <main className="flex-grow">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <CookieConsent />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
