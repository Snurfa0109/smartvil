"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiList } from "@/lib/api";
import { Calendar, ArrowLeft, ArrowRight, Tag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";
import { SocialShare } from "@/components/berita/social-share";

type BeritaItem = {
  id: string;
  title?: string;
  content?: string;
  date?: string;
  category?: string;
  imageUrl?: string;
};

export default function BeritaDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;

  const [item, setItem] = useState<BeritaItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<BeritaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const fetchBerita = async () => {
      try {
        const data = await apiGet("news", id);
        if (!data) {
          setNotFound(true);
          setItem(null);
          return;
        }
        setItem({
          id: String(data.id),
          title: String(data.title || ""),
          content: String(data.content || ""),
          date: String(data.date || ""),
          category: String(data.category || ""),
          imageUrl: String(data.image_url || ""),
        });
        fetch("/api/news/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }).catch(() => {});

        // Fetch related / other news
        try {
          const rows = await apiList("news", { orderBy: "date", order: "desc", limit: 4 });
          const others = (rows || [])
            .filter((r) => String(r.id) !== id)
            .slice(0, 3)
            .map((r) => ({
              id: String(r.id),
              title: String(r.title || ""),
              content: String(r.content || ""),
              date: String(r.date || ""),
              category: String(r.category || ""),
              imageUrl: String(r.image_url || ""),
            }));
          setRelatedItems(others);
        } catch {
          // ignore
        }
      } catch (error) {
        console.error("Error fetching berita:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBerita();
  }, [id]);
  // Set page title dynamically from article
  useEffect(() => {
    if (item?.title) {
      document.title = `${item.title} | Berita`;
    } else {
      document.title = "Berita | Kelurahan";
    }
  }, [item?.title]);


  if (loading) {
    return (
      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-10 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="container mx-auto px-6 md:px-12 py-12 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground mb-4">
          Berita tidak ditemukan
        </h1>
        <p className="text-muted-foreground mb-6">
          Halaman atau berita yang Anda cari mungkin telah dihapus atau alamat salah.
        </p>
        <Button asChild variant="outline">
          <Link href="/berita">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Berita
          </Link>
        </Button>
      </div>
    );
  }

  const dateLabel = item.date
    ? new Date(item.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="container mx-auto px-6 md:px-12 py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/berita"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Berita
        </Link>

        <article className="space-y-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {dateLabel}
              </span>
              {item.category && (
                <span className="inline-flex items-center rounded-full bg-[#1b365d]/10 text-[#1b365d] px-3 py-1 font-semibold text-xs">
                  {item.category}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {item.title || "Berita Kelurahan"}
            </h1>
          </header>

          <div className="w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl || "/images/default-news.jpg"}
              alt={item.title || "Berita Kelurahan"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/images/default-news.jpg";
              }}
            />
          </div>

          <div
            className="prose prose-orange max-w-none berita-detail-content text-slate-700 leading-relaxed pt-2"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                typeof item.content === "string" && item.content
                  ? item.content
                  : "<p>Belum ada konten untuk berita ini.</p>"
              ),
            }}
          />

          {/* Social Share Bar */}
          <div className="pt-4 border-t border-slate-200">
            <SocialShare title={item.title || "Berita Kelurahan Banjar Agung"} />
          </div>
        </article>

        {/* Warta Lainnya */}
        {relatedItems.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Warta Terkait Lainnya</h2>
              <Link href="/berita" className="text-xs font-semibold text-[#1b365d] hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedItems.map((r) => (
                <Link key={r.id} href={`/berita/${r.id}`} className="group block bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#1b365d] hover:shadow-xs transition-all">
                  <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.imageUrl || "/images/default-news.jpg"}
                      alt={r.title || "Warta"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/default-news.jpg";
                      }}
                    />
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    {r.category && (
                      <span className="text-[10px] font-semibold text-[#1b365d] bg-[#1b365d]/8 px-2 py-0.5 rounded">
                        {r.category}
                      </span>
                    )}
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#1b365d] line-clamp-2 leading-snug">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
