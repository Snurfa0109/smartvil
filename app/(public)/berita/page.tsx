"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { apiList } from "@/lib/api";
import { Calendar, ChevronLeft, ChevronRight, Search, X, Tag, RotateCcw } from "lucide-react";
import { stripHtml } from "@/lib/utils";

interface NewsItem {
  id: string;
  title?: string;
  content?: string;
  date?: string;
  category?: string;
  imageUrl?: string;
}

const ITEMS_PER_PAGE = 9;

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "d2518441-f23c-46e8-a787-41a758557a36",
    title: "Penyaluran Cadangan Beras Pangan (CPP) Tahap II untuk 450 KPM Warga Banjar Agung Berjalan Tertib",
    category: "Pengumuman",
    date: "2026-10-15",
    imageUrl: "/images/banner-beranda-bogeg.jpg",
    content: "Pemerintah Kelurahan Banjar Agung menyalurkan bantuan beras cadangan pangan pemerintah seberat 10 kg kepada 450 keluarga penerima manfaat di aula kelurahan.",
  },
  {
    id: "85dc853b-0e45-4ff4-b761-831695873427",
    title: "Musrenbang Kelurahan Banjar Agung TA 2027 Rumuskan Prioritas Drainase & Pemberdayaan UMKM",
    category: "Pemerintahan",
    date: "2026-10-11",
    imageUrl: "/images/banner-profil.jpg",
    content: "Musyawarah Perencanaan Pembangunan tingkat kelurahan digelar bersama Ketua RT/RW memprioritaskan drainase dan penguatan ekonomi perempuan.",
  },
  {
    id: "bf11e10b-2847-4ca6-9d04-4789807ba656",
    title: "Gerakan 'Rabu Asri' Bersama Warga: Kompak Bersihkan Saluran Drainase Antisipasi Musim Hujan",
    category: "Kegiatan",
    date: "2026-10-08",
    imageUrl: "/images/jembatan-aria-wangsakara.png",
    content: "Aparatur kelurahan bersama warga RW 03 dan RW 05 melaksanakan gotong royong pembersihan saluran drainase dan perapian lingkungan pemukiman.",
  },
];

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        let loaded: NewsItem[] = [];
        try {
          const rows = await apiList("news", { orderBy: "date", order: "desc" });
          if (Array.isArray(rows) && rows.length > 0) {
            loaded = rows.map((row) => ({
              id: String(row.id),
              title: String(row.title || ""),
              content: String(row.content || ""),
              date: String(row.date || ""),
              category: String(row.category || ""),
              imageUrl: String(row.image_url || ""),
            }));
          }
        } catch {
          // fallback
        }

        if (loaded.length === 0) {
          loaded = FALLBACK_NEWS;
        }

        setNewsItems(loaded);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);
  // Set page title
  useEffect(() => {
    document.title = "Berita | Kelurahan";
  }, []);


  // Reset to page 1 whenever filters change
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleArchiveChange = (archive: string | null) => {
    setSelectedArchive(archive);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedArchive(null);
    setCurrentPage(1);
  };

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        newsItems
          .map((n) => n.category)
          .filter((c): c is string => Boolean(c && c.trim()))
      )
    );
  }, [newsItems]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    newsItems.forEach((n) => {
      if (n.category && n.category.trim()) {
        const cat = n.category.trim();
        map[cat] = (map[cat] || 0) + 1;
      }
    });
    return map;
  }, [newsItems]);

  const archives = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    newsItems.forEach((item) => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (Number.isNaN(d.getTime())) return;
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthLabel = d.toLocaleDateString("id-ID", { month: "long" });
      const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { label: `${monthLabel} ${year}`, count: 1 });
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, value]) => ({ key, ...value }));
  }, [newsItems]);

  const filteredNews = useMemo(() => {
    return newsItems.filter((item) => {
      if (selectedCategory && selectedCategory !== "Semua" && item.category !== selectedCategory) {
        return false;
      }

      if (selectedArchive) {
        if (!item.date) return false;
        const d = new Date(item.date);
        if (Number.isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key !== selectedArchive) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchContent = stripHtml(item.content).toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchCategory) return false;
      }

      return true;
    });
  }, [newsItems, selectedCategory, selectedArchive, searchTerm]);

  const isFiltering = Boolean(searchTerm.trim() || (selectedCategory && selectedCategory !== "Semua") || selectedArchive);

  // If not filtering, the first item on page 1 is shown as featured hero
  const featuredItem = !isFiltering && currentPage === 1 && filteredNews.length > 0 ? filteredNews[0] : null;
  const listPool = !isFiltering ? filteredNews.slice(1) : filteredNews;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(listPool.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = listPool.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const startEntryNumber = listPool.length === 0 ? 0 : startIndex + 1;
  const endEntryNumber = Math.min(startIndex + paginatedItems.length, listPool.length);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeArchiveLabel = archives.find((a) => a.key === selectedArchive)?.label;

  return (
    <div className="pb-20 pt-6 md:pt-8 bg-slate-50/50 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 space-y-8">
        {/* Clean Header: Langsung ke Inti Berita & Pengumuman */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1b365d]/10 text-[#1b365d] border border-[#1b365d]/20 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#1b365d]" />
              <span>Publikasi & Informasi Publik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Warta & Pengumuman Kelurahan
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
              Informasi terkini kegiatan aparatur, siaran pers pembangunan, agenda kemasyarakatan, dan pengumuman resmi Kelurahan Banjar Agung.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium shrink-0 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs w-fit">
            Total Publikasi: <span className="font-bold text-[#1b365d] font-mono">{newsItems.length}</span> Berita
          </div>
        </div>

        {/* Search & Filter Bar with Enhanced UCD Contrast & Affordance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          {/* Search Input Box */}
          <div className="relative flex items-center bg-slate-50/90 hover:bg-white focus-within:bg-white border-2 border-slate-200 hover:border-slate-300 focus-within:border-[#1b365d] rounded-xl transition-all shadow-2xs">
            <div className="pl-4 pr-1 text-[#1b365d] flex items-center pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari berita berdasarkan judul, topik, isi, atau kata kunci..."
              className="w-full pl-2.5 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 bg-slate-200/60 hover:bg-slate-200 rounded-full p-1 transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Categories & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-[#1b365d]" />
                Kategori:
              </span>
              <button
                onClick={() => handleCategoryChange(null)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  !selectedCategory || selectedCategory === "Semua"
                    ? "bg-[#1b365d] text-white shadow-xs ring-2 ring-[#1b365d]/20 scale-[1.02]"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <span>Semua</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    !selectedCategory || selectedCategory === "Semua"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {newsItems.length}
                </span>
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#1b365d] text-white shadow-xs ring-2 ring-[#1b365d]/20 scale-[1.02]"
                        : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Filter Indicators & Reset */}
            {isFiltering && (
              <div className="flex items-center gap-2">
                {selectedArchive && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
                    Arsip: {activeArchiveLabel}
                    <button onClick={() => handleArchiveChange(null)} className="hover:text-slate-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs text-[#1b365d] hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>

      <div ref={listTopRef} />

      {/* Result Status Indicator */}
      {!loading && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Total <strong className="text-slate-800">{filteredNews.length}</strong> berita
            {searchTerm.trim() && (
              <span> untuk pencarian &quot;<strong className="text-slate-800">{searchTerm}</strong>&quot;</span>
            )}
            {selectedCategory && selectedCategory !== "Semua" && (
              <span> pada kategori &quot;<strong className="text-slate-800">{selectedCategory}</strong>&quot;</span>
            )}
            {totalPages > 1 && (
              <span className="text-slate-400 ml-2">
                (Halaman {currentPage} dari {totalPages})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-5 w-4/5 bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-200 rounded" />
                <div className="h-3 w-2/3 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNews.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Berita Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tidak ada berita atau pengumuman yang sesuai dengan kata kunci pencarian atau filter kategori yang dipilih.
            </p>
          </div>
          {isFiltering && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#1b365d] hover:bg-[#152a48] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Tampilkan Semua Berita
            </button>
          )}
        </div>
      )}

      {/* Featured News Hero Card (Only on Page 1 when not filtering) */}
      {!loading && featuredItem && (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Berita Terkini & Utama
          </span>
          <Link href={`/berita/${featuredItem.id}`} className="block group">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#1b365d] hover:shadow-lg transition-all grid md:grid-cols-12">
              <div className="w-full md:col-span-6 lg:col-span-7 aspect-[16/9] sm:aspect-[16/10] md:aspect-auto md:h-full min-h-[220px] sm:min-h-[280px] bg-slate-100 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredItem.imageUrl || "/images/default-news.jpg"}
                  alt={featuredItem.title || "Berita Utama"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/default-news.jpg";
                  }}
                />
              </div>
              <div className="md:col-span-6 lg:col-span-5 p-6 md:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    {featuredItem.category && (
                      <span className="bg-slate-100 text-slate-800 font-semibold px-2.5 py-0.5 rounded-md border border-slate-200 text-[11px]">
                        {featuredItem.category}
                      </span>
                    )}
                    {featuredItem.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(featuredItem.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-[#1b365d] transition-colors leading-snug">
                    {featuredItem.title}
                  </h2>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed line-clamp-3">
                    {stripHtml(featuredItem.content)}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-[#1b365d] group-hover:translate-x-1 transition-transform">
                  <span>Baca Artikel Selengkapnya</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Regular News Grid (9 Items per page) */}
      {!loading && paginatedItems.length > 0 && (
        <div className="space-y-6">
          {featuredItem && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Warta Lainnya
              </span>
              <span className="text-xs text-slate-500">
                Menampilkan {startEntryNumber} – {endEntryNumber} dari {listPool.length} warta
              </span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedItems.map((item) => (
              <Link key={item.id} href={`/berita/${item.id}`} className="group">
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#1b365d] hover:shadow-md transition-all h-full flex flex-col">
                  {/* Thumbnail Image */}
                  <div className="aspect-video bg-slate-100 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl || "/images/default-news.jpg"}
                      alt={item.title || "Berita"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/default-news.jpg";
                      }}
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {item.category && (
                          <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {item.category}
                          </span>
                        )}
                        {item.date && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(item.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 group-hover:text-[#1b365d] transition-colors line-clamp-2 text-base leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                        {stripHtml(item.content)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-[#1b365d]">
                      <span>Baca Selengkapnya</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls (Entries Pages) */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-600">
                Menampilkan halaman <strong className="text-slate-900">{currentPage}</strong> dari{" "}
                <strong className="text-slate-900">{totalPages}</strong> ({listPool.length} total entri)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // Show a window of page numbers if pages > 5
                    if (
                      totalPages > 6 &&
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - currentPage) > 1
                    ) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return (
                          <span key={pageNum} className="px-1 text-slate-400 text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          currentPage === pageNum
                            ? "bg-[#1b365d] text-white"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Archive Navigation */}
      {!loading && archives.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Arsip Berita Berdasarkan Bulan</h3>
            {selectedArchive && (
              <button
                onClick={() => handleArchiveChange(null)}
                className="text-xs text-[#1b365d] hover:underline font-semibold"
              >
                Hapus Filter Arsip
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {archives.map((a) => (
              <button
                key={a.key}
                onClick={() => handleArchiveChange(selectedArchive === a.key ? null : a.key)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  selectedArchive === a.key
                    ? "bg-[#1b365d] text-white border-[#1b365d]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span>{a.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedArchive === a.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {a.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
