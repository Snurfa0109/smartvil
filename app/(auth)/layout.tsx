/**
 * [AUTH] Layout Halaman Autentikasi Warga
 * Hanya Navbar — tanpa Footer, ChatWidget, dan AccessibilityWidget agar halaman masuk/daftar pas satu layar.
 */

import { Navbar } from "@/components/layout/navbar";
import { CitizenProvider } from "@/contexts/CitizenContext";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CitizenProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1b365d] focus:text-white focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-hidden focus:ring-3 focus:ring-amber-400"
      >
        Lewati ke Konten Utama
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} aria-label="Konten utama" className="focus:outline-hidden">
        {children}
      </main>
    </CitizenProvider>
  );
}
