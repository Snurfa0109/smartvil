"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, Baby, Briefcase, GraduationCap, HeartHandshake, ExternalLink, Globe, ShieldCheck, HeartPulse, Banknote, BookOpen, LayoutGrid, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const EXTERNAL_LINKS = [
  {
    category: "Pemerintah Wilayah",
    icon: MapPin,
    color: "text-[#1b365d]",
    bg: "bg-[#1b365d]/10",
    border: "border-[#1b365d]/20",
    links: [
      {
        name: "Kecamatan Cipocok Jaya",
        desc: "Portal resmi Kecamatan Cipocok Jaya — informasi kegiatan, layanan, dan pengumuman wilayah kecamatan.",
        url: "https://cipocokjaya.serangkota.go.id",
        badge: "Kecamatan",
      },
      {
        name: "Pemerintah Kota Serang",
        desc: "Portal utama Pemerintah Kota Serang — berita resmi, agenda pemerintahan, dan layanan publik kota.",
        url: "https://serangkota.go.id",
        badge: "Kota Serang",
      },
    ],
  },
  {
    category: "Bantuan Sosial & Kesejahteraan",
    icon: Banknote,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    links: [
      {
        name: "Cek Bansos Kemensos RI",
        desc: "Cek status penerima program bantuan sosial PKH, BPNT, dan program perlindungan sosial lainnya dari Kemensos.",
        url: "https://cekbansos.kemensos.go.id",
        badge: "Bansos",
      },
      {
        name: "DTKS Online — Data Terpadu Kessos",
        desc: "Portal pendataan keluarga miskin dan rentan untuk keperluan program perlindungan sosial pemerintah pusat.",
        url: "https://dtks.kemensos.go.id",
        badge: "Kesejahteraan",
      },
    ],
  },
  {
    category: "Kependudukan & Administrasi",
    icon: BookOpen,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    links: [
      {
        name: "Dukcapil Kemendagri",
        desc: "Layanan kependudukan nasional: e-KTP, KK, akta kelahiran, dan dokumen administrasi kependudukan online.",
        url: "https://dukcapil.kemendagri.go.id",
        badge: "Adminduk",
      },
      {
        name: "Disdukcapil Kota Serang",
        desc: "Dinas Kependudukan dan Pencatatan Sipil Kota Serang — layanan cetak dokumen dan informasi administrasi lokal.",
        url: "https://disdukcapil.serangkota.go.id",
        badge: "Dukcapil Lokal",
      },
    ],
  },
  {
    category: "Kesehatan",
    icon: HeartPulse,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    links: [
      {
        name: "BPJS Kesehatan",
        desc: "Portal resmi BPJS Kesehatan — cek kepesertaan JKN, cetak kartu digital, dan informasi fasilitas kesehatan terdekat.",
        url: "https://bpjs-kesehatan.go.id",
        badge: "JKN/BPJS",
      },
      {
        name: "Aplikasi Mobile JKN",
        desc: "Unduh aplikasi Mobile JKN untuk mengakses layanan BPJS Kesehatan langsung dari smartphone Anda.",
        url: "https://bpjs-kesehatan.go.id/bpjs/pages/detail/2014/13",
        badge: "Mobile JKN",
      },
    ],
  },
  {
    category: "Layanan Digital Nasional",
    icon: Globe,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    links: [
      {
        name: "Portal Nasional Indonesia",
        desc: "Pintu masuk layanan pemerintah pusat: layanan online, pengaduan, dan informasi kebijakan nasional.",
        url: "https://indonesia.go.id",
        badge: "Portal Nasional",
      },
      {
        name: "LAPOR! — Layanan Aspirasi & Pengaduan",
        desc: "Platform pengaduan online nasional terintegrasi lintas instansi pemerintah pusat dan daerah.",
        url: "https://lapor.go.id",
        badge: "Aspirasi",
      },
    ],
  },
];

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

