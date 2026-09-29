"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, Newspaper, UserCheck, MapPin, Phone, ArrowRight, Building2, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { stripHtml } from "@/lib/utils";

interface SearchResultItem {
  id: string;
  title: string;
  category: "layanan" | "berita" | "profil" | "informasi";
  subtitle: string;
  url: string;
}

const STATIC_SERVICES: SearchResultItem[] = [
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

const STATIC_PAGES: SearchResultItem[] = [
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
    id: "cek-pengaduan",
    title: "Cek Status Pengaduan via No. Telepon",
    category: "informasi",
    subtitle: "Pantau respon dan perkembangan laporan pengaduan menggunakan nomor telepon Anda.",
    url: "/pengaduan",
  },
  {
    id: "rabu-asri",
    title: "Program Gotong Royong 'Rabu Asri'",
    category: "informasi",
    subtitle: "Aksi kebersihan lingkungan dan pemeliharaan drainase serentak di kelurahan.",
    url: "/profil",
  },
  {
    id: "fasilitas",
    title: "Fasilitas Publik & Puskesmas Banjar Agung",
    category: "profil",
    subtitle: "Puskesmas Banjar Agung, Posyandu, pemukiman BAP I & II, dan Bumi Mutiara.",
    url: "/profil",
  },
];

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [newsResults, setNewsResults] = useState<SearchResultItem[]>([]);
  const [newsFetched, setNewsFetched] = useState(false);

  // Pre-fetch news list when modal opens
  useEffect(() => {
    if (!isOpen || newsFetched) return;
    const fetchNewsForSearch = async () => {
      try {
        const { data, error } = await supabase.from("news").select("*").order("date", { ascending: false }).limit(50);
        if (error) throw error;
        const mapped: SearchResultItem[] = (data || []).map((row) => {
          return {
            id: `news-${row.id}`,
            title: row.title || "Berita",
            category: "berita",
            subtitle: `${row.category || "Berita"} • ${row.content ? stripHtml(row.content).substring(0, 90) + "..." : ""}`,
            url: `/berita/${row.id}`,
          };
        });
        setNewsResults(mapped);
        setNewsFetched(true);
      } catch (err) {
        console.error("Error pre-fetching news for search:", err);
      }
    };

    fetchNewsForSearch();
  }, [isOpen, newsFetched]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allItems = useMemo(() => {
    return [...STATIC_SERVICES, ...STATIC_PAGES, ...newsResults];
  }, [newsResults]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      // If empty, show recommended quick access
      return STATIC_SERVICES.slice(0, 3).concat(STATIC_PAGES.slice(0, 3));
    }
    const q = searchTerm.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, searchTerm]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onClose();
      router.push(`/cari?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (!isOpen) return null;

  const categoryIcons: Record<string, any> = {
    layanan: FileText,
    berita: Newspaper,
    profil: Building2,
    informasi: HelpCircle,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleFormSubmit} className="relative flex items-center border-b border-slate-200 px-4 py-3.5 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari layanan surat, berita, profil, atau info kelurahan..."
            className="w-full bg-transparent text-sm md:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="p-1 text-slate-400 hover:text-slate-600 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shrink-0 ml-2"
            title="Tutup jendela pencarian"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </button>
        </form>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {!searchTerm.trim() ? "Akses Cepat Populer" : `Hasil Pencarian (${filteredItems.length})`}
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada hasil yang cocok</p>
              <p className="text-xs text-slate-400">
                Coba gunakan kata kunci lain seperti &quot;surat&quot;, &quot;SKU&quot;, &quot;posyandu&quot;, atau &quot;jadwal&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const IconComponent = categoryIcons[item.category] || FileText;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.url)}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-100 flex items-start gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1b365d]/10 text-slate-500 group-hover:text-[#1b365d] flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-[#1b365d] transition-colors truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1b365d] group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-200 px-4 py-2.5 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Pencarian Global Terpadu Kelurahan Banjar Agung</span>
          {searchTerm.trim() && (
            <button
              onClick={handleFormSubmit}
              className="text-[#1b365d] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Buka Halaman Hasil Penuh</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
