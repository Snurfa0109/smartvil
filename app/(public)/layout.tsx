/**
 * [HALAMAN USER / WARGA] Layout Utama Portal Publik
 * Kerangka tata letak halaman warga yang menyatukan Navbar, Footer, Chatbot Arba, dan Widget Aksesibilitas.
 */

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { AccessibilityWidget } from "@/components/layout/accessibility-widget";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1b365d] focus:text-white focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-hidden focus:ring-3 focus:ring-amber-400"
      >
        Lewati ke Konten Utama
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} aria-label="Konten utama portal kelurahan" className="flex-1 focus:outline-hidden">
        {children}
      </main>
      <Footer />
      <ChatWidget />
      <AccessibilityWidget />
    </>
  );
}

