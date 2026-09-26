"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, FileText, Newspaper, Building2, HelpCircle, ArrowRight, RotateCcw } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SearchItem {
  id: string;
  title: string;
  category: "layanan" | "berita" | "profil" | "informasi";
  subtitle: string;
  url: string;
  date?: string;
}

const STATIC_SERVICES: SearchItem[] = [
  {
    id: "sku",
    title: "Surat Keterangan Usaha (SKU)",
    category: "layanan",
    subtitle: "Layanan administrasi permohonan legalitas usaha bagi pelaku UMKM kelurahan.",
    url: "/layanan",
  },
  {
    id: "sktm",
    title: "Surat Keterangan Tidak Mampu (SKTM)",
    category: "layanan",
    subtitle: "Permohonan keterangan bagi warga prasejahtera untuk beasiswa dan bantuan sosial.",
    url: "/layanan",
  },
  {
    id: "domisili",
    title: "Surat Keterangan Domisili",
    category: "layanan",
    subtitle: "Keterangan bukti tempat tinggal resmi warga di wilayah Kelurahan Banjar Agung.",
    url: "/layanan",
  },
  {
    id: "pengantar-ktp",
    title: "Surat Pengantar KTP / KK",
    category: "layanan",
    subtitle: "Pengantar permohonan penerbitan dan pembaruan KTP-el atau Kartu Keluarga.",
    url: "/layanan",
  },
  {
    id: "cek-surat",
    title: "Lacak Permohonan Surat Online",
    category: "layanan",
    subtitle: "Cek status verifikasi dan kesiapan tanda tangan permohonan surat warga.",
    url: "/layanan",
  },
];

const STATIC_PAGES: SearchItem[] = [
  {
    id: "sejarah-profil",
    title: "Profil & Sejarah Kelurahan Banjar Agung",
    category: "profil",
    subtitle: "Sejarah pembentukan, letak geografis, dan gambaran umum wilayah Cipocok Jaya.",
    url: "/profil",
  },
  {
    id: "visi-misi",
    title: "Visi & Misi Kelurahan",
    category: "profil",
    subtitle: "Arah pembangunan, tata kelola pemerintahan, dan komitmen pelayanan masyarakat.",
    url: "/profil",
  },
  {
    id: "geografis",
    title: "Geografis & Batas Wilayah",
    category: "profil",
    subtitle: "Luas kawasan, batas utara-selatan-timur-barat, dan koordinat resmi kelurahan.",
    url: "/profil",
  },
  {
    id: "aparatur",
    title: "Struktur Organisasi & Aparatur Kelurahan",
    category: "profil",
    subtitle: "Daftar Lurah, Sekretaris Kelurahan, Kasi Pemerintahan, dan Kasi Pelayanan.",
    url: "/profil",
  },
  {
    id: "data-penduduk",
    title: "Data Demografi & Statistik Penduduk",
    category: "informasi",
    subtitle: "Statistik jumlah warga, jenis kelamin, usia, dan persebaran RT/RW.",
    url: "/data",
  },
  {
    id: "pengaduan-warga",
    title: "Layanan Pengaduan & Aspirasi Masyarakat",
    category: "informasi",
    subtitle: "Sampaikan keluhan fasilitas publik atau pantau riwayat laporan melalui nomor telepon.",
    url: "/pengaduan",
  },
  {
    id: "fasilitas",
    title: "Fasilitas Publik & Puskesmas Banjar Agung",
    category: "profil",
    subtitle: "Puskesmas Banjar Agung, Posyandu, pemukiman BAP I & II, dan Bumi Mutiara.",
    url: "/profil",
  },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [inputVal, setInputVal] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [newsItems, setNewsItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInputVal(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const fetchAllNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        const mapped: SearchItem[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: `news-${doc.id}`,
            title: d.title || "Berita Kelurahan",
            category: "berita",
            subtitle: d.content ? d.content.substring(0, 140) + "..." : "",
            url: `/berita/${doc.id}`,
            date: d.date,
          };
        });
        setNewsItems(mapped);
      } catch (err) {
        console.error("Error fetching news for search page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNews();
  }, []);

  const allItems = useMemo(() => {
    return [...STATIC_SERVICES, ...STATIC_PAGES, ...newsItems];
  }, [newsItems]);

  const filteredResults = useMemo(() => {
    let list = allItems;
    if (activeCategory !== "semua") {
      list = list.filter((item) => item.category === activeCategory);
    }
    const q = inputVal.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, activeCategory, inputVal]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/cari?q=${encodeURIComponent(inputVal.trim())}`);
  };

  const categoryIcons: Record<string, any> = {
    layanan: FileText,
    berita: Newspaper,
    profil: Building2,
    informasi: HelpCircle,
  };

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          Pusat Pencarian Terpadu
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Pencarian Seluruh Website
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Temukan layanan administrasi surat, warta kelurahan, profil pemerintahan, dan informasi publik Kelurahan Banjar Agung.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ketik kata kunci pencarian (contoh: SKU, domisili, jadwal, stunting, puskesmas)..."
            className="w-full pl-10 pr-24 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d]"
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => setInputVal("")}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Cari
          </button>
        </form>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          {[
            { key: "semua", label: "Semua Kategori" },
            { key: "layanan", label: "Layanan Surat" },
            { key: "berita", label: "Berita & Pengumuman" },
            { key: "profil", label: "Profil & Wilayah" },
            { key: "informasi", label: "Informasi Publik" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                activeCategory === cat.key
                  ? "bg-[#1b365d] text-white border-[#1b365d]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header Status */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Ditemukan <strong className="text-slate-800">{filteredResults.length}</strong> hasil
          {inputVal.trim() && (
            <span> untuk kata kunci &quot;<strong className="text-slate-800">{inputVal}</strong>&quot;</span>
          )}
        </span>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 animate-pulse">
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
              <div className="h-3 w-2/3 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Tidak Ditemukan Hasil</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tidak ada halaman atau informasi yang cocok dengan kata kunci tersebut. Coba kata kunci yang lebih umum.
            </p>
          </div>
          <button
            onClick={() => {
              setInputVal("");
              setActiveCategory("semua");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#1b365d] hover:bg-[#152a48] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((item) => {
            const Icon = categoryIcons[item.category] || FileText;
            return (
              <Link key={item.id} href={item.url} className="block group">
                <div className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-[#1b365d] hover:shadow-sm transition-all flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 group-hover:bg-[#1b365d]/10 text-slate-500 group-hover:text-[#1b365d] flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1b365d] transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {item.category}
                      </span>
                      {item.date && (
                        <span className="text-xs text-slate-400">
                          • {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1b365d] group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-6 py-12 text-sm text-slate-500">Memuat pencarian...</div>}>
      <SearchContent />
    </Suspense>
  );
}
