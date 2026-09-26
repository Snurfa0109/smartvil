"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNewsItems(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const categories = Array.from(
    new Set(
      newsItems
        .map((n) => n.category as string | undefined)
        .filter((c): c is string => Boolean(c))
    )
  );

  const filteredNews =
    selectedCategory && selectedCategory !== "Semua"
      ? newsItems.filter((item) => item.category === selectedCategory)
      : newsItems;

  const archives = (() => {
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
  })();

  return (
    <div className="container mx-auto px-6 md:px-12 py-12">
      {/* Header */}
      <div className="mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#1b365d]/10 text-[#1b365d] border border-[#1b365d]/20 mb-3">
          Warta & Pengumuman
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Berita &amp; Pengumuman</h1>
        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
          Informasi terkini seputar kegiatan, program, dan perkembangan Kelurahan Banjar Agung.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main news list */}
        <div className="md:col-span-2 space-y-5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex gap-4 animate-pulse">
                <div className="w-40 h-36 bg-slate-200 shrink-0" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-200 rounded" />
                  <div className="h-3 w-5/6 bg-slate-200 rounded" />
                </div>
              </div>
            ))
          ) : filteredNews.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-slate-500 font-medium">Belum ada berita terkini.</p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-[#1b365d] mt-2 underline"
                >
                  Tampilkan semua kategori
                </button>
              )}
            </div>
          ) : (
            filteredNews.map((item) => (
              <Link key={item.id} href={`/berita/${item.id}`}>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col md:flex-row hover:border-[#1b365d] hover:shadow-md transition-all duration-150 group">
                  <div className="w-full md:w-52 h-44 md:h-auto bg-slate-100 shrink-0 overflow-hidden relative">
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
                  <div className="flex-1 p-5">
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      {item.category && (
                        <span className="bg-[#1b365d]/10 text-[#1b365d] px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-[#1b365d] transition-colors line-clamp-2">
                      {item.title}
                    </h2>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-3">
                      {item.content}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1b365d] group-hover:underline">
                      Baca Selengkapnya <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Kategori Berita</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                  !selectedCategory || selectedCategory === "Semua"
                    ? "bg-[#1b365d] text-white border-[#1b365d]"
                    : "bg-white text-slate-600 border-slate-300 hover:border-[#1b365d] hover:text-[#1b365d]"
                }`}
              >
                Semua ({newsItems.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                    selectedCategory === cat
                      ? "bg-[#1b365d] text-white border-[#1b365d]"
                      : "bg-white text-slate-600 border-slate-300 hover:border-[#1b365d] hover:text-[#1b365d]"
                  }`}
                >
                  {cat}
                </button>
              ))}
              {loading && <span className="text-xs text-slate-400">Memuat...</span>}
            </div>
          </div>

          {/* Archive */}
          {archives.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-sm text-slate-900 mb-3">Arsip Berita</h3>
              <ul className="space-y-2">
                {archives.map((a) => (
                  <li key={a.key} className="flex items-center justify-between text-xs text-slate-600 py-1.5 border-b border-slate-100 last:border-0">
                    <span>{a.label}</span>
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">{a.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
