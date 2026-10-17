"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { usePolling } from "@/hooks/use-polling";
import { apiList, apiDelete } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  ImageOff,
  Eye,
  Calendar,
  TrendingUp,
  FileText,
  ExternalLink,
  LayoutGrid,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

function CardThumbnail({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`overflow-hidden bg-slate-100 ${className}`}>
      {failed ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-50">
          <ImageOff className="h-5 w-5 text-slate-300" />
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src || "/images/default-news.jpg"}
          alt={alt || "Cover"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default function BeritaDashboardPage() {
  const { error: showError, confirm: showConfirm } = useToast();
  const [news, setNews] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const itemsPerPage = viewMode === "grid" ? 9 : 10;
  const initialLoadedRef = useRef(false);

  const fetchNews = useCallback(async () => {
    if (!initialLoadedRef.current) setLoading(true);
    try {
      const rows = await apiList("news", { orderBy: "date", order: "desc" });
      setNews(
        (rows || []).map((row) => ({
          id: String(row.id),
          title: String(row.title || ""),
          category: String(row.category || ""),
          content: String(row.content || ""),
          date: String(row.date || ""),
          imageUrl: String(row.image_url || ""),
          views: String(row.views ?? "0"),
          createdAt: String(row.created_at || ""),
        }))
      );
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
      initialLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  usePolling(fetchNews, 30_000);

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await showConfirm({
      title: "Hapus Berita?",
      message: `Artikel "${title}" akan dihapus permanen.`,
      variant: "danger",
      confirmLabel: "Ya, Hapus",
    });
    if (confirmed) {
      try {
        await apiDelete("news", id);
        await writeAuditLog("DELETE", "berita", `Menghapus artikel berita: "${title || id}"`);
        fetchNews();
      } catch (error) {
        console.error("Error deleting news:", error);
        showError("Gagal menghapus berita.");
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory, viewMode]);

  const categories = Array.from(new Set(news.map((n) => n.category).filter(Boolean)));

  const thisMonthCount = news.filter((n) => {
    try {
      const d = new Date(n.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  }).length;

  const latestDate = news.length > 0 ? news[0]?.date : null;

  const totalViews = news.reduce((sum, n) => sum + Number(n.views || 0), 0);

  const filteredNews = useMemo(() =>
    news.filter((n) => {
      const matchSearch =
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === "all" || n.category === activeCategory;
      return matchSearch && matchCategory;
    }),
    [news, searchTerm, activeCategory]
  );

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const stripHtml = (html: string) => html?.replace(/<[^>]*>/g, "") || "";

  const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
    Pengumuman: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
    Kegiatan: { bg: "bg-sky-50 border-sky-200/60", text: "text-sky-700", dot: "bg-sky-500" },
    Kesehatan: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500" },
    Pelatihan: { bg: "bg-violet-50 border-violet-200/60", text: "text-violet-700", dot: "bg-violet-500" },
    Pemerintahan: { bg: "bg-[#1b365d]/[0.06] border-[#1b365d]/10", text: "text-[#1b365d]", dot: "bg-[#1b365d]" },
    Lainnya: { bg: "bg-slate-50 border-slate-200/60", text: "text-slate-600", dot: "bg-slate-400" },
  };

  const getCategoryStyle = (cat: string) =>
    categoryColors[cat] || { bg: "bg-slate-50 border-slate-200/60", text: "text-slate-600", dot: "bg-slate-400" };

  const showFeatured = viewMode === "grid" && currentPage === 1 && activeCategory === "all" && !searchTerm && filteredNews.length > 0;
  const featuredArticle = showFeatured ? filteredNews[0] : null;
  const gridItems = showFeatured ? paginatedNews.filter((n) => n.id !== featuredArticle?.id) : paginatedNews;

  return (
    <div className="space-y-6 pb-8">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Berita & Artikel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola konten portal kelurahan</p>
        </div>
        <Link href="/dashboard/berita/tambah">
          <Button size="sm" className="bg-[#1b365d] hover:bg-[#152a48] text-white h-9 px-4 text-xs font-semibold">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tulis Artikel
          </Button>
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl bg-slate-200/60 border border-slate-200/70 overflow-hidden">
        <div className="bg-white px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1b365d]/8 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-[#1b365d]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Total artikel</p>
            {loading ? (
              <div className="h-6 w-10 bg-slate-100 rounded mt-0.5 animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-slate-900 tabular-nums leading-tight">{news.length}</p>
            )}
          </div>
        </div>

        <div className="bg-white px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Bulan ini</p>
            {loading ? (
              <div className="h-6 w-10 bg-slate-100 rounded mt-0.5 animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-emerald-700 tabular-nums leading-tight">{thisMonthCount}</p>
            )}
          </div>
        </div>

        <div className="bg-white px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
            <Eye className="h-4 w-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Total dibaca</p>
            {loading ? (
              <div className="h-6 w-10 bg-slate-100 rounded mt-0.5 animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-violet-700 tabular-nums leading-tight">{totalViews.toLocaleString("id-ID")}</p>
            )}
          </div>
        </div>

        <div className="bg-white px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Terakhir terbit</p>
            {loading ? (
              <div className="h-6 w-14 bg-slate-100 rounded mt-0.5 animate-pulse" />
            ) : (
              <p className="text-sm font-semibold text-slate-700 leading-tight truncate">
                {latestDate ? formatDate(latestDate) : "Belum ada"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              type="search"
              placeholder="Cari judul atau kategori..."
              className="pl-9 h-9 text-sm rounded-lg border-slate-200 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-[#1b365d] text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const style = getCategoryStyle(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#1b365d] text-white"
                      : `${style.bg} ${style.text} border hover:opacity-80`
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "grid"
                ? "bg-white text-[#1b365d] shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Tampilan kartu"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "list"
                ? "bg-white text-[#1b365d] shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Tampilan daftar"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-3">Memuat daftar berita...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-xl border border-slate-200/70 bg-white py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Newspaper className="h-5 w-5 text-slate-300" />
          </div>
          {news.length === 0 ? (
            <>
              <p className="text-sm font-semibold text-slate-700">Belum ada berita</p>
              <p className="text-sm text-slate-400 mt-1">Tulis artikel pertama untuk portal kelurahan.</p>
              <Link href="/dashboard/berita/tambah">
                <Button size="sm" className="mt-4 bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-semibold">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Tulis Artikel
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-700">Tidak ada hasil</p>
              <p className="text-sm text-slate-400 mt-1">Coba ubah kata kunci atau ganti filter kategori.</p>
              <button
                type="button"
                onClick={() => { setSearchTerm(""); setActiveCategory("all"); }}
                className="mt-3 text-xs font-semibold text-[#1b365d] hover:underline"
              >
                Reset filter
              </button>
            </>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-5">
          {/* Featured: wider card, asymmetric layout */}
          {featuredArticle && (
            <div className="group rounded-xl border border-slate-200/70 bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="grid md:grid-cols-2 gap-0">
                <CardThumbnail
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  className="h-52 md:h-full"
                />
                <div className="p-5 md:p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    {(() => {
                      const s = getCategoryStyle(featuredArticle.category);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {featuredArticle.category}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-slate-400">{formatDate(featuredArticle.date)}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 ml-auto">
                      <Eye className="h-3 w-3" /> {Number(featuredArticle.views || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-[#1b365d] transition-colors line-clamp-2">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3 flex-1">
                    {stripHtml(featuredArticle.content).slice(0, 220) || "Belum ada isi"}
                  </p>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Link
                      href={`/dashboard/berita/${featuredArticle.id}/edit`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1b365d] hover:bg-[#1b365d]/[0.06] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <Link
                      href={`/berita/${featuredArticle.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> Lihat
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(featuredArticle.id, featuredArticle.title)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridItems.map((item, idx) => {
              const catStyle = getCategoryStyle(item.category);
              const plainText = stripHtml(item.content);
              return (
                <div
                  key={item.id}
                  className="group rounded-xl border border-slate-200/70 bg-white overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <CardThumbnail
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-40 w-full"
                  />
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${catStyle.bg} ${catStyle.text}`}>
                        <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{formatDate(item.date)}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 ml-auto">
                        <Eye className="h-3 w-3" /> {Number(item.views || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1b365d] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed flex-1">
                      {plainText.slice(0, 120) || "Belum ada isi"}
                    </p>
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                      <Link
                        href={`/dashboard/berita/${item.id}/edit`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#1b365d] hover:bg-[#1b365d]/[0.06] px-2 py-1 rounded-md transition-all"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </Link>
                      <Link
                        href={`/berita/${item.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-md transition-all"
                      >
                        <Eye className="h-3 w-3" /> Lihat
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ml-auto"
                        title="Hapus"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="rounded-xl border border-slate-200/70 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="tabular-nums font-semibold text-slate-700">{filteredNews.length}</span>
              {filteredNews.length !== news.length && <span> dari {news.length}</span>} artikel
            </p>
            <Link
              href="/berita"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[#1b365d] hover:underline"
            >
              Portal Publik <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100/80">
            {paginatedNews.map((item) => {
              const catStyle = getCategoryStyle(item.category);
              const plainText = stripHtml(item.content);
              return (
                <div
                  key={item.id}
                  className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors group flex items-center gap-4"
                >
                  <CardThumbnail
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-11 rounded-lg shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-[#1b365d] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {plainText.slice(0, 80) || "Belum ada isi"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 sm:hidden">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${catStyle.bg} ${catStyle.text}`}>
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{formatDate(item.date)}</span>
                    </div>
                  </div>
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium shrink-0 ${catStyle.bg} ${catStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                    {item.category}
                  </span>
                  <span className="hidden md:block text-xs text-slate-500 shrink-0 w-24 text-right tabular-nums">
                    {formatDate(item.date)}
                  </span>
                  <span className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-400 shrink-0 w-14 justify-end tabular-nums">
                    <Eye className="h-3 w-3" /> {Number(item.views || 0).toLocaleString("id-ID")}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Link
                      href={`/berita/${item.id}`}
                      target="_blank"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                      title="Lihat di website"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/dashboard/berita/${item.id}/edit`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1b365d] hover:bg-[#1b365d]/[0.06] transition-all"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredNews.length > itemsPerPage && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Halaman <span className="font-semibold text-slate-600">{currentPage}</span> dari{" "}
            <span className="font-semibold text-slate-600">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-3 w-3" /> Sebelumnya
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      currentPage === page
                        ? "bg-[#1b365d] text-white"
                        : "text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Selanjutnya <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
