"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const itemsPerPage = viewMode === "grid" ? 9 : 10;

  const fetchNews = useCallback(async () => {
    setLoading(true);
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
          createdAt: row.created_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

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

  const filteredNews = news.filter((n) => {
    const matchSearch =
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === "all" || n.category === activeCategory;
    return matchSearch && matchCategory;
  });

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

  const categoryColors: Record<string, { bg: string; text: string }> = {
    Pengumuman: { bg: "bg-amber-50", text: "text-amber-700" },
    Kegiatan: { bg: "bg-sky-50", text: "text-sky-700" },
    Kesehatan: { bg: "bg-emerald-50", text: "text-emerald-700" },
    Pelatihan: { bg: "bg-violet-50", text: "text-violet-700" },
    Pemerintahan: { bg: "bg-[#1b365d]/[0.06]", text: "text-[#1b365d]" },
    Lainnya: { bg: "bg-slate-100", text: "text-slate-600" },
  };

  const getCategoryStyle = (cat: string) =>
    categoryColors[cat] || { bg: "bg-slate-100", text: "text-slate-600" };

  // Featured article = first item on page 1 with no filter, grid mode only
  const showFeatured = viewMode === "grid" && currentPage === 1 && activeCategory === "all" && !searchTerm && filteredNews.length > 0;
  const featuredArticle = showFeatured ? filteredNews[0] : null;
  const gridItems = showFeatured ? paginatedNews.filter((n) => n.id !== featuredArticle?.id) : paginatedNews;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-md shadow-[#1b365d]/15">
            <Newspaper className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Berita & Artikel</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">Kelola konten portal kelurahan</p>
          </div>
        </div>
        <Link href="/dashboard/berita/tambah">
          <Button size="sm" className="bg-[#1b365d] hover:bg-[#152a48] text-white h-9 px-4 text-xs font-bold shadow-sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tulis Berita Baru
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          {
            label: "Total Artikel",
            value: news.length,
            icon: <FileText className="h-[18px] w-[18px]" />,
            iconBg: "bg-[#1b365d]/10",
            iconText: "text-[#1b365d]",
            numText: "text-[#1b365d]",
            accentBar: "bg-[#1b365d]",
          },
          {
            label: "Bulan Ini",
            value: thisMonthCount,
            icon: <TrendingUp className="h-[18px] w-[18px]" />,
            iconBg: "bg-emerald-100",
            iconText: "text-emerald-600",
            numText: "text-emerald-700",
            accentBar: "bg-emerald-500",
          },
          {
            label: "Terakhir Terbit",
            value: latestDate ? formatDate(latestDate) : "—",
            isText: true,
            icon: <Calendar className="h-[18px] w-[18px]" />,
            iconBg: "bg-amber-100",
            iconText: "text-amber-600",
            numText: "text-amber-700",
            accentBar: "bg-amber-500",
          },
        ] as const).map((stat, i) => (
          <div
            key={i}
            className="dash-card group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white transition-all duration-300 hover:shadow-md hover:border-slate-300/80"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`h-[3px] ${stat.accentBar}`} />
            <div className="p-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                {loading ? (
                  <div className="h-7 w-12 bg-slate-100 rounded-lg mt-1.5 animate-pulse" />
                ) : (
                  <p className={`${stat.isText ? "text-sm" : "text-2xl"} font-extrabold mt-1 tabular-nums tracking-tight ${stat.numText}`}>
                    {typeof stat.value === "number" ? stat.value.toLocaleString("id-ID") : stat.value}
                  </p>
                )}
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} ${stat.iconText} flex items-center justify-center shrink-0 dash-icon-box`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: search, filters, view toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              type="search"
              placeholder="Cari judul atau kategori..."
              className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                activeCategory === "all"
                  ? "bg-[#1b365d] text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => {
              const style = getCategoryStyle(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    isActive
                      ? "bg-[#1b365d] text-white shadow-sm"
                      : `${style.bg} ${style.text} hover:opacity-80`
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* View toggle */}
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

      {/* Content area */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3 font-medium">Memuat daftar berita...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white py-20 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Newspaper className="h-6 w-6 text-slate-300" />
          </div>
          {news.length === 0 ? (
            <>
              <p className="text-sm font-bold text-slate-700">Belum ada berita</p>
              <p className="text-xs text-slate-400 mt-1">Tulis artikel pertama untuk portal kelurahan.</p>
              <Link href="/dashboard/berita/tambah">
                <Button size="sm" className="mt-4 bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-bold">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Tulis Berita
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-700">Tidak ada hasil</p>
              <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci atau ganti filter kategori.</p>
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
        /* ── GRID VIEW ── */
        <div className="space-y-4">
          {/* Featured article card */}
          {featuredArticle && (
            <div className="dash-card group rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="grid md:grid-cols-5 gap-0">
                <CardThumbnail
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  className="md:col-span-2 h-48 md:h-full"
                />
                <div className="md:col-span-3 p-5 md:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${getCategoryStyle(featuredArticle.category).bg} ${getCategoryStyle(featuredArticle.category).text}`}>
                        {featuredArticle.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{formatDate(featuredArticle.date)}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-[#1b365d] transition-colors line-clamp-2">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-2">
                      {stripHtml(featuredArticle.content).slice(0, 180) || "Belum ada isi"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Link
                      href={`/dashboard/berita/${featuredArticle.id}/edit`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1b365d] bg-[#1b365d]/[0.06] hover:bg-[#1b365d]/[0.12] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <Link
                      href={`/berita/${featuredArticle.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Lihat
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(featuredArticle.id, featuredArticle.title)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridItems.map((item, idx) => {
              const catStyle = getCategoryStyle(item.category);
              const plainText = stripHtml(item.content);
              return (
                <div
                  key={item.id}
                  className="dash-card group rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 flex flex-col"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Thumbnail */}
                  <CardThumbnail
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-40 w-full"
                  />

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold ${catStyle.bg} ${catStyle.text}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(item.date)}</span>
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1b365d] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed flex-1">
                      {plainText.slice(0, 120) || "Belum ada isi"}
                    </p>

                    {/* Actions — revealed more prominently on hover */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      <Link
                        href={`/dashboard/berita/${item.id}/edit`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-[#1b365d] hover:bg-[#1b365d]/[0.06] px-2 py-1 rounded-md transition-all"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </Link>
                      <Link
                        href={`/berita/${item.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-md transition-all"
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
        /* ── LIST VIEW ── */
        <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1b365d]/[0.06] flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#1b365d]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Daftar Artikel</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {filteredNews.length === news.length
                    ? <><span className="tabular-nums font-semibold text-slate-500">{news.length}</span> artikel</>
                    : <><span className="tabular-nums font-semibold text-slate-500">{filteredNews.length}</span> dari {news.length}</>
                  }
                </p>
              </div>
            </div>
            <Link
              href="/berita"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1b365d] bg-[#1b365d]/[0.06] hover:bg-[#1b365d]/[0.12] px-3 py-1.5 rounded-lg transition-colors"
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
                  className="px-5 py-3.5 hover:bg-[#1b365d]/[0.015] transition-colors group flex items-center gap-4"
                >
                  <CardThumbnail
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-11 rounded-lg shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 line-clamp-1 group-hover:text-[#1b365d] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {plainText.slice(0, 80) || "Belum ada isi"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 sm:hidden">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${catStyle.bg} ${catStyle.text}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(item.date)}</span>
                    </div>
                  </div>
                  <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${catStyle.bg} ${catStyle.text}`}>
                    {item.category}
                  </span>
                  <span className="hidden md:block text-[12px] text-slate-500 font-medium shrink-0 w-24 text-right">
                    {formatDate(item.date)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
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
          <p className="text-[11px] text-slate-400 font-medium">
            Halaman <span className="font-bold text-slate-600">{currentPage}</span> dari{" "}
            <span className="font-bold text-slate-600">{totalPages}</span> · {filteredNews.length} artikel
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                      currentPage === page
                        ? "bg-[#1b365d] text-white shadow-sm"
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Selanjutnya <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
