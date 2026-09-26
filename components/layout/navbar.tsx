"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil Kelurahan" },
  { href: "/berita", label: "Berita" },
  { href: "/data", label: "Data Penduduk" },
  { href: "/layanan", label: "Layanan Surat" },
  { href: "/pengaduan", label: "Pengaduan" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-xs">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex h-16 items-center justify-between gap-6">

          {/* Logo dengan Lambang Resmi Kota Serang */}
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

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "text-primary font-semibold bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <div className="hidden md:block shrink-0">
            <Link href="/layanan">
              <Button size="sm" className="text-xs font-semibold rounded-lg shadow-xs">
                Ajukan Surat
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => {
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
          <div className="pt-2">
            <Link href="/layanan" onClick={() => setIsOpen(false)}>
              <Button className="w-full text-xs font-semibold rounded-lg">
                Ajukan Surat Online
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}