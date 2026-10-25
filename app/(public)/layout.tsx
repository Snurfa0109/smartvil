/**
 * [HALAMAN USER / WARGA] Layout Utama Portal Publik
 * Kerangka tata letak halaman warga yang menyatukan Navbar, Footer, dan Widget Chatbot Arba.
 */

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chatbot/chat-widget";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}

