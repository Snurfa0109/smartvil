"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        const ref = doc(db, "news", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setNotFound(true);
          setItem(null);
          return;
        }
        setItem({
          id: snap.id,
          ...(snap.data() as Omit<BeritaItem, "id">),
        });
      } catch (error) {
        console.error("Error fetching berita:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBerita();
  }, [id]);

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
            className="prose prose-orange max-w-none berita-detail-content text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html:
                typeof item.content === "string" && item.content
                  ? item.content
                  : "<p>Belum ada konten untuk berita ini.</p>",
            }}
          />
        </article>
      </div>
    </div>
  );
}
