"use client";

/**
 * @layer Frontend (Public / Warga)
 * @role Informasi & Statistik Terbuka
 * @access Public / Warga
 * @description Menyajikan infografis data kependudukan, transparansi anggaran, fasilitas publik, dan tautan eksternal.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, Briefcase, HeartHandshake, ExternalLink, Globe, ShieldCheck, HeartPulse, Banknote, BookOpen, MapPin, Calendar, ArrowRight, BarChart3, PieChart, TrendingUp, LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { stripHtml } from "@/lib/utils";
import { PageBanner } from "@/components/layout/page-banner";
import { apiList } from "@/lib/api";
import { getSiteSettings, DEFAULT_SITE_SETTINGS, ExternalLinkItem } from "@/lib/site-config";

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  "Pemerintah Wilayah": { icon: MapPin, color: "text-[#1b365d]", bg: "bg-[#1b365d]/10", border: "border-[#1b365d]/20" },
  "Bantuan Sosial & Kesejahteraan": { icon: Banknote, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Kependudukan & Administrasi": { icon: BookOpen, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  "Kesehatan": { icon: HeartPulse, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  "Layanan Digital Nasional": { icon: Globe, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
};


type AgeGroups = {
  children: number;
  adults: number;
  seniors: number;
};

type CountEntry = {
  name: string;
  count: number;
};

type DataStats = {
  total: number;
  male: number;
  female: number;
  kk: number;
  ageGroups: AgeGroups;
  occupations: CountEntry[];
  religions: CountEntry[];
  educations: CountEntry[];
};

const DEFAULT_EMPTY_STATS: DataStats = {
  total: 0,
  male: 0,
  female: 0,
  kk: 0,
  ageGroups: {
    children: 0,
    adults: 0,
    seniors: 0,
  },
  educations: [],
  occupations: [],
  religions: [],
};
interface ResidentRecord {
  gender?: string;
  birthDate?: string;
  occupation?: string;
  agama?: string;
  education?: string;
  status?: string;
  statusKeluarga?: string;
}


export default function DataPage() {
  const [stats, setStats] = useState<DataStats>(DEFAULT_EMPTY_STATS);
  const [loading, setLoading] = useState(false);
  const [externalLinks, setExternalLinks] = useState<ExternalLinkItem[]>(DEFAULT_SITE_SETTINGS.externalLinks || []);
  const [demographyMeta, setDemographyMeta] = useState({
    period: DEFAULT_SITE_SETTINGS.demography?.updatedPeriod || "Semester II Tahun 2026",
    source: DEFAULT_SITE_SETTINGS.demography?.source || "Rekapitulasi Monografi BPS & Kelurahan Banjar Agung",
  });

  type NewsItem = {
    id: string;
    title?: string;
    content?: string;
    date?: string;
    category?: string;
    imageUrl?: string;
  };
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const rows = await apiList("news", { orderBy: "date", order: "desc", limit: 3 });
        const mapped = (rows || []).map((row) => ({
          id: String(row.id),
          title: String(row.title || ""),
          content: String(row.content || ""),
          date: String(row.date || ""),
          category: String(row.category || ""),
          imageUrl: String(row.image_url || ""),
        }));
        setLatestNews(mapped);
      } catch (err) {
        console.error("Error fetching news in data page:", err);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, []);
  // Set page title
  useEffect(() => {
    document.title = "Data Penduduk | Kelurahan";
  }, []);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        let residents: ResidentRecord[] = [];
        try {
          const apiData = await apiList("residents");
          if (Array.isArray(apiData) && apiData.length > 0) {
            residents = apiData.map((row: Record<string, unknown>) => ({
              gender: row.gender as string | undefined,
              birthDate: row.birth_date as string | undefined,
              occupation: row.occupation as string | undefined,
              agama: row.agama as string | undefined,
              education: row.education as string | undefined,
              status: row.status as string | undefined,
              statusKeluarga: row.status_keluarga as string | undefined,
            }));
          }
        } catch {
          // ignore
        }

        // Ambil konfigurasi profil & demografi resmi dari site settings
        let siteConfig = null;
        try {
          siteConfig = await getSiteSettings();
          if (siteConfig.demography) {
            setDemographyMeta({
              period: siteConfig.demography.updatedPeriod,
              source: siteConfig.demography.source,
            });
          }
          if (siteConfig.externalLinks && siteConfig.externalLinks.length > 0) {
            setExternalLinks(siteConfig.externalLinks);
          }
        } catch {
          // ignore
        }

        // Jika belum ada data penduduk di database,
        // gunakan data statistik agregat yang dikelola admin di Settings > Demografi
        if (residents.length === 0) {
          const demo = siteConfig?.demography || DEFAULT_SITE_SETTINGS.demography!;
          setStats({
            total: demo.total,
            male: demo.male,
            female: demo.female,
            kk: demo.kk,
            ageGroups: {
              children: demo.ageChildren,
              adults: demo.ageAdults,
              seniors: demo.ageSeniors,
            },
            educations: [],
            occupations: [],
            religions: [],
          });
          setLoading(false);
          return;
        }

        const total = residents.length;
        let male = 0;
        let female = 0;
        let kkCount = 0;

        const ageGroups: AgeGroups = { children: 0, adults: 0, seniors: 0 };
        const occupationMap = new Map<string, number>();
        const religionMap = new Map<string, number>();
        const educationMap = new Map<string, number>();

        const now = new Date();

        residents.forEach((r) => {
          if (r.gender === "Laki-laki") male += 1;
          if (r.gender === "Perempuan") female += 1;

          if (typeof r.birthDate === "string") {
            const birth = new Date(r.birthDate);
            if (!Number.isNaN(birth.getTime())) {
              let age = now.getFullYear() - birth.getFullYear();
              const m = now.getMonth() - birth.getMonth();
              if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                age -= 1;
              }
              if (age <= 17) ageGroups.children += 1;
              else if (age <= 59) ageGroups.adults += 1;
              else ageGroups.seniors += 1;
            }
          }

          if (r.occupation) {
            const key = String(r.occupation);
            occupationMap.set(key, (occupationMap.get(key) || 0) + 1);
          }

          const agamaKey = r.agama ? String(r.agama) : "Tidak diisi";
          religionMap.set(agamaKey, (religionMap.get(agamaKey) || 0) + 1);

          if (r.education) {
            const key = String(r.education);
            educationMap.set(key, (educationMap.get(key) || 0) + 1);
          }

          if (r.status === "Kepala Keluarga" || r.statusKeluarga === "Kepala Keluarga") {
            kkCount += 1;
          }
        });

        if (kkCount === 0 && total > 0) {
          kkCount = Math.max(1, Math.floor(total / 3));
        }

        const mapToArray = (m: Map<string, number>): CountEntry[] =>
          Array.from(m.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        setStats({
          total,
          male,
          female,
          kk: kkCount,
          ageGroups,
          occupations: mapToArray(occupationMap).slice(0, 6),
          religions: mapToArray(religionMap),
          educations: mapToArray(educationMap).slice(0, 6),
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(DEFAULT_EMPTY_STATS);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalAge = stats.ageGroups.children + stats.ageGroups.adults + stats.ageGroups.seniors || 1;
  const malePercent = stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 50;
  const femalePercent = stats.total > 0 ? 100 - malePercent : 50;

  return (
    <div className="space-y-10 pb-16">
      <PageBanner pageKey="data" />

      <div className="container mx-auto px-6 md:px-12 space-y-12">
        {/* INFOGRAFIS KEPENDUDUKAN */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#1b365d]/10 text-[#1b365d] flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Infografis Data Kependudukan</h2>
              <p className="text-xs text-slate-500">
                Statistik resmi Kelurahan Banjar Agung • {demographyMeta.period} ({demographyMeta.source})
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Total Penduduk", value: stats.total.toLocaleString("id-ID"), sub: "Jiwa terdaftar", icon: Users, color: "text-[#1b365d]", bg: "bg-[#1b365d]/10" },
              { title: "Kepala Keluarga", value: stats.kk.toLocaleString("id-ID"), sub: "Kepala Keluarga", icon: UserCheck, color: "text-emerald-700", bg: "bg-emerald-50" },
              { title: "Laki-laki", value: stats.male.toLocaleString("id-ID"), sub: `${malePercent}% dari total`, icon: Users, color: "text-blue-700", bg: "bg-blue-50" },
              { title: "Perempuan", value: stats.female.toLocaleString("id-ID"), sub: `${femalePercent}% dari total`, icon: Users, color: "text-rose-700", bg: "bg-rose-50" },
            ].map((item, index) => (
              <Card key={index} className="border border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.title}</p>
                    <h3 className="text-2xl font-extrabold mt-0.5 text-slate-900 font-mono">
                      {loading ? <span className="inline-block h-7 w-16 bg-slate-200 rounded animate-pulse" /> : item.value}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon size={22} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gender Proportion Bar */}
          <Card className="border border-slate-200 shadow-xs mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">Komposisi Jenis Kelamin</CardTitle>
              <CardDescription className="text-xs">Rasio perbandingan jumlah penduduk laki-laki dan perempuan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-7 w-full rounded-full overflow-hidden flex bg-slate-100">
                  <div
                    style={{ width: `${malePercent}%` }}
                    className="bg-[#1b365d] flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
                  >
                    {malePercent}% Laki-laki
                  </div>
                  <div
                    style={{ width: `${femalePercent}%` }}
                    className="bg-rose-500 flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
                  >
                    {femalePercent}% Perempuan
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1b365d]" /> Laki-laki ({stats.male.toLocaleString("id-ID")} jiwa)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Perempuan ({stats.female.toLocaleString("id-ID")} jiwa)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographic Breakdown Grids dengan Grafik Visual Lengkap */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* 1. Grafik Donut SVG & Piramida Kelompok Usia */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <PieChart className="h-5 w-5 text-amber-500" /> Grafik Komposisi Kelompok Usia
                  </CardTitle>
                  <CardDescription className="text-xs">Distribusi generasi anak, usia produktif, dan lanjut usia</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                {(() => {
                  const pctChildren = Math.round((stats.ageGroups.children / totalAge) * 100) || 0;
                  const pctAdults = Math.round((stats.ageGroups.adults / totalAge) * 100) || 0;
                  const pctSeniors = Math.max(0, 100 - pctChildren - pctAdults);
                  const circ = 251.3;
                  const strokeChildren = (pctChildren / 100) * circ;
                  const strokeAdults = (pctAdults / 100) * circ;
                  const strokeSeniors = (pctSeniors / 100) * circ;
                  const offsetAdults = -strokeChildren;
                  const offsetSeniors = -(strokeChildren + strokeAdults);

                  return (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Donut SVG Ring */}
                      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          {/* Background Ring */}
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                          {/* Segmen Anak-anak (Amber) */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="14"
                            strokeDasharray={`${strokeChildren} ${circ}`}
                            strokeDashoffset="0"
                            className="transition-all duration-700"
                          />
                          {/* Segmen Usia Produktif (Biru Navy) */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#1b365d"
                            strokeWidth="14"
                            strokeDasharray={`${strokeAdults} ${circ}`}
                            strokeDashoffset={offsetAdults}
                            className="transition-all duration-700"
                          />
                          {/* Segmen Lansia (Emerald) */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#10b981"
                            strokeWidth="14"
                            strokeDasharray={`${strokeSeniors} ${circ}`}
                            strokeDashoffset={offsetSeniors}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">Total</span>
                          <span className="text-base font-extrabold text-slate-800 font-mono leading-none">
                            {stats.total.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[9px] text-slate-400">Jiwa</span>
                        </div>
                      </div>

                      {/* Legend & Breakdown Bars */}
                      <div className="flex-1 w-full space-y-3">
                        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Anak-anak (0 - 17 th)</span>
                              <span className="text-[10px] text-slate-500">{stats.ageGroups.children.toLocaleString("id-ID")} jiwa</span>
                            </div>
                          </div>
                          <span className="text-sm font-extrabold font-mono text-amber-700">{pctChildren}%</span>
                        </div>

                        <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-[#1b365d] shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Usia Produktif (18 - 59 th)</span>
                              <span className="text-[10px] text-slate-500">{stats.ageGroups.adults.toLocaleString("id-ID")} jiwa</span>
                            </div>
                          </div>
                          <span className="text-sm font-extrabold font-mono text-[#1b365d]">{pctAdults}%</span>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Lanjut Usia (≥ 60 th)</span>
                              <span className="text-[10px] text-slate-500">{stats.ageGroups.seniors.toLocaleString("id-ID")} jiwa</span>
                            </div>
                          </div>
                          <span className="text-sm font-extrabold font-mono text-emerald-700">{pctSeniors}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Bonus Demografi: Mayoritas warga berada di usia kerja aktif
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 2. Grafik Batang Vertikal: Capaian Jenjang Pendidikan */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <BarChart3 className="h-5 w-5 text-indigo-600" /> Grafik Batang Jenjang Pendidikan
                  </CardTitle>
                  <CardDescription className="text-xs">Visualisasi kolom capaian kualifikasi pendidikan formal warga</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {stats.educations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Belum ada data pendidikan.</p>
                ) : (
                  <div>
                    {/* Visual Vertical Columns */}
                    <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-1 relative">
                      {/* Grid garis pemandu horizontal */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                        <div className="border-b border-dashed border-slate-200 w-full h-0" />
                        <div className="border-b border-dashed border-slate-200 w-full h-0" />
                        <div className="border-b border-dashed border-slate-200 w-full h-0" />
                        <div className="border-b border-slate-300 w-full h-0" />
                      </div>

                      {(() => {
                        const maxEd = Math.max(...stats.educations.map((e) => e.count), 1);
                        return stats.educations.map((ed, idx) => {
                          const heightPct = Math.max(16, Math.round((ed.count / maxEd) * 100));
                          const sharePct = stats.total > 0 ? Math.round((ed.count / stats.total) * 100) : 0;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative z-10 group">
                              <span className="text-[10px] font-bold font-mono text-indigo-700 opacity-90 group-hover:opacity-100 mb-1">
                                {sharePct}%
                              </span>
                              <div
                                style={{ height: `${heightPct}%` }}
                                className="w-full max-w-[42px] bg-gradient-to-t from-[#1b365d] to-indigo-500 rounded-t-lg shadow-xs group-hover:from-indigo-600 group-hover:to-indigo-400 transition-all duration-300 flex items-center justify-center"
                              >
                                <span className="text-[9px] font-bold text-white/80 hidden sm:inline">
                                  {ed.count}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 mt-2 text-center truncate max-w-full" title={ed.name}>
                                {ed.name}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <p className="text-[11px] text-slate-500 text-center mt-3 pt-2 border-t border-slate-100">
                      Grafik kolom vertikal diperbarui otomatis sesuai registrasi data kependudukan Kelurahan Banjar Agung.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Sektor Mata Pencaharian Terbanyak (Ranking Bar) */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <Briefcase className="h-5 w-5 text-blue-600" /> Sektor Pekerjaan Utama
                  </CardTitle>
                  <CardDescription className="text-xs">Peringkat 6 lapangan usaha dan profesi terbesar warga</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {stats.occupations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Belum ada data pekerjaan.</p>
                ) : (
                  stats.occupations.map((occ, idx) => {
                    const maxCount = stats.occupations[0]?.count || 1;
                    const widthPct = Math.round((occ.count / maxCount) * 100);
                    const rankColors = ["bg-amber-400 text-slate-950", "bg-slate-300 text-slate-800", "bg-amber-600 text-white", "bg-slate-100 text-slate-600", "bg-slate-100 text-slate-600", "bg-slate-100 text-slate-600"];
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${rankColors[idx] || "bg-slate-100"}`}>
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800">{occ.name}</span>
                          </div>
                          <span className="text-slate-600 font-mono font-bold">{occ.count.toLocaleString("id-ID")} jiwa</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-[#1b365d] to-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${widthPct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* 4. Komposisi Keagamaan (Segmented Bar & Kartu) */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <HeartHandshake className="h-5 w-5 text-emerald-600" /> Kerukunan & Komposisi Agama
                  </CardTitle>
                  <CardDescription className="text-xs">Keberagaman keyakinan warga di wilayah kelurahan</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {stats.religions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Belum ada data agama.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Multi-segment Colored Strip Bar */}
                    <div className="h-5 w-full rounded-full overflow-hidden flex bg-slate-100 p-0.5 border border-slate-200">
                      {stats.religions.map((rel, idx) => {
                        const pct = stats.total > 0 ? (rel.count / stats.total) * 100 : 0;
                        const colors = ["bg-emerald-600", "bg-sky-500", "bg-indigo-500", "bg-amber-500", "bg-rose-500"];
                        if (pct <= 0) return null;
                        return (
                          <div
                            key={idx}
                            style={{ width: `${Math.max(2, pct)}%` }}
                            className={`${colors[idx % colors.length]} h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                            title={`${rel.name}: ${Math.round(pct)}%`}
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {stats.religions.map((rel, idx) => {
                        const pct = stats.total > 0 ? Math.round((rel.count / stats.total) * 100) : 0;
                        const borderColors = ["border-emerald-300 bg-emerald-50/50", "border-sky-300 bg-sky-50/50", "border-indigo-300 bg-indigo-50/50", "border-amber-300 bg-amber-50/50", "border-rose-300 bg-rose-50/50"];
                        const dotColors = ["bg-emerald-600", "bg-sky-500", "bg-indigo-500", "bg-amber-500", "bg-rose-500"];
                        return (
                          <div key={idx} className={`p-2.5 rounded-xl border ${borderColors[idx % borderColors.length]} flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${dotColors[idx % dotColors.length]}`} />
                              <span className="text-xs font-bold text-slate-800">{rel.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold font-mono text-slate-900 block">{pct}%</span>
                              <span className="text-[10px] text-slate-500 font-mono">{rel.count.toLocaleString("id-ID")} jiwa</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </section>

        {/* WARTA & PENGUMUMAN RESMI */}
        <section id="warta" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#1b365d] uppercase tracking-wider bg-[#1b365d]/10 border border-[#1b365d]/20 px-2.5 py-0.5 rounded">
                Warta & Pengumuman
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mt-2">
                Kabar & Pengumuman Resmi Kelurahan
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Informasi publik terkini, siaran pers, dan agenda resmi dari aparatur Kelurahan Banjar Agung
              </p>
            </div>
            <Link href="/berita">
              <Button variant="outline" size="sm" className="font-semibold text-xs border-slate-300 text-slate-700 hover:text-[#1b365d] hover:border-[#1b365d] shrink-0">
                Lihat Seluruh Warta <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 animate-pulse">
                  <div className="w-full h-40 bg-slate-100 rounded-lg" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              ))
            ) : latestNews.length === 0 ? (
              <div className="col-span-full border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                Belum ada warta resmi yang dipublikasikan saat ini.
              </div>
            ) : (
              latestNews.map((item) => (
                <Card key={item.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col bg-white">
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Warta"}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 text-xs">
                        Warta Kelurahan
                      </div>
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
                      Baca selengkapnya <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* TAUTAN LAYANAN EKSTERNAL */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tautan Layanan Resmi Pemerintah</h2>
              <p className="text-xs text-slate-500">
                Kumpulan portal dan layanan digital pemerintah yang relevan bagi warga — dikurasi oleh Kelurahan Banjar Agung
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {(() => {
              // Kelompokkan tautan berdasarkan kategori
              const map = new Map<string, ExternalLinkItem[]>();
              externalLinks.forEach((item) => {
                const cat = item.category || "Layanan Lainnya";
                if (!map.has(cat)) map.set(cat, []);
                map.get(cat)!.push(item);
              });
              const grouped = Array.from(map.entries()).map(([category, links]) => {
                const style = CATEGORY_STYLES[category] || {
                  icon: Globe,
                  color: "text-[#1b365d]",
                  bg: "bg-[#1b365d]/10",
                  border: "border-[#1b365d]/20",
                };
                return { category, ...style, links };
              });

              return grouped.map((section, sIdx) => (
                <div key={sIdx}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-md ${section.bg} ${section.color} flex items-center justify-center`}>
                      <section.icon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">{section.category}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.links.map((link, lIdx) => (
                      <a
                        key={link.id || lIdx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group block bg-white border ${section.border} rounded-xl p-4 hover:shadow-md transition-all duration-150`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${section.bg} ${section.color} border ${section.border}`}>
                                {link.badge || "Resmi"}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#1b365d] transition-colors leading-snug">
                              {link.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {link.desc}
                            </p>
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono text-slate-400 truncate">
                              <Globe className="h-2.5 w-2.5 shrink-0" />
                              {link.url.replace(/^https?:\/\//, "")}
                            </span>
                          </div>
                          <ExternalLink className={`h-4 w-4 shrink-0 mt-0.5 ${section.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-800">Tentang tautan di halaman ini</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Seluruh tautan yang tersedia di halaman ini merupakan portal resmi milik instansi pemerintah terkait.
                Kelurahan Banjar Agung tidak bertanggung jawab atas perubahan konten atau kebijakan di situs eksternal tersebut.
                Harap pastikan Anda mengakses tautan dari perangkat yang aman.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
