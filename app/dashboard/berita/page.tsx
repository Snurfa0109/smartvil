"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { writeAuditLog } from "@/lib/audit";

export default function BeritaDashboardPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const fetchNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "news"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNews(data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus berita ini?")) {
      try {
        const deletedItem = news.find((n) => n.id === id);
        await deleteDoc(doc(db, "news", id));
        await writeAuditLog(
          "DELETE",
          "berita",
          `Menghapus artikel berita: "${deletedItem?.title || id}"`
        );
        fetchNews();
      } catch (error) {
        console.error("Error deleting news:", error);
        alert("Gagal menghapus berita.");
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredNews = news.filter(n =>
    n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Berita</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola berita, pengumuman, dan artikel publik kelurahan.</p>
        </div>
        <Link
          href="/dashboard/berita/tambah"
          className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold h-9 px-4 text-xs bg-[#1b365d] text-white hover:bg-[#152a48] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Berita
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari judul atau kategori..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Berita & Artikel</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Memuat daftar berita...</div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Belum ada berita.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Judul</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kategori</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tanggal</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {paginatedNews.map((item) => (
                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl || "/images/default-news.jpg"}
                            alt={item.title || "Cover"}
                            className="w-12 h-9 rounded object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-2xs"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/images/default-news.jpg";
                            }}
                          />
                          <span className="line-clamp-2">{item.title}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 align-middle">{item.date}</td>
                      <td className="p-4 align-middle">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/berita/${item.id}/edit`}
                            className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {filteredNews.length > 0 && (
          <div className="flex items-center justify-end space-x-2 p-4 border-t">
            <div className="flex-1 text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages} ({filteredNews.length} data)
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
