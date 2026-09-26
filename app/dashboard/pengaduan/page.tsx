"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Trash2, MessageSquare, Image as ImageIcon, Send, ExternalLink, X, PhoneCall } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function PengaduanDashboardPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "complaints", id), {
        status: newStatus,
      });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Gagal memperbarui status pengaduan.");
    }
  };

  const handleSaveReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSavingReply(true);
    try {
      await updateDoc(doc(db, "complaints", id), {
        adminResponse: replyText.trim(),
        status: selectedComplaint?.status === "pending" ? "processed" : selectedComplaint?.status,
      });
      alert("Tanggapan resmi berhasil disimpan dan dapat dibaca oleh pelapor.");
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint((prev: any) => ({
          ...prev,
          adminResponse: replyText.trim(),
          status: prev.status === "pending" ? "processed" : prev.status,
        }));
      }
    } catch (error) {
      console.error("Error saving reply:", error);
      alert("Gagal menyimpan tanggapan.");
    } finally {
      setSavingReply(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengaduan ini secara permanen?")) {
      try {
        await deleteDoc(doc(db, "complaints", id));
        if (selectedComplaint?.id === id) setSelectedComplaint(null);
        fetchComplaints();
      } catch (error) {
        console.error("Error deleting complaint:", error);
        alert("Gagal menghapus pengaduan.");
      }
    }
  };

  const handleSendWhatsApp = (item: any) => {
    if (!item.phone) {
      alert("Pelapor tidak mencantumkan nomor telepon.");
      return;
    }
    let clean = item.phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.substring(1);

    let statusText = "sedang menunggu tindak lanjut dari petugas";
    if (item.status === "processed") {
      statusText = "sedang ditangani dan diproses oleh pihak kelurahan";
    } else if (item.status === "completed" || item.status === "resolved") {
      statusText = "telah selesai ditangani oleh pihak kelurahan";
    }

    const message = encodeURIComponent(
      `*INFORMASI PENGADUAN - KELURAHAN BANJAR AGUNG*\n\n` +
      `Yth. Bpk/Ibu *${item.nama || "Pelapor"}*,\n\n` +
      `Kami menginformasikan bahwa pengaduan Anda:\n` +
      `• *Judul:* ${item.title || item.judul || "Laporan Pengaduan"}\n` +
      `• *Nomor Tiket:* ${item.ticketCode || "-"}\n` +
      `• *Status:* ${statusText}.\n\n` +
      (item.adminResponse ? `*Tanggapan Resmi Kami:*\n${item.adminResponse}\n\n` : "") +
      `Jika ada pertanyaan, silakan balas pesan ini.\n\n` +
      `_Pemerintah Kelurahan Banjar Agung, Kec. Cipocok Jaya, Kota Serang_`
    );
    window.open(`https://wa.me/${clean}?text=${message}`, "_blank");
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat daftar pengaduan...</div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daftar Pengaduan Masuk</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kelola dan tindak lanjuti aspirasi serta keluhan warga kelurahan.</p>
        </div>
        <div className="text-sm bg-[#1b365d]/10 text-[#1b365d] border border-[#1b365d]/20 px-3 py-1.5 rounded-lg font-semibold">
          Total: {complaints.length} Laporan
        </div>
      </div>

      <div className="grid gap-4">
        {complaints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Belum ada pengaduan yang masuk dari warga.</p>
            </CardContent>
          </Card>
        ) : (
          complaints.map((item) => {
            const title = item.title || item.judul || "Laporan Pengaduan";
            const message = item.message || item.isi || "(Tanpa isi pesan)";
            const isDone = item.status === "resolved" || item.status === "completed";
            const isProcessed = item.status === "processed";

            return (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-medium">{title}</CardTitle>
                      {item.ticketCode && (
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-muted-foreground">
                          {item.ticketCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kategori: <span className="font-semibold text-foreground">{item.category || "Umum"}</span>
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isDone ? "bg-green-100 text-green-700" :
                    isProcessed ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {isDone ? "Selesai" : isProcessed ? "Diproses" : "Menunggu"}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{message}</p>
                  
                  <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2 pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <span>Pelapor: <strong className="text-foreground">{item.nama || "Anonim"}</strong></span>
                      {item.phone && <span>WA/HP: <strong>{item.phone}</strong></span>}
                      {item.photoUrl && (
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <ImageIcon className="h-3 w-3" /> Ada Foto
                        </span>
                      )}
                      {item.adminResponse && (
                        <span className="text-emerald-600 font-medium">✓ Sudah Ditanggapi</span>
                      )}
                    </div>
                    <span>
                      {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("id-ID") : "-"}
                    </span>
                  </div>

                  <div className="flex gap-2 justify-end pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedComplaint(item);
                        setReplyText(item.adminResponse || "");
                      }}
                    >
                      Detail & Tanggapi
                    </Button>
                    {!isProcessed && !isDone && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item.id, "processed")}>
                        <Clock className="mr-2 h-3 w-3" /> Proses
                      </Button>
                    )}
                    {!isDone && (
                      <Button size="sm" onClick={() => handleStatusUpdate(item.id, "completed")}>
                        <CheckCircle className="mr-2 h-3 w-3" /> Selesai
                      </Button>
                    )}
                    {item.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => handleSendWhatsApp(item)}
                        title="Kirim pemberitahuan status via WhatsApp ke pelapor"
                      >
                        <PhoneCall className="mr-1.5 h-3.5 w-3.5" /> WA Pelapor
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail & Reply Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white relative my-8 max-h-[90vh] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Detail & Tanggapan Pengaduan</CardTitle>
                  {selectedComplaint.ticketCode && (
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      No. Tiket: {selectedComplaint.ticketCode}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedComplaint(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm bg-slate-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Pelapor</p>
                  <p className="font-semibold">{selectedComplaint.nama || "Anonim"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kontak (WA/Telp)</p>
                  <p className="font-semibold">{selectedComplaint.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedComplaint.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                  <p className="font-semibold">{selectedComplaint.category || "Umum"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Laporan</p>
                  <p className="font-semibold">
                    {selectedComplaint.createdAt?.seconds
                      ? new Date(selectedComplaint.createdAt.seconds * 1000).toLocaleString("id-ID")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status Saat Ini</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selectedComplaint.status === "completed" || selectedComplaint.status === "resolved"
                      ? "bg-green-100 text-green-700"
                      : selectedComplaint.status === "processed"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {selectedComplaint.status === "completed" || selectedComplaint.status === "resolved"
                      ? "Selesai"
                      : selectedComplaint.status === "processed"
                      ? "Diproses"
                      : "Menunggu"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Judul Pengaduan
                </p>
                <p className="text-base font-bold text-foreground">
                  {selectedComplaint.title || selectedComplaint.judul}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Isi Laporan Warga
                </p>
                <div className="bg-slate-50 border p-3.5 rounded-md text-sm whitespace-pre-line leading-relaxed">
                  {selectedComplaint.message || selectedComplaint.isi || "-"}
                </div>
              </div>

              {selectedComplaint.photoUrl && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Bukti Foto Lapangan
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedComplaint.photoUrl}
                    alt="Bukti foto"
                    className="h-44 rounded-lg border object-cover cursor-pointer hover:opacity-95"
                    onClick={() => setImageModalUrl(selectedComplaint.photoUrl)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Klik gambar untuk melihat ukuran penuh.</p>
                </div>
              )}

              {/* Tanggapan Form */}
              <div className="border-t pt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tulis Tanggapan Resmi / Catatan Tindak Lanjut
                </p>
                <p className="text-xs text-muted-foreground">
                  Tanggapan ini akan dapat dilihat langsung oleh pelapor saat mengecek status pengaduannya.
                </p>
                <Textarea
                  placeholder="Contoh: Tim perbaikan sarana desa telah mengecek ke lokasi dan perbaikan dijadwalkan pada hari Jumat..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[90px]"
                />
                <div className="flex justify-between items-center pt-1">
                  <div className="flex gap-2">
                    {selectedComplaint.status !== "processed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedComplaint.id, "processed")}
                      >
                        <Clock className="mr-1.5 h-3.5 w-3.5" /> Tandai Diproses
                      </Button>
                    )}
                    {selectedComplaint.status !== "completed" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleStatusUpdate(selectedComplaint.id, "completed")}
                      >
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Tandai Selesai
                      </Button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSaveReply(selectedComplaint.id)}
                    disabled={savingReply}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> {savingReply ? "Menyimpan..." : "Simpan Tanggapan"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Image Modal */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-10 right-0 text-white bg-black/50 p-2 rounded-full hover:bg-black"
            >
              <X className="h-6 w-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageModalUrl} alt="Bukti Foto Penuh" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
