import { Anton, Poppins } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import CookieConsent from "@/components/CookieConsent";
import PromoModal from "@/components/PromoModal";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || 'https://trial-ymccvii.netlify.app'),
  title: "YMCC VII | Navigate The Future",
  description: "The premier international student engineering assembly led by HMTA UPN Veteran Yogyakarta. Join global mining delegations and competitions.",
  keywords: ["YMCC", "Mining Competition", "Earth Science", "UPN Veteran Yogyakarta", "HMTA", "Mining Engineering", "Critical Minerals", "Energy Transition"],
  authors: [{ name: "HMTA UPN Veteran Yogyakarta" }],
  openGraph: {
    title: "YMCC VII | Navigate The Future",
    description: "The premier international student engineering assembly led by HMTA UPN Veteran Yogyakarta.",
    url: "https://trial-ymccvii.netlify.app",
    siteName: "YMCC VII",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YMCC VII | Navigate The Future",
    description: "The premier international student engineering assembly led by HMTA UPN Veteran Yogyakarta.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${anton.variable} ${poppins.variable} scroll-smooth h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#fafafa] text-[#111] overflow-x-hidden">
        <CartProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#c1ff00', border: '2px solid #c1ff00', borderRadius: '8px', fontFamily: 'var(--font-poppins)', fontWeight: 'bold' } }} />
        </CartProvider>
      </body>
    </html>
  );
}