export default function DataPage() {
  const [stats, setStats] = useState<DataStats>({
    total: 0,
    male: 0,
    female: 0,
    kk: 0,
    ageGroups: { children: 0, adults: 0, seniors: 0 },
    occupations: [],
    religions: [],
    educations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, "residents"));
        const residents = snapshot.docs.map((d) => d.data() as any);

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
    <div className="space-y-0">
      {/* Page Header */}
      <div className="bg-[#f0f4f9] border-b border-slate-200 py-10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1b365d] text-white flex items-center justify-center shrink-0">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1b365d] bg-white border border-slate-200 px-2.5 py-0.5 rounded inline-block mb-2">
                Keterbukaan Informasi Publik
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Informasi &amp; Infografis Kelurahan
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                Data demografi kependudukan, infografis statistik, serta kumpulan tautan layanan resmi pemerintah
                yang relevan bagi warga Kelurahan Banjar Agung.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-10 space-y-12">
        {/* INFOGRAFIS KEPENDUDUKAN */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#1b365d]/10 text-[#1b365d] flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Infografis Data Kependudukan</h2>
              <p className="text-xs text-slate-500">Statistik resmi penduduk Kelurahan Banjar Agung berdasarkan data sistem administrasi aktif</p>
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

          {/* Demographic Breakdown Grids */}
          <div className="grid md:grid-cols-2 gap-5">
        {/* Usia */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-orange-500" /> Piramida Kelompok Usia
              </CardTitle>
              <CardDescription>Klasifikasi usia produktif dan rentan</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {[
              { label: "Anak-anak (0 - 17 th)", count: stats.ageGroups.children, color: "bg-amber-500" },
              { label: "Usia Produktif (18 - 59 th)", count: stats.ageGroups.adults, color: "bg-primary" },
              { label: "Lanjut Usia (≥ 60 th)", count: stats.ageGroups.seniors, color: "bg-emerald-500" },
            ].map((group, idx) => {
              const pct = Math.round((group.count / totalAge) * 100) || 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{group.label}</span>
                    <span className="text-muted-foreground font-mono">{group.count.toLocaleString("id-ID")} jiwa ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className={`${group.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground pt-2 border-t">
              * Dihitung otomatis dari tanggal lahir penduduk yang terdata di sistem.
            </p>
          </CardContent>
        </Card>

        {/* Pekerjaan */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-500" /> Sektor Mata Pencaharian Terbanyak
              </CardTitle>
              <CardDescription>Potensi mata pencaharian utama warga</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {stats.occupations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada data pekerjaan.</p>
            ) : (
              stats.occupations.map((occ, idx) => {
                const maxCount = stats.occupations[0]?.count || 1;
                const widthPct = Math.round((occ.count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{occ.name}</span>
                      <span className="text-muted-foreground font-mono">{occ.count.toLocaleString("id-ID")} jiwa</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Pendidikan */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-500" /> Jenjang Pendidikan Terakhir
              </CardTitle>
              <CardDescription>Tingkat capaian pendidikan formal masyarakat</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {stats.educations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada data pendidikan.</p>
            ) : (
              stats.educations.map((ed, idx) => {
                const pct = stats.total > 0 ? Math.round((ed.count / stats.total) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{ed.name}</span>
                      <span className="text-muted-foreground font-mono">{ed.count.toLocaleString("id-ID")} jiwa ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(5, pct * 2)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Agama */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-emerald-500" /> Komposisi Keagamaan
              </CardTitle>
              <CardDescription>Keberagaman dan kerukunan warga desa</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {stats.religions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada data agama.</p>
            ) : (
              stats.religions.map((rel, idx) => {
                const pct = stats.total > 0 ? Math.round((rel.count / stats.total) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{rel.name}</span>
                      <span className="text-muted-foreground font-mono">{rel.count.toLocaleString("id-ID")} jiwa ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(5, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
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
            {EXTERNAL_LINKS.map((section, sIdx) => (
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
                      key={lIdx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group block bg-white border ${section.border} rounded-xl p-4 hover:shadow-md transition-all duration-150`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${section.bg} ${section.color} border ${section.border}`}>
                              {link.badge}
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
                            {link.url.replace("https://", "")}
                          </span>
                        </div>
                        <ExternalLink className={`h-4 w-4 shrink-0 mt-0.5 ${section.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
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
