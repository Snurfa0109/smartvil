"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  MapPin,
  History,
  Target,
  ShieldCheck,
  HeartHandshake,
  Home,
  Clock,
  FileText,
  Phone,
  ArrowRight,
} from "lucide-react";
import { SiteSettings, DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/site-config";

export default function ProfilePage() {
  const [profile, setProfile] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getSiteSettings();
        setProfile(data);
      } catch (error) {
        console.error("Error loading profile settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const missionItems = profile.mission
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 space-y-12">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1b365d]/10 text-[#1b365d] border border-[#1b365d]/20">
          <span>Kecamatan Cipocok Jaya • Kota Serang</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b365d]">
          {profile.title}
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          {profile.subtitle}
        </p>
        {loading && (
          <p className="text-xs text-muted-foreground">Memuat data profil terbaru...</p>
        )}
      </div>

      {/* Info Identitas Resmi & Wilayah */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Kode Kemendagri", val: "36.73.05.1004" },
          { label: "Kode Pos", val: "42122" },
          { label: "Kecamatan", val: "Cipocok Jaya" },
          { label: "Kota / Provinsi", val: "Kota Serang, Banten" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-4 text-center shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">{item.label}</span>
            <span className="text-sm md:text-base font-bold text-slate-800 mt-1 block">{item.val}</span>
          </div>
        ))}
      </div>

      {/* Sejarah & Selayang Pandang */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-7 flex flex-col justify-between shadow-xs space-y-6">
          {/* Top Header */}
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo-kota-serang.png"
                  alt="Logo Kota Serang"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Pemerintah Kota Serang
                </p>
                <h3 className="text-sm font-bold text-slate-900">
                  {profile.villageName || "Kelurahan Banjar Agung"}
                </h3>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md shrink-0">
              Kecamatan Cipocok Jaya
            </span>
          </div>

          {/* Core Services */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Pelayanan Administrasi Terpadu (PATEN)
              </h4>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Jam Kerja: Senin – Jumat, 08.00 – 15.30 WIB</span>
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-800">
                  Layanan Surat Keterangan Warga
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Pengurusan SKU, SKTM, Keterangan Domisili, dan Pengantar Administrasi Kependudukan.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-800">
                  Program Warga & Kebersihan Lingkungan
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Kegiatan gotong royong terpadu &quot;Rabu Asri&quot; dan pembinaan kemasyarakatan di wilayah RW.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-800">
                  Integrasi Fasilitas Publik
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Kawasan layanan terpadu dengan Puskesmas Banjar Agung dan Posyandu kelurahan.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/layanan"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Layanan Permohonan Surat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href={`https://wa.me/${(profile.villagePhone || "0813-1505-3901").replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Kontak WhatsApp</span>
            </a>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#1b365d]">
            <History className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Sejarah & Profil Wilayah</h2>
          </div>
          <div className="text-muted-foreground leading-relaxed text-justify space-y-3 text-sm">
            {profile.history.split("\n\n").map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="grid md:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-blue-50/40 to-white border border-[#1b365d]/15 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#1b365d] mb-1">
              <Target className="h-5 w-5" />
              <CardTitle className="text-lg">Visi Kelurahan</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium italic text-foreground leading-relaxed">
              &quot;{profile.vision}&quot;
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50/40 to-white border border-[#1b365d]/15 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#1b365d] mb-1">
              <Target className="h-5 w-5" />
              <CardTitle className="text-lg">Misi Pembangunan & Pelayanan</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {missionItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-[#1b365d]/15 text-[#1b365d] text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Geografis & Batas Wilayah */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-[#1b365d]">
          <MapPin className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Geografis & Batas Wilayah</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Kawasan & Luas Wilayah</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-[#1b365d]">
                {profile.geoArea}
              </p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {profile.geoAreaDesc}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Koordinat Geografis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold font-mono text-foreground">{profile.geoCoord}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {profile.geoCoordDesc}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Batas Wilayah</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex justify-between border-b pb-1.5">
                  <span className="font-semibold text-foreground">Utara</span>
                  <span>{profile.boundaryNorth}</span>
                </li>
                <li className="flex justify-between border-b pb-1.5">
                  <span className="font-semibold text-foreground">Selatan</span>
                  <span>{profile.boundarySouth}</span>
                </li>
                <li className="flex justify-between border-b pb-1.5">
                  <span className="font-semibold text-foreground">Timur</span>
                  <span>{profile.boundaryEast}</span>
                </li>
                <li className="flex justify-between pt-0.5">
                  <span className="font-semibold text-foreground">Barat</span>
                  <span>{profile.boundaryWest}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fasilitas & Kawasan Pemukiman Utama */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-[#1b365d]">
          <Home className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Fasilitas & Pemukiman Utama</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Home className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">{profile.facility1Title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {profile.facility1Desc}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">{profile.facility2Title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {profile.facility2Desc}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">{profile.facility3Title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {profile.facility3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* Struktur Pemerintahan Kelurahan */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-[#1b365d]">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Struktur Organisasi Kelurahan</h2>
        </div>
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px]">
          {/* Lurah */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#1b365d] to-[#c9971c] p-1 shadow-md">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl font-extrabold text-[#1b365d]">
                  {profile.headName.charAt(0)}
                </div>
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1b365d] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                LURAH
              </span>
            </div>
            <div className="text-center mt-3">
              <h3 className="font-bold text-lg text-foreground">{profile.headName}</h3>
              <p className="text-sm text-[#1b365d] font-medium">{profile.headTitle}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-300 my-3" />

          {/* Staf / Aparatur Kelurahan */}
          <div className="w-full max-w-3xl border-t border-gray-300 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-300" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 w-full">
              {/* Seklur */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#1b365d] to-blue-400 p-1 mb-2">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl font-bold text-[#1b365d]">
                    {profile.secretaryName.charAt(0)}
                  </div>
                </div>
                <h4 className="font-bold text-sm text-foreground">{profile.secretaryName}</h4>
                <p className="text-xs text-[#1b365d] font-medium">{profile.secretaryTitle}</p>
                <span className="text-[10px] text-muted-foreground mt-1 bg-slate-100 px-2 py-0.5 rounded">Sekretariat Kelurahan</span>
              </div>

              {/* Kasi Pemerintahan */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 mb-2">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl font-bold text-emerald-700">
                    {profile.kasiPemerintahanName.charAt(0)}
                  </div>
                </div>
                <h4 className="font-bold text-sm text-foreground">{profile.kasiPemerintahanName}</h4>
                <p className="text-xs text-[#1b365d] font-medium">{profile.kasiPemerintahanTitle}</p>
                <span className="text-[10px] text-muted-foreground mt-1 bg-slate-100 px-2 py-0.5 rounded">Wilayah & Ketertiban Umum</span>
              </div>

              {/* Kasi Pelayanan */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#c9971c] to-amber-400 p-1 mb-2">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl font-bold text-[#c9971c]">
                    {profile.kasiPelayananName.charAt(0)}
                  </div>
                </div>
                <h4 className="font-bold text-sm text-foreground">{profile.kasiPelayananName}</h4>
                <p className="text-xs text-[#1b365d] font-medium">{profile.kasiPelayananTitle}</p>
                <span className="text-[10px] text-muted-foreground mt-1 bg-slate-100 px-2 py-0.5 rounded">Administrasi & Surat Menyurat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lokasi Kantor */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1b365d]/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#1b365d]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Lokasi Kantor Kelurahan</h2>
            <p className="text-sm text-muted-foreground">Jl. Syech Nawawi Albantani No. 16, Banjar Agung, Cipocok Jaya, Kota Serang</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.553186774327!2d106.18526387499237!3d-6.132261593865507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e418b6f37a00001%3A0xfb48b3a8f7a1a77f!2sKelurahan%20Banjar%20Agung!5e0!3m2!1sid!2sid!4v1727188800000!5m2!1sid!2sid"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Lokasi Kantor Kelurahan Banjar Agung"
            className="w-full"
          />
        </div>

        <div className="flex justify-end">
          <a
            href="https://maps.google.com/?q=Kelurahan+Banjar+Agung+Cipocok+Jaya+Kota+Serang"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1b365d] text-white text-sm font-semibold hover:bg-[#1b365d]/90 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Buka di Google Maps
          </a>
        </div>
      </section>
    </div>
  );
}