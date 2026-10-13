"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  ExternalLink,
  Building2,
  Compass,
  Award,
  Layers,
  CheckCircle2,
  User,
  BookOpen,
  Landmark
} from "lucide-react";
import { SiteSettings, DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/site-config";
import { PageBanner } from "@/components/layout/page-banner";

// Data Sebaran 8 Rukun Warga (RW) Kelurahan Banjar Agung
const RW_DATA = [
  { rw: "RW 01", wilayah: "Lingkungan Bogeg", cakupan: "Pusat hunian warga asli & akses jalan utama", rtCount: 4 },
  { rw: "RW 02", wilayah: "Lingkungan Banjar Agung Timur", cakupan: "Area pemukiman asri & sentra usaha warga", rtCount: 4 },
  { rw: "RW 03", wilayah: "Perumahan Bumi Agung Permai (BAP) I", cakupan: "Kawasan BAP I Bagian Utara (Blok A – C)", rtCount: 5 },
  { rw: "RW 04", wilayah: "Perumahan Bumi Agung Permai (BAP) I", cakupan: "Kawasan BAP I Bagian Selatan (Blok D – F)", rtCount: 5 },
  { rw: "RW 05", wilayah: "Perumahan Bumi Agung Permai (BAP) II", cakupan: "Kawasan pemukiman BAP II & sarana fasilitas sosial", rtCount: 4 },
  { rw: "RW 06", wilayah: "Perumahan Bumi Mutiara Serang", cakupan: "Hunian keluarga terpadu & masjid jami'", rtCount: 4 },
  { rw: "RW 07", wilayah: "Lingkungan Cilaku Perbatasan", cakupan: "Kawasan hijau & pembinaan pertanian perkotaan", rtCount: 3 },
  { rw: "RW 08", wilayah: "Kawasan Niaga & Hunian Baru", cakupan: "Sentra pertokoan, UMKM, & pemukiman berkembang", rtCount: 3 },
];

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

  const historyParagraphs = profile.history
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // List aparatur dinamis (bersumber dari Admin CMS Settings)
  const officialsList =
    profile.officials && profile.officials.length > 0
      ? profile.officials
      : [
          {
            id: "head",
            name: profile.headName,
            title: profile.headTitle,
            nip: profile.headNip,
            photo: profile.headPhoto,
            roleBadge: "PIMPINAN",
            division: "Kelurahan",
            duties:
              "Penanggung jawab kebijakan wilayah, pembinaan kemasyarakatan, dan penandatanganan legalitas surat resmi warga.",
          },
          {
            id: "sec",
            name: profile.secretaryName,
            title: profile.secretaryTitle,
            nip: profile.secretaryNip,
            photo: profile.secretaryPhoto,
            roleBadge: "SEKRETARIAT",
            division: "Sekretariat",
            duties:
              "Koordinator tata usaha, pengelolaan anggaran, dan administrasi kepegawaian internal kelurahan.",
          },
          {
            id: "kasi-pem",
            name: profile.kasiPemerintahanName,
            title: profile.kasiPemerintahanTitle,
            nip: profile.kasiPemerintahanNip,
            photo: profile.kasiPemerintahanPhoto,
            roleBadge: "KASI",
            division: "Trantib & Wilayah",
            duties:
              "Pembinaan ketertiban umum, penanganan sengketa warga, dan koordinasi dengan ketua 8 RW & 32 RT.",
          },
          {
            id: "kasi-pel",
            name: profile.kasiPelayananName,
            title: profile.kasiPelayananTitle,
            nip: profile.kasiPelayananNip,
            photo: profile.kasiPelayananPhoto,
            roleBadge: "KASI",
            division: "Pelayanan Umum",
            duties:
              "Verifikasi berkas persyaratan surat keterangan, legalisasi dokumen kependudukan, dan loket PATEN.",
          },
        ];

  const headOfficial = officialsList[0];
  const staffOfficials = officialsList.slice(1);

  // List fasilitas umum dinamis (bersumber dari Admin CMS Settings)
  const facilitiesList =
    profile.facilities && profile.facilities.length > 0
      ? profile.facilities
      : [
          {
            id: "fac-1",
            title: profile.facility1Title || "Balai Warga & Posyandu Terpadu",
            category: "Fasilitas Sosial",
            desc:
              profile.facility1Desc ||
              "Tersedia balai pertemuan warga di tiap RW dan Posyandu aktif untuk pemantauan tumbuh kembang balita serta lansia.",
          },
          {
            id: "fac-2",
            title: profile.facility2Title || "Puskesmas Pembantu Cipocok Jaya",
            category: "Kesehatan Primer",
            desc:
              profile.facility2Desc ||
              "Akses layanan kesehatan tingkat pertama, imunisasi balita, dan rujukan BPJS Kesehatan warga kelurahan.",
          },
          {
            id: "fac-3",
            title: profile.facility3Title || "Kawasan Perumahan & Niaga Mandiri",
            category: "Pemukiman",
            desc:
              profile.facility3Desc ||
              "Perumahan Bumi Agung Permai (BAP) I & II serta Bumi Mutiara Serang dengan fasilitas ibadah dan olahraga.",
          },
        ];

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Banner Resmi Halaman Profil */}
      <PageBanner
        pageKey="profil"
        overrideTitle={profile.title}
        overrideSubtitle={profile.subtitle}
      />

      <div className="container mx-auto px-6 md:px-12 space-y-12">
        {/* 2. Quick Jump Anchor Bar (UCD Navigation - Ramah Lansia & Cepat Dipindai) */}
        <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 shrink-0 hidden sm:inline-block">
              Pintasan:
            </span>
            <a
              href="#identitas"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Building2 className="w-3.5 h-3.5 text-[#1b365d]" />
              <span>Identitas &amp; PATEN</span>
            </a>
            <a
              href="#aparatur"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Users className="w-3.5 h-3.5 text-[#1b365d]" />
              <span>Aparatur Kelurahan</span>
            </a>
            <a
              href="#visimisi"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Target className="w-3.5 h-3.5 text-[#1b365d]" />
              <span>Visi &amp; Misi</span>
            </a>
            <a
              href="#sejarah"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <History className="w-3.5 h-3.5 text-[#1b365d]" />
              <span>Sejarah Wilayah</span>
            </a>
            <a
              href="#teritorial"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-[#1b365d]" />
              <span>Peta &amp; Sebaran RW</span>
            </a>
            <a
              href="#fasilitas"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Home className="w-3.5 h-3.5 text-[#1b365d]" />
              <span>Fasilitas Publik</span>
            </a>
          </div>
        </div>

        {/* 3. Info Identitas Resmi Legalitas Wilayah (Kode Kemendagri) */}
        <section id="identitas" className="space-y-6 scroll-mt-28">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { label: "Kode Wilayah Kemendagri", val: profile.kemendagriCode || "36.73.05.1004", badge: "Resmi" },
              { label: "Kode Pos Wilayah", val: profile.postalCode || "42122", badge: "Pos" },
              { label: "Kecamatan", val: "Cipocok Jaya", badge: "Kecamatan" },
              { label: "Pemerintah Daerah", val: "Kota Serang, Banten", badge: "Kota" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 text-center shadow-xs hover:border-[#1b365d]/40 transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {item.label}
                  </span>
                </div>
                <span className="text-sm md:text-base font-extrabold text-[#1b365d] block font-mono">
                  {item.val}
                </span>
              </div>
            ))}
          </div>

          {/* Kartu Pelayanan Terpadu & Standar PATEN */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md">
                    Standar Pelayanan Prima
                  </span>
                  <span className="text-xs text-slate-500">• Bebas Biaya (Rp 0)</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Pelayanan Administrasi Terpadu Kelurahan (PATEN) Banjar Agung
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  Sistem pelayanan administrasi satu pintu bagi masyarakat di tingkat kelurahan. Mendukung pengurusan Surat Keterangan Usaha (SKU), Keterangan Tidak Mampu (SKTM), Keterangan Domisili, dan Pengantar Administrasi Kependudukan (KTP/KK) secara cepat dan transparan.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1b365d]" />
                    <span>Jam Operasional: Senin – Jumat, 08.00 – 15.30 WIB</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Estimasi Selesai: 1 – 2 Hari Kerja</span>
                  </span>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2.5">
                <Link
                  href="/layanan"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ajukan Surat Mandiri Online</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href={`https://wa.me/${(profile.villagePhone || "0813-1505-3901").replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Konsultasi Loket PATEN</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Struktur Organisasi & Aparatur Kelurahan (Sinkron dengan Admin CMS) */}
        <section id="aparatur" className="space-y-6 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1b365d]/10 flex items-center justify-center text-[#1b365d]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Struktur Organisasi &amp; Aparatur Kelurahan
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Pejabat struktural dan aparatur penggerak pelayanan masyarakat Kelurahan Banjar Agung
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
              Diverifikasi Pemerintah Kota Serang
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xs">
            {/* Kartu Pimpinan Utama: LURAH */}
            {headOfficial && (
              <div className="max-w-md mx-auto">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs relative">
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#1b365d] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                    {headOfficial.roleBadge || "KEPALA KELURAHAN (LURAH)"}
                  </span>

                  <div className="mt-3 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border border-slate-200 bg-slate-50 shadow-2xs mb-3 flex items-center justify-center overflow-hidden">
                      {headOfficial.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={headOfficial.photo}
                          alt={headOfficial.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      {headOfficial.name || "Nama Pimpinan"}
                    </h3>
                    <p className="text-xs font-semibold text-[#1b365d] mt-0.5">
                      {headOfficial.title || "Kepala Kelurahan (Lurah)"}
                    </p>

                    {headOfficial.nip && (
                      <div className="mt-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md text-[11px] font-mono text-slate-600">
                        NIP: {headOfficial.nip}
                      </div>
                    )}

                    {headOfficial.duties && (
                      <p className="text-xs text-slate-500 mt-2.5 leading-relaxed max-w-xs">
                        {headOfficial.duties}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Garis Penghubung Hirarki */}
            {staffOfficials.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-slate-200" />
                <div className="w-full max-w-4xl border-t border-slate-200 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-slate-200" />
                </div>
              </div>
            )}

            {/* Grid Aparatur & Staf Kelurahan (Dinamis dari Admin CMS) */}
            {staffOfficials.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
                {staffOfficials.map((off, idx) => (
                  <div
                    key={off.id || idx}
                    className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs flex flex-col items-center justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col items-center w-full">
                      <div className="w-18 h-18 rounded-full border border-slate-200 bg-slate-50 shadow-2xs mb-3 flex items-center justify-center overflow-hidden">
                        {off.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={off.photo}
                            alt={off.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-base font-mono">
                            {off.name ? off.name.charAt(0).toUpperCase() : "A"}
                          </div>
                        )}
                      </div>

                      {(off.roleBadge || off.division) && (
                        <span className="text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5">
                          {off.division || off.roleBadge}
                        </span>
                      )}

                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {off.name}
                      </h4>
                      <p className="text-xs font-semibold text-[#1b365d] mt-0.5">
                        {off.title}
                      </p>

                      {off.nip && (
                        <span className="text-[10px] font-mono text-slate-500 mt-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                          NIP: {off.nip}
                        </span>
                      )}
                    </div>

                    {off.duties && (
                      <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-relaxed w-full">
                        {off.duties}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 5. Visi & Misi Pembangunan */}
        <section id="visimisi" className="space-y-6 scroll-mt-28">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="w-10 h-10 rounded-xl bg-[#1b365d]/10 flex items-center justify-center text-[#1b365d]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Visi &amp; Misi Pembangunan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Arah kebijakan dan komitmen pelayanan publik jangka panjang Kelurahan Banjar Agung
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-6 items-stretch">
            {/* Visi */}
            <div className="md:col-span-5 bg-gradient-to-br from-[#1b365d] to-[#12243d] text-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-sm space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-white/10 px-3 py-1 rounded-md inline-block">
                  Visi Kelurahan
                </span>
                <h3 className="text-lg font-bold text-white mt-3">
                  Arah Pembangunan Menuju Kota Serang Berkelanjutan
                </h3>
                <blockquote className="mt-4 text-sm md:text-base leading-relaxed text-blue-50 italic border-l-2 border-amber-400 pl-4 py-1">
                  &quot;{profile.vision}&quot;
                </blockquote>
              </div>
              <div className="pt-4 border-t border-white/15 text-xs text-blue-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Selaras dengan RPJMD Pemerintah Kota Serang</span>
              </div>
            </div>

            {/* Misi */}
            <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1b365d] bg-blue-50 border border-blue-200 px-3 py-1 rounded-md inline-block">
                Misi Pelayanan &amp; Wilayah
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                5 Prioritas Aksi Pelayanan Masyarakat
              </h3>
              <ul className="space-y-3 pt-1">
                {missionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                    <span className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Sejarah & Karakteristik Wilayah (UCD Chunking - Mengurangi Cognitive Load) */}
        <section id="sejarah" className="space-y-6 scroll-mt-28">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="w-10 h-10 rounded-xl bg-[#1b365d]/10 flex items-center justify-center text-[#1b365d]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Sejarah &amp; Selayang Pandang Wilayah
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Latar belakang perkembangan kawasan dan kearifan masyarakat lokal
              </p>
            </div>
          </div>

          {/* 3 Kartu Sorotan Sejarah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Gerbang Ibu Kota Banten</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Terletak di Kecamatan Cipocok Jaya sebagai kawasan penyangga utama pusat pemerintahan Provinsi Banten (KP3B) dan simpul akses Gerbang Tol Serang Timur.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Kawasan Pemukiman Mandiri</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tumbuh pesat dengan sentra hunian keluarga seperti Perumahan Bumi Agung Permai (BAP) I &amp; II serta Bumi Mutiara Serang dengan kerukunan warga yang kokoh.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Kearifan &quot;Rabu Asri&quot;</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tradisi gotong royong kerja bakti terpadu, pembinaan posyandu di setiap RW, dan penyaluran bantuan sosial pangan yang tepat sasaran bagi warga prasejahtera.
              </p>
            </div>
          </div>

          {/* Narasi Rinci Sejarah */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1b365d]" />
              <span>Kilas Sejarah &amp; Perkembangan Kelurahan</span>
            </h3>
            <div className="text-slate-600 leading-relaxed space-y-3 text-xs sm:text-sm text-justify">
              {historyParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Peta Batas Wilayah Spasial & Sebaran 8 Rukun Warga (RW) */}
        <section id="teritorial" className="space-y-6 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1b365d]/10 flex items-center justify-center text-[#1b365d]">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Peta Batas Spasial &amp; Sebaran Wilayah RW
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Pemetaan batas administrasi kelurahan dan rincian 8 Rukun Warga (32 RT)
                </p>
              </div>
            </div>
            <a
              href={profile.googleMapsUrl || "https://maps.google.com/?q=Kelurahan+Banjar+Agung+Cipocok+Jaya+Kota+Serang"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#1b365d] hover:bg-slate-50 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs transition-all w-fit"
            >
              <span>Buka Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Peta Polygon */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col justify-between">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden bg-slate-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/peta-wilayah-banjaragung.png"
                  alt="Peta Batas Administrasi Kelurahan Banjar Agung"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-[#0F2236]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/20 shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Batas Administrasi Kelurahan Banjar Agung</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Luas Wilayah: <strong className="font-mono text-[#1b365d]">{profile.geoArea}</strong></span>
                <span className="font-mono text-slate-500">{profile.geoCoord}</span>
              </div>
            </div>

            {/* Batas-Batas 4 Arah Mata Angin */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Batas Administratif
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  Batas Wilayah dengan Kelurahan Tetangga
                </h3>
                <ul className="text-xs space-y-2.5 text-slate-600 pt-1">
                  <li className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-700">Utara</span>
                    <span className="text-right font-medium">{profile.boundaryNorth}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-700">Selatan</span>
                    <span className="text-right font-medium">{profile.boundarySouth}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-700">Timur</span>
                    <span className="text-right font-medium">{profile.boundaryEast}</span>
                  </li>
                  <li className="flex justify-between pt-0.5">
                    <span className="font-bold text-slate-700">Barat</span>
                    <span className="text-right font-medium">{profile.boundaryWest}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-700" />
                  <span>Karakteristik Wilayah</span>
                </h4>
                <p className="text-xs text-blue-900/80 leading-relaxed">
                  {profile.geoAreaDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Tabel Sebaran 8 Rukun Warga (RW) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1b365d]" />
                  <span>Direktori Teritorial 8 Rukun Warga (RW) &amp; 32 RT</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cek kawasan pemukiman atau perumahan tempat domisili tempat tinggal Anda
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
                Total: 8 RW • 32 RT Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {RW_DATA.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5 hover:bg-white hover:border-[#1b365d]/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#1b365d] bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs font-mono">
                      {item.rw}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {item.rtCount} Rukun Tetangga (RT)
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">
                    {item.wilayah}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {item.cakupan}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Fasilitas & Kawasan Pemukiman Utama */}
        <section id="fasilitas" className="space-y-6 scroll-mt-28">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="w-10 h-10 rounded-xl bg-[#1b365d]/10 flex items-center justify-center text-[#1b365d]">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Fasilitas Publik &amp; Pemukiman Utama
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Sarana sosial, pelayanan kesehatan primer, dan kawasan pemukiman warga
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilitiesList.map((fac, idx) => {
              const iconStyles = [
                { bg: "bg-blue-50", text: "text-blue-600", borderHover: "hover:border-blue-300", icon: Home },
                { bg: "bg-emerald-50", text: "text-emerald-600", borderHover: "hover:border-emerald-300", icon: HeartHandshake },
                { bg: "bg-amber-50", text: "text-amber-700", borderHover: "hover:border-amber-300", icon: ShieldCheck },
                { bg: "bg-indigo-50", text: "text-indigo-600", borderHover: "hover:border-indigo-300", icon: Building2 },
                { bg: "bg-slate-100", text: "text-slate-700", borderHover: "hover:border-slate-300", icon: Landmark },
              ];
              const style = iconStyles[idx % iconStyles.length];
              const IconComp = style.icon;

              return (
                <div
                  key={fac.id || idx}
                  className={`bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 ${style.borderHover} transition-colors flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center font-bold`}>
                        <IconComp className="h-5 w-5" />
                      </div>
                      {fac.category && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {fac.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">{fac.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {fac.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}