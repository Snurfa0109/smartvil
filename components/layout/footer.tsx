"use client";

import Link from "next/link";
import { FileText, Users, Building, Newspaper, MessageSquareWarning, PhoneCall, MapPin, Mail, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteSettings, DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/site-config";

const quickLinks = [
  { href: "/layanan", label: "Layanan Surat", icon: FileText },
  { href: "/data", label: "Data Penduduk", icon: Users },
  { href: "/profil", label: "Profil Kelurahan", icon: Building },
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
      {/* CTA strip */}
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

      {/* Main */}
      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
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
            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {config.instagramUrl && (
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-[#c9971c] text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  <span>Instagram Resmi</span>
                </a>
              )}
              {config.linktreeUrl && (
                <a
                  href={config.linktreeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  <span>Linktree Resmi</span>
                </a>
              )}
            </div>
          </div>

          {/* Tautan Cepat */}
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

          {/* Kontak */}
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

          {/* Kontak Darurat */}
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

        {/* Bottom */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Pemerintah {config.villageName}, Kec. Cipocok Jaya, Kota Serang.</p>
          <p>Kode Kemendagri: 36.73.05.1004 | Kode Pos: 42122</p>
        </div>
      </div>
    </footer>
  );
}