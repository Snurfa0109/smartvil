"use client";

import Link from "next/link";
import { FileText, Users, Building, Newspaper, MessageSquareWarning, PhoneCall, MapPin, Mail, Clock, Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteSettings, DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/site-config";

const quickLinks = [
  { href: "/layanan", label: "Layanan Surat", icon: FileText },
  { href: "/data", label: "Informasi", icon: Users },
  { href: "/profil", label: "Profil", icon: Building },
  { href: "/berita", label: "Berita & Pengumuman", icon: Newspaper },
  { href: "/pengaduan", label: "Pengaduan Warga", icon: MessageSquareWarning },
];

export function Footer() {
  const [config, setConfig] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    getSiteSettings().then((data) => setConfig(data)).catch((err) => console.error("Error footer config:", err));
  }, []);

  const cleanPhone = config.villagePhone.replace(/[^0-9]/g, "");
  const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;

  return (
    <footer className="bg-[#0d1b2a] text-slate-300">
      <div className="bg-[#162f56] border-b border-white/10 py-6 px-6 md:px-12">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-base">Butuh surat keterangan dari kelurahan?</p>
            <p className="text-blue-100 text-sm opacity-80">Ajukan online - gratis, tanpa antre, selesai 1-2 hari kerja.</p>
          </div>
          <Link href="/layanan">
            <span className="inline-flex items-center gap-2 bg-[#c9971c] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#b5841a] transition-colors cursor-pointer">
              Ajukan Surat Sekarang
            </span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-kota-serang.png"
                alt="Lambang Kota Serang"
                className="h-10 w-auto object-contain shrink-0"
              />
              <div>
                <div className="text-white font-bold text-sm leading-tight">{config.villageName}</div>
                <div className="text-[10px] text-blue-300">Kec. Cipocok Jaya, Kota Serang</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Portal resmi Pemerintah {config.villageName} - pelayanan publik cepat, transparan, dan akuntabel untuk seluruh warga.
            </p>
            <div className="border border-white/10 rounded-lg px-3 py-2.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-[#c9971c] shrink-0" />
                <span>Loket: {config.counterDays}, {config.counterHours}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                Pelayanan mandiri online aktif 24 jam
              </div>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              {config.instagramUrl && (
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#E1306C] text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:scale-105 shadow-xs"
                  title="Instagram Resmi @kel.banjaragung"
                  aria-label="Instagram Resmi Kelurahan Banjar Agung"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {config.linktreeUrl && (
                <a
                  href={config.linktreeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#43E660] hover:text-black text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:scale-105 shadow-xs"
                  title="Linktree Resmi Kelurahan Banjar Agung"
                  aria-label="Linktree Resmi Kelurahan Banjar Agung"
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="m13.51 5.92 2.78-3.42h3.42l-4.36 5.34h3.71l-4.36 5.34h3.71L12 21.5l-6.41-8.32h3.71L4.94 7.84h3.71L4.29 2.5h3.42l2.78 3.42V0h3.02v5.92Z" />
                  </svg>
                </a>
              )}
              {waPhone && (
                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:scale-105 shadow-xs"
                  title="WhatsApp Pelayanan Kelurahan"
                  aria-label="WhatsApp Pelayanan Kelurahan"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm">Tautan Cepat</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group">
                    <link.icon className="h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-[#c9971c] transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm">Kontak Kantor</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#c9971c] mt-0.5 shrink-0" />
                <span>{config.villageAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#c9971c] shrink-0" />
                <a href={`mailto:${config.villageEmail}`} className="hover:text-white transition-colors">
                  {config.villageEmail}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="h-3.5 w-3.5 text-[#c9971c] shrink-0" />
                <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  WhatsApp: {config.villagePhone}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm">Kontak Darurat & Terkait</h4>
            <div className="space-y-2">
              {[
                { label: "Hotline Siaga Kota Serang", value: config.emergencyHotline, urgent: true },
                { label: "Puskesmas Banjar Agung", value: config.emergencyPuskesmas, urgent: false },
                { label: "Polsek Cipocok Jaya", value: config.emergencyPolsek },
                { label: "Koramil Cipocok Jaya", value: config.emergencyKoramil },
                { label: "Damkar & BPBD", value: config.emergencyDamkar },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-center text-xs px-3 py-2 rounded-lg ${
                    item.urgent
                      ? "bg-red-900/30 border border-red-800/40 text-red-300"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`font-mono font-semibold ${item.urgent ? "text-red-300" : "text-slate-200"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Pemerintah {config.villageName}, Kec. Cipocok Jaya, Kota Serang.</p>
          <p>Kode Kemendagri: 36.73.05.1004 | Kode Pos: 42122</p>
        </div>
      </div>
    </footer>
  );
}