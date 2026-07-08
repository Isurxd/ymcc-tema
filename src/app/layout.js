import { Anton, Poppins } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import CookieConsent from "@/components/CookieConsent";
import { CartProvider } from "@/context/CartContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
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
  description: "The premier international student engineering forum organized by HMTA UPN Veteran Yogyakarta. Join global mining delegations and competitions.",
  keywords: ["YMCC", "Mining Competition", "Earth Science", "UPN Veteran Yogyakarta", "HMTA", "Mining Engineering", "Critical Minerals", "Energy Transition"],
  authors: [{ name: "HMTA UPN Veteran Yogyakarta" }],
  openGraph: {
    title: "YMCC VII | Navigate The Future",
    description: "The premier international student engineering forum organized by HMTA UPN Veteran Yogyakarta.",
    url: "https://trial-ymccvii.netlify.app",
    siteName: "YMCC VII",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YMCC VII | Navigate The Future",
    description: "The premier international student engineering forum organized by HMTA UPN Veteran Yogyakarta.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${anton.variable} ${poppins.variable} scroll-smooth h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#fafafa] text-[#111] overflow-x-hidden">
        <ConfirmProvider>
          <CartProvider>
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
            <Toaster 
            position="top-center" 
            toastOptions={{ 
              style: { 
                background: '#fff', 
                color: '#000', 
                border: '4px solid #000', 
                boxShadow: '4px 4px 0 0 #000',
                borderRadius: '16px', 
                fontFamily: 'var(--font-poppins)', 
                fontWeight: 'bold',
                padding: '16px',
                fontSize: '15px'
              },
              success: {
                style: { background: '#c1ff00', color: '#000', border: '4px solid #000' }
              },
              error: {
                style: { background: '#ff3333', color: '#fff', border: '4px solid #000' }
              }
            }} 
          />
          </CartProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
