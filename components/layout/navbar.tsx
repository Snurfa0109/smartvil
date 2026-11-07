"use client";

/**
 * [KOMPONEN / SHARED] Navigasi Utama Portal Publik
 * Header navigasi atas halaman warga dengan link menu dan status pencarian.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Search, User, LogOut, History, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearchModal } from "@/components/search/global-search-modal";
import { useCitizen } from "@/contexts/CitizenContext";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil" },
  { href: "/data", label: "Informasi" },
  { href: "/berita", label: "Berita" },
  { href: "/layanan", label: "Layanan Surat" },
  { href: "/pengaduan", label: "Pengaduan" },
  { href: "/riwayat", label: "Riwayat" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { citizen, loading: citizenLoading, signOut } = useCitizen();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav aria-label="Navigasi utama portal kelurahan" className="sticky top-0 z-40 w-full bg-white border-b border-border shadow-xs">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex h-16 items-center justify-between gap-6">

            <Link href="/" className="flex items-center gap-3 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-kota-serang.png"
                alt="Lambang Kota Serang"
                className="h-10 w-auto object-contain shrink-0"
              />
              <div>
                <div className="text-sm font-bold text-foreground leading-tight">Kelurahan Banjar Agung</div>
                <div className="text-[10px] text-muted-foreground">Kec. Cipocok Jaya, Kota Serang</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navLinks
                .filter((link) => link.href !== "/riwayat" || !!citizen)
                .map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative px-3.5 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? "text-[#1b365d]"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <span className="absolute -bottom-1.5 left-2.5 right-2.5 h-0.5 bg-amber-500 rounded-full" />
                      )}
                    </Link>
                  );
                })}
            </div>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Cari seluruh informasi dan layanan kelurahan"
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Cari seluruh layanan & informasi kelurahan"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Cari di portal...</span>
              </button>

              {!citizenLoading && (
                <>
                  {citizen ? (
                    <div className="relative" ref={profileRef}>
                      <button
                        type="button"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#1b365d] flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="max-w-[100px] truncate">{citizen.nama.split(" ")[0]}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50">
                          <div className="px-3.5 py-2 border-b border-slate-100">
                            <p className="text-sm font-semibold text-slate-800 truncate">{citizen.nama}</p>
                            <p className="text-[11px] text-slate-500">{citizen.phone}</p>
                          </div>
                          <Link
                            href="/riwayat"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            <History className="w-4 h-4" />
                            Riwayat Pengajuan
                          </Link>
                          <button
                            type="button"
                            onClick={() => { setIsProfileOpen(false); signOut(); }}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            Keluar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Link href="/masuk">
                        <Button size="sm" variant="outline" className="text-xs font-semibold rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50">
                          Masuk
                        </Button>
                      </Link>
                      <Link href="/daftar">
                        <Button size="sm" className="text-xs font-semibold rounded-lg shadow-xs bg-[#1b365d] hover:bg-[#152a48] text-white">
                          Daftar
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="md:hidden flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Cari di portal"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="mobile-nav-menu"
                aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi utama"}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none cursor-pointer"
              >
                {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>

          </div>
        </div>

        {isOpen && (
          <div id="mobile-nav-menu" className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
            {navLinks
              .filter((link) => link.href !== "/riwayat" || !!citizen)
              .map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? "text-primary bg-secondary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {!citizenLoading && (
                <>
                  {citizen ? (
                    <>
                      <div className="flex items-center gap-2.5 px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-[#1b365d] flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 truncate">{citizen.nama}</p>
                          <p className="text-[11px] text-slate-500">{citizen.phone}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsOpen(false); signOut(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/masuk" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full text-xs font-semibold border-slate-300">
                          Masuk
                        </Button>
                      </Link>
                      <Link href="/daftar" onClick={() => setIsOpen(false)}>
                        <Button className="w-full text-xs font-semibold bg-[#1b365d] text-white">
                          Daftar Akun Warga
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
