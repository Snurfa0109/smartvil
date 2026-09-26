"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, ChevronRight, Search, X, Tag, RotateCcw } from "lucide-react";

interface NewsItem {
  id: string;
  title?: string;
  content?: string;
  date?: string;
  category?: string;
  imageUrl?: string;
  author?: string;
}

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as NewsItem[];
        setNewsItems(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        newsItems
          .map((n) => n.category)
          .filter((c): c is string => Boolean(c && c.trim()))
      )
    );
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
        const matchContent = item.content?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchCategory) return false;
      }

      return true;
    });
  }, [newsItems, selectedCategory, selectedArchive, searchTerm]);

  const isFiltering = Boolean(searchTerm.trim() || (selectedCategory && selectedCategory !== "Semua") || selectedArchive);
  const featuredItem = !isFiltering && filteredNews.length > 0 ? filteredNews[0] : null;
  const regularItems = featuredItem ? filteredNews.slice(1) : filteredNews;

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedArchive(null);
  };

  const activeArchiveLabel = archives.find((a) => a.key === selectedArchive)?.label;

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 space-y-10">
      {/* Header Section */}
      <div className="max-w-3xl space-y-3">
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          Warta & Publikasi Resmi
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Berita & Pengumuman Kelurahan
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Informasi terkini mengenai kegiatan pemerintahan, pengumuman layanan, dan pembangunan di lingkungan Kelurahan Banjar Agung.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan judul, isi berita, atau kata kunci..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Categories & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Kategori:
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                !selectedCategory || selectedCategory === "Semua"
                  ? "bg-[#1b365d] text-white border-[#1b365d]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              Semua ({newsItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                  selectedCategory === cat
                    ? "bg-[#1b365d] text-white border-[#1b365d]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active Filter Indicators & Reset */}
          {isFiltering && (
            <div className="flex items-center gap-2">
              {selectedArchive && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                  Arsip: {activeArchiveLabel}
                  <button onClick={() => setSelectedArchive(null)} className="hover:text-slate-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-[#1b365d] hover:underline font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Status Indicator */}
      {!loading && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredNews.length}</strong> berita
            {searchTerm.trim() && (
              <span> untuk pencarian &quot;<strong className="text-slate-800">{searchTerm}</strong>&quot;</span>
            )}
            {selectedCategory && selectedCategory !== "Semua" && (
              <span> pada kategori &quot;<strong className="text-slate-800">{selectedCategory}</strong>&quot;</span>
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

      {/* Featured News Hero Card (when not searching) */}
      {!loading && featuredItem && (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Berita Terkini & Utama
          </span>
          <Link href={`/berita/${featuredItem.id}`} className="block group">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#1b365d] hover:shadow-lg transition-all grid md:grid-cols-12">
              <div className="md:col-span-6 lg:col-span-7 aspect-video md:aspect-auto h-56 md:h-full bg-slate-100 relative overflow-hidden">
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
                    {featuredItem.content}
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

      {/* Regular News Grid (3 Columns) */}
      {!loading && regularItems.length > 0 && (
        <div className="space-y-4">
          {featuredItem && (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Warta Lainnya
            </span>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularItems.map((item) => (
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
                        {item.content}
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
        </div>
      )}

      {/* Archive Navigation */}
      {!loading && archives.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Arsip Berita Berdasarkan Bulan</h3>
            {selectedArchive && (
              <button
                onClick={() => setSelectedArchive(null)}
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
                onClick={() => setSelectedArchive(selectedArchive === a.key ? null : a.key)}
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
  );
}
