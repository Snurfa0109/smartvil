"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  FileText,
  Users,
  Building,
  Phone,
  Calendar,
  PhoneCall,
  ShieldAlert,
  HeartPulse,
  Clock,
  CheckCircle2,
  FileCheck2,
  Inbox,
  ShieldCheck,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { SiteSettings, DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/site-config";
import { stripHtml } from "@/lib/utils";

type LandingNewsItem = {
  id: string;
  title?: string;
  content?: string;
  date?: string;
  category?: string;
};

type LandingStats = {
  total: number;
  kk: number;
  male: number;
  female: number;
};

type AgendaItem = {
  id: string;
  title: string;
  category: string;
  categoryColor: "blue" | "emerald" | "amber" | "red" | "purple";
  schedule: string;
  description: string;
  timeLocation: string;
  active: boolean;
  order: number;
};

const AGENDA_BADGE: Record<string, string> = {
  blue: "text-blue-800 bg-blue-50 border-blue-100",
  emerald: "text-emerald-800 bg-emerald-50 border-emerald-100",
  amber: "text-amber-800 bg-amber-50 border-amber-100",
  red: "text-red-800 bg-red-50 border-red-100",
  purple: "text-purple-800 bg-purple-50 border-purple-100",
};

const DEFAULT_AGENDA: Omit<AgendaItem, "id">[] = [
  {
    title: 'Gerakan "Rabu Asri" Kelurahan',
    category: "Program Lingkungan",
    categoryColor: "blue",
    schedule: "Setiap Rabu",
    description:
      "Kerja bakti kebersihan drainase, penghijauan lingkungan, dan penataan pemukiman bersama RT/RW se-Kelurahan Banjar Agung.",
    timeLocation: "07:30 WIB - Selesai \u2022 Seluruh Lingkungan RW",
    active: true,
    order: 0,
  },
  {
    title: "Penyaluran Beras Bantuan Pangan Kemensos RI",
    category: "Bantuan Sosial",
    categoryColor: "emerald",
    schedule: "Sesuai Jadwal",
    description:
      "Penyaluran Cadangan Beras Pangan Pemerintah (CPP) bagi Keluarga Penerima Manfaat (KPM) warga Kelurahan Banjar Agung.",
    timeLocation: "Aula Kantor Kelurahan Banjar Agung",
    active: true,
    order: 1,
  },
  {
    title: "Posyandu Balita & Lansia Puskesmas Banjar Agung",
    category: "Kesehatan Warga",
    categoryColor: "amber",
    schedule: "Jadwal Posyandu",
    description:
      "Pemeriksaan kesehatan tumbuh kembang balita, imunisasi dasar, penimbangan, dan pemeriksaan tekanan darah lansia.",
    timeLocation: "08:30 - 11:30 WIB \u2022 Posyandu BAP & Lingkungan RW",
    active: true,
    order: 2,
  },
];

export default function Home() {
  const [siteConfig, setSiteConfig] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [latestNews, setLatestNews] = useState<LandingNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [agendaItems, setAgendaItems] = useState<Omit<AgendaItem, "id">[]>(DEFAULT_AGENDA);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [stats, setStats] = useState<LandingStats>({
    total: 0,
    kk: 0,
    male: 0,
    female: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const config = await getSiteSettings();
        setSiteConfig(config);
      } catch (err) {
        console.error("Error loading site config:", err);
      }
    };
    fetchSiteConfig();
  }, []);

  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const q = query(collection(db, "agenda"), orderBy("order", "asc"), limit(3));
        const snap = await getDocs(q);
        const activeItems = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<AgendaItem, "id">) }))
          .filter((item) => item.active)
          .slice(0, 3);
        if (activeItems.length > 0) {
          setAgendaItems(activeItems);
        }
      } catch {
      } finally {
        setAgendaLoading(false);
      }
    };
    fetchAgenda();
  }, []);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const q = query(
          collection(db, "news"),
          orderBy("date", "desc"),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<LandingNewsItem, "id">),
        }));
        setLatestNews(data);
      } catch (error) {
        console.error("Error fetching latest news for landing:", error);
      } finally {
        setNewsLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const residentsRef = collection(db, "residents");

        const totalSnap = await getCountFromServer(residentsRef);
        const total = totalSnap.data().count;

        const maleQuery = query(residentsRef, where("gender", "==", "Laki-laki"));
        const maleSnap = await getCountFromServer(maleQuery);
        const male = maleSnap.data().count;

        const femaleQuery = query(residentsRef, where("gender", "==", "Perempuan"));
        const femaleSnap = await getCountFromServer(femaleQuery);
        const female = femaleSnap.data().count;

        const kkApprox = Math.max(1, Math.floor(total / 3));

        setStats({
          total,
          kk: kkApprox,
          male,
          female,
        });
      } catch (error) {
        console.error("Error fetching stats for landing:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchLatestNews();
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-12 pb-16">
      <section className="relative py-12 md:py-16 bg-[#f0f4f9] border-b border-slate-200">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-white text-[#1b365d] border border-slate-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {siteConfig.heroBadge}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.2]">
                {siteConfig.heroTitle}
              </h1>

              <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-xl">
                {siteConfig.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/layanan#alur">
                  <Button size="lg" className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold rounded-lg shadow-xs">
                    Alur Permohonan Surat <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pengaduan#alur">
                  <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold rounded-lg">
                    Alur Pengaduan Masyarakat
                  </Button>
                </Link>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-5 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Bebas Biaya Retribusi
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#1b365d]" />
                  Standar Proses 1 - 2 Hari Kerja
                </div>
                <div className="flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-[#c9971c]" />
                  Nomor Tiket Terverifikasi
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1b365d]/10 text-[#1b365d] flex items-center justify-center font-bold">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Kantor Kelurahan</h4>
                      <p className="text-xs text-slate-500">Pusat Layanan Terpadu</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    siteConfig.counterStatus === "Buka" 
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200" 
                      : "text-amber-700 bg-amber-50 border border-amber-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${siteConfig.counterStatus === "Buka" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    Loket {siteConfig.counterStatus === "Buka" ? "Dibuka" : "Ditutup"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#1b365d]" />
                      <span>Loket Fisik</span>
                    </div>
                    <span className="font-bold text-slate-800 text-sm block">{siteConfig.counterHours}</span>
                    <span className="text-[11px] text-slate-500 block">{siteConfig.counterDays}</span>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Layanan Mandiri</span>
                    </div>
                    <span className="font-bold text-[#1b365d] text-sm block">Online 24 Jam</span>
                    <span className="text-[11px] text-emerald-700/80 block">Dari rumah / gawai</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1b365d] shrink-0" />
                    <span className="truncate text-slate-600 font-medium">{siteConfig.villageAddress}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-600">WhatsApp Resmi:</span>
                    </div>
                    <a
                      href={`https://wa.me/${siteConfig.villagePhone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                    >
                      {siteConfig.villagePhone}
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: "Pelayanan Surat",
              desc: "Permohonan online SKTM, Surat Domisili, SKU, dan surat pengantar administrasi.",
              href: "/layanan",
              badge: "Layanan Mandiri",
              icon: FileText,
            },
            {
              title: "Informasi & Data",
              desc: "Infografis statistik kependudukan, data demografi, dan tautan layanan resmi pemerintah terkait.",
              href: "/data",
              badge: "Transparansi",
              icon: Users,
            },
            {
              title: "Pengaduan Warga",
              desc: "Kanal penyampaian keluhan fasilitas umum, keamanan, dan tindak lanjut petugas.",
              href: "/pengaduan",
              badge: "Aspirasi Publik",
              icon: Phone,
            },
            {
              title: "Profil",
              desc: "Susunan aparatur kelurahan, wilayah perumahan, visi misi, dan fasilitas umum.",
              href: "/profil",
              badge: "Informasi Wilayah",
              icon: Building,
            },
          ].map((item, index) => (
            <Link key={index} href={item.href}>
              <div className="group h-full bg-white border border-slate-200 rounded-xl p-5 hover:border-[#1b365d] hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col gap-3.5">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-[#1b365d]/10 text-[#1b365d] flex items-center justify-center border border-[#1b365d]/15">
                    <item.icon size={22} />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.badge}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-[#1b365d] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#1b365d]">
                  Buka layanan <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-slate-200 py-14">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1b365d] bg-slate-100 border border-slate-200 px-3 py-1 rounded-md inline-block">
              Tata Cara Pelayanan
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Alur Pengajuan Surat Keterangan Online
            </h2>
            <p className="text-slate-500 text-xs md:text-sm">
              Ikuti tahapan resmi permohonan surat keterangan untuk mempercepat verifikasi berkas oleh petugas kelurahan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Pilih Jenis Dokumen",
                desc: "Pilih jenis surat keterangan yang diperlukan pada menu Layanan Surat dan periksa kelengkapan persyaratan berkas yang ditentukan.",
                icon: FileText,
              },
              {
                step: "02",
                title: "Pengisian Formulir Permohonan",
                desc: "Isi data pemohon sesuai KTP/KK, keperluan surat secara jelas, dan nomor WhatsApp aktif untuk menerima kode verifikasi tiket.",
                icon: Inbox,
              },
              {
                step: "03",
                title: "Verifikasi & Pengambilan Berkas",
                desc: "Petugas kelurahan memproses berkas (1 - 2 hari kerja). Surat dapat diambil di loket kelurahan atau diunduh sesuai ketentuan.",
                icon: FileCheck2,
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50/70 border border-slate-200 rounded-xl p-6 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#1b365d] text-white flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <item.icon className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/layanan">
              <Button className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold rounded-lg">
                Mulai Permohonan Surat Sekarang <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-12">
        <div className="bg-[#1b365d] text-white rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-2.5 py-0.5 rounded">
                Kontak Cepat Wilayah
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-2">
                Pusat Bantuan & Kontak Keamanan / Kesehatan Terpadu
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Gunakan kontak resmi ini jika terjadi musibah, situasi medis darurat, atau gangguan ketenteraman lingkungan.
              </p>
            </div>
            <div className="shrink-0">
              <span className="text-xs font-mono font-bold bg-white text-[#1b365d] px-3.5 py-2 rounded-lg shadow-xs inline-block">
                Hotline Bebas Pulsa: {siteConfig.emergencyHotline}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold">
                <HeartPulse className="h-4 w-4 text-emerald-400" />
                <span>Puskesmas Banjar Agung</span>
              </div>
              <div className="font-mono font-bold text-sm text-white">{siteConfig.emergencyPuskesmas}</div>
              <p className="text-[11px] text-blue-200">Pelayanan kesehatan primer & rujukan medis wilayah Cipocok Jaya.</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold">
                <ShieldAlert className="h-4 w-4 text-blue-300" />
                <span>Polsek Cipocok Jaya (Bhabinkamtibmas)</span>
              </div>
              <div className="font-mono font-bold text-sm text-white">{siteConfig.emergencyPolsek}</div>
              <p className="text-[11px] text-blue-200">Keamanan & ketertiban masyarakat Kelurahan Banjar Agung.</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>Koramil Cipocok Jaya (Babinsa)</span>
              </div>
              <div className="font-mono font-bold text-sm text-white">{siteConfig.emergencyKoramil}</div>
              <p className="text-[11px] text-blue-200">Pembinaan teritorial dan kesiapsiagaan lingkungan.</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold">
                <PhoneCall className="h-4 w-4 text-red-400" />
                <span>Damkar & BPBD Kota Serang</span>
              </div>
              <div className="font-mono font-bold text-sm text-white">{siteConfig.emergencyDamkar}</div>
              <p className="text-[11px] text-blue-200">Penanganan kebakaran, pohon tumbang, dan bencana daerah.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Warta & Pengumuman Resmi</h2>
            <p className="text-xs text-slate-500 mt-0.5">Informasi program kelurahan, edaran pemerintah, dan kegiatan sosial kemasyarakatan.</p>
          </div>
          <Link href="/berita">
            <Button variant="outline" size="sm" className="rounded-lg text-xs border-slate-300">
              Lihat Seluruh Warta <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border border-slate-200">
                <div className="h-40 bg-slate-200 w-full animate-pulse" />
                <CardHeader>
                  <div className="h-3 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-5/6 bg-slate-200 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : latestNews.length === 0 ? (
            <Card className="col-span-1 md:col-span-3 border border-slate-200">
              <CardContent className="py-10 text-center text-slate-500 text-sm">
                Belum ada pengumuman yang dipublikasikan.
              </CardContent>
            </Card>
          ) : (
            latestNews.map((item) => (
              <Card key={item.id} className="overflow-hidden border border-slate-200 flex flex-col group hover:border-[#1b365d] transition-colors">
                <div className="h-44 bg-slate-100 w-full overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(item as any).imageUrl || "/images/default-news.jpg"}
                    alt={item.title || "Berita Kelurahan"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/default-news.jpg";
                    }}
                  />
                  {item.category && (
                    <span className="absolute top-2.5 left-2.5 bg-[#1b365d]/90 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold shadow-xs">
                      {item.category}
                    </span>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {item.date
                        ? new Date(item.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 text-base font-bold">
                    <Link href={`/berita/${item.id}`} className="hover:text-[#1b365d] transition-colors">
                      {item.title || "Pengumuman Resmi"}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-0">
                  <CardDescription className="line-clamp-2 mb-3 text-xs text-slate-500">
                    {stripHtml(item.content) || "Tidak ada ringkasan teks."}
                  </CardDescription>
                  <Link href={`/berita/${item.id}`} className="mt-auto text-xs font-semibold text-[#1b365d] hover:underline flex items-center gap-1">
                    Baca dokumen lengkap <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-12">
        <div className="border border-slate-200 rounded-2xl p-6 md:p-8 bg-slate-50 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#1b365d] uppercase tracking-wider bg-white border border-slate-200 px-2.5 py-0.5 rounded">
                Agenda Kegiatan
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mt-2">
                Program Kerja & Jadwal Pelayanan Masyarakat
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Agenda resmi kegiatan lingkungan, penyaluran program bantuan sosial, dan layanan kesehatan berkala.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agendaLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                      <div className="h-3 w-16 bg-slate-100 rounded" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-full bg-slate-100 rounded" />
                    <div className="h-3 w-5/6 bg-slate-100 rounded" />
                  </div>
                ))
              : agendaItems.map((item, idx) => (
                  <div key={(item as AgendaItem).id || idx} className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                          AGENDA_BADGE[item.categoryColor] || "text-slate-700 bg-slate-50 border-slate-200"
                        }`}
                      >
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{item.schedule}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    {item.timeLocation && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> {item.timeLocation}
                      </div>
                    )}
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 border-t border-slate-200">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1b365d] bg-slate-100 border border-slate-200 px-3 py-1 rounded-md inline-block">
                Keterbukaan Informasi Publik
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Transparansi Data Kependudukan Kelurahan
              </h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Pemerintah Kelurahan Banjar Agung menyajikan statistik kependudukan resmi secara transparan dan akuntabel guna mendukung perencanaan program wilayah serta ketepatan penyaluran pelayanan sosial bagi warga.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="text-2xl md:text-3xl font-bold text-[#1b365d] mb-1 font-mono">
                    {statsLoading ? (
                      <span className="inline-block h-7 w-20 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      stats.total.toLocaleString("id-ID")
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-600">Total Jiwa Terdaftar</div>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="text-2xl md:text-3xl font-bold text-[#1b365d] mb-1 font-mono">
                    {statsLoading ? (
                      <span className="inline-block h-7 w-16 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      stats.kk.toLocaleString("id-ID")
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-600">Kepala Keluarga (KK)</div>
                </div>
              </div>

              <div className="pt-1">
                <Link href="/data">
                  <Button className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold rounded-lg text-xs">
                    Lihat Halaman Informasi & Data <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1b365d] text-white flex items-center justify-center font-bold">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Distribusi Penduduk Wilayah</h4>
                      <p className="text-[11px] text-slate-500">Berdasarkan Data Kependudukan Aktif</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                    Data Terverifikasi
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-800">
                      <span>Penduduk Laki-laki</span>
                      <span className="font-mono text-[#1b365d] font-bold">
                        {stats.male.toLocaleString("id-ID")} jiwa
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1b365d] h-full rounded-full"
                        style={{
                          width: `${stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 50}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-800">
                      <span>Penduduk Perempuan</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {stats.female.toLocaleString("id-ID")} jiwa
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{
                          width: `${stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 50}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Pelayanan Administrasi & Surat Menyurat 100% Bebas Biaya</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
                      <Clock className="h-4 w-4 text-[#1b365d] shrink-0" />
                      <span>Standar Waktu Verifikasi Berkas 1 - 2 Hari Kerja</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Dikelola resmi oleh Seksi Pelayanan & Administrasi Kelurahan Banjar Agung.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
