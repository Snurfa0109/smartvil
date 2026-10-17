"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiList, apiUpdate, apiDelete } from "@/lib/api";
import { CheckCircle, Clock, Trash2, MessageSquare, Image as ImageIcon, Send, X, PhoneCall, Search, RotateCcw, User, AlertTriangle, Inbox } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { usePolling } from "@/hooks/use-polling";

interface ComplaintItem {
  id: string;
  title: string;
  nama: string;
  email: string;
  phone: string;
  category: string;
  message: string;
  photoUrl: string;
  status: string;
  adminResponse: string;
  createdAt: unknown;
  ticketCode: string;
  judul?: string;
  isi?: string;
}

export default function PengaduanDashboardPage() {
  const { success, error: showError, warning, confirm: showConfirm } = useToast();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [filterPhone, setFilterPhone] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    try {
      const rows = await apiList("complaints", { orderBy: "created_at", order: "desc" });
      setComplaints(
        (rows || []).map((row) => ({
          id: String(row.id),
          title: String(row.title || ""),
          nama: String(row.nama || ""),
          email: String(row.email || ""),
          phone: String(row.phone || ""),
          category: String(row.category || ""),
          message: String(row.message || ""),
          photoUrl: String(row.photo_url || ""),
          status: String(row.status || ""),
          adminResponse: String(row.admin_response || ""),
          createdAt: row.created_at,
          ticketCode: String(row.ticket_code || ""),
        }))
      );
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  usePolling(fetchComplaints, 15_000);

  const phoneCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => {
      if (c.phone) {
        const clean = c.phone.replace(/\D/g, "");
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      }
    });
    return counts;
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (filterPhone) {
        const clean = item.phone?.replace(/\D/g, "") || "";
        if (clean !== filterPhone) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = (item.title || item.judul || "").toLowerCase().includes(q);
        const matchName = (item.nama || "").toLowerCase().includes(q);
        const matchPhone = (item.phone || "").toLowerCase().includes(q);
        const matchCategory = (item.category || "").toLowerCase().includes(q);
        const matchMsg = (item.message || item.isi || "").toLowerCase().includes(q);
        if (!matchTitle && !matchName && !matchPhone && !matchCategory && !matchMsg) return false;
      }
      return true;
    });
  }, [complaints, searchTerm, filterPhone]);

  const pendingCount = complaints.filter((c) => c.status === "pending" || (!c.status)).length;
  const completedCount = complaints.filter((c) => c.status === "completed" || c.status === "resolved").length;

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await apiUpdate("complaints", id, { status: newStatus });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint((prev) => prev ? ({ ...prev, status: newStatus }) : prev);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showError("Gagal memperbarui status pengaduan.");
    }
  };

  const handleSaveReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSavingReply(true);
    try {
      await apiUpdate("complaints", id, {
        admin_response: replyText.trim(),
        status: selectedComplaint?.status === "pending" ? "processed" : selectedComplaint?.status,
      });
      success("Tanggapan resmi berhasil disimpan dan dapat dibaca oleh pelapor.");
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint((prev) => prev ? ({
          ...prev,
          adminResponse: replyText.trim(),
          status: prev.status === "pending" ? "processed" : prev.status,
        }) : prev);
      }
    } catch (error) {
      console.error("Error saving reply:", error);
      showError("Gagal menyimpan tanggapan.");
    } finally {
      setSavingReply(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: "Hapus Pengaduan?",
      message: "Apakah Anda yakin ingin menghapus pengaduan ini secara permanen?",
      variant: "danger",
      confirmLabel: "Ya, Hapus",
    });
    if (confirmed) {
      try {
        await apiDelete("complaints", id);
        if (selectedComplaint?.id === id) setSelectedComplaint(null);
        fetchComplaints();
      } catch (error) {
        console.error("Error deleting complaint:", error);
        showError("Gagal menghapus pengaduan.");
      }
    }
  };

  const handleSendWhatsApp = (item: ComplaintItem) => {
    if (!item.phone) {
      warning("Pelapor tidak mencantumkan nomor telepon.");
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
      `• *Status:* ${statusText}.\n\n` +
      (item.adminResponse ? `*Tanggapan Resmi Kami:*\n${item.adminResponse}\n\n` : "") +
      `Jika ada pertanyaan, silakan balas pesan ini.\n\n` +
      `_Pemerintah Kelurahan Banjar Agung, Kec. Cipocok Jaya, Kota Serang_`
    );
    window.open(`https://wa.me/${clean}?text=${message}`, "_blank");
  };

  const statCards = [
    {
      label: "Total Pengaduan",
      value: complaints.length,
      icon: <MessageSquare className="h-[18px] w-[18px]" />,
      iconBg: "bg-[#1b365d]/10",
      iconText: "text-[#1b365d]",
      numText: "text-[#1b365d]",
      accentBar: "bg-[#1b365d]",
    },
    {
      label: "Menunggu",
      value: pendingCount,
      icon: <Clock className="h-[18px] w-[18px]" />,
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      numText: "text-amber-700",
      accentBar: "bg-amber-500",
    },
    {
      label: "Selesai",
      value: completedCount,
      icon: <CheckCircle className="h-[18px] w-[18px]" />,
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      numText: "text-emerald-700",
      accentBar: "bg-emerald-500",
    },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-3 font-medium">Memuat daftar pengaduan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-md shadow-[#1b365d]/15">
            <AlertTriangle className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Daftar Pengaduan Masuk</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">Kelola dan tindak lanjuti aspirasi serta keluhan warga kelurahan</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="dash-card group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white transition-all duration-300 hover:shadow-md hover:border-slate-300/80"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`h-[3px] ${stat.accentBar}`} />
            <div className="p-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className={`text-2xl font-extrabold mt-1 tabular-nums tracking-tight ${stat.numText}`}>
                  {stat.value.toLocaleString("id-ID")}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} ${stat.iconText} flex items-center justify-center shrink-0 dash-icon-box`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, telepon, atau judul laporan..."
            className="w-full pl-9 pr-8 h-9 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1 focus-visible:ring-[#1b365d] transition-all duration-300"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filterPhone && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold px-3 py-2 rounded-xl shrink-0">
            <span>Filter No: <strong>{filterPhone}</strong></span>
            <button
              onClick={() => setFilterPhone(null)}
              className="text-blue-600 hover:text-blue-900"
              title="Hapus filter nomor"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {(searchTerm || filterPhone) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterPhone(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b365d] hover:underline shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Complaints List */}
      <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1b365d]/[0.06] flex items-center justify-center">
              <Inbox className="h-4 w-4 text-[#1b365d]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-800">Laporan Masuk</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {filteredComplaints.length === complaints.length ? (
                  <><span className="tabular-nums font-semibold text-slate-500">{complaints.length}</span> pengaduan tercatat</>
                ) : (
                  <><span className="tabular-nums font-semibold text-slate-500">{filteredComplaints.length}</span> dari {complaints.length} pengaduan</>
                )}
              </p>
            </div>
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-700">Tidak ditemukan pengaduan</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau hapus filter aktif.</p>
            {(searchTerm || filterPhone) && (
              <button
                type="button"
                onClick={() => { setSearchTerm(""); setFilterPhone(null); }}
                className="mt-3 text-xs font-semibold text-[#1b365d] hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredComplaints.map((item) => {
              const title = item.title || item.judul || "Laporan Pengaduan";
              const message = item.message || item.isi || "(Tanpa isi pesan)";
              const isDone = item.status === "resolved" || item.status === "completed";
              const isProcessed = item.status === "processed";
              const cleanPhone = item.phone ? item.phone.replace(/\D/g, "") : "";
              const countForPhone = cleanPhone ? phoneCountMap[cleanPhone] || 1 : 1;

              const statusAccent = isDone
                ? "from-emerald-500 to-emerald-400"
                : isProcessed
                ? "from-blue-500 to-blue-400"
                : "from-amber-500 to-amber-400";

              return (
                <div
                  key={item.id}
                  className="dash-card group rounded-xl border border-slate-200/70 bg-white overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300/80"
                >
                  <div className={`h-[3px] bg-gradient-to-r ${statusAccent}`} />
                  <div className="p-4">
                    {/* Row 1: Title + badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            isDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                            isProcessed ? "bg-blue-50 text-blue-700 border border-blue-200/60" :
                            "bg-amber-50 text-amber-700 border border-amber-200/60"
                          }`}>
                            {isDone ? "Selesai" : isProcessed ? "Diproses" : "Menunggu"}
                          </span>
                          {item.category && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#1b365d]/[0.06] text-[#1b365d]">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{message}</p>
                      </div>
                      {item.ticketCode && (
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded-lg text-slate-500 border border-slate-200/70 shrink-0 tabular-nums">
                          {item.ticketCode}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Reporter info + meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-100/80 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-[#1b365d]/[0.06] flex items-center justify-center">
                          <User className="w-3 h-3 text-[#1b365d]" />
                        </div>
                        <strong className="text-slate-700">{item.nama || "Warga"}</strong>
                      </span>
                      {item.phone && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">WA: <strong className="text-slate-700">{item.phone}</strong></span>
                          {countForPhone > 1 && (
                            <button
                              type="button"
                              onClick={() => setFilterPhone(cleanPhone)}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 hover:bg-blue-100 transition-colors"
                              title="Filter semua laporan dari warga ini"
                            >
                              {countForPhone}x Melapor
                            </button>
                          )}
                        </div>
                      )}
                      {item.photoUrl && (
                        <span className="inline-flex items-center gap-1 text-[#1b365d] font-bold">
                          <ImageIcon className="h-3 w-3" /> Foto
                        </span>
                      )}
                      {item.adminResponse && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle className="h-3 w-3" /> Ditanggapi
                        </span>
                      )}
                      <span className="text-slate-400 tabular-nums ml-auto">
                        {item.createdAt ? new Date(typeof item.createdAt === "string" ? item.createdAt : (item.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </span>
                    </div>

                    {/* Row 3: Actions */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100/80">
                      <button
                        onClick={() => {
                          setSelectedComplaint(item);
                          setReplyText(item.adminResponse || "");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b365d] hover:bg-[#152a48] text-white rounded-lg text-[11px] font-bold transition-colors shadow-sm"
                      >
                        <MessageSquare className="h-3 w-3" /> Detail & Tanggapi
                      </button>
                      {!isProcessed && !isDone && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "processed")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-colors"
                        >
                          <Clock className="h-3 w-3" /> Proses
                        </button>
                      )}
                      {!isDone && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "completed")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3" /> Selesai
                        </button>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        {item.phone && (
                          <button
                            onClick={() => handleSendWhatsApp(item)}
                            className="inline-flex items-center justify-center w-8 h-8 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Kirim pemberitahuan via WhatsApp"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center justify-center w-8 h-8 border border-slate-200 bg-white text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                          title="Hapus pengaduan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl relative my-8 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[#1b365d] to-[#264478] px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-[15px] font-bold text-white">Detail & Tanggapan Pengaduan</h2>
                {selectedComplaint.ticketCode && (
                  <p className="text-[11px] font-mono text-white/60 mt-0.5">
                    No. Registrasi: {selectedComplaint.ticketCode}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-6 overflow-y-auto">
              {/* Reporter History Banner */}
              {selectedComplaint.phone && (
                <div className="bg-blue-50 border border-blue-200/70 rounded-xl p-3.5 text-[11px] text-blue-900 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold">Riwayat Pelapor:</span> Warga dengan nomor telepon <strong>{selectedComplaint.phone}</strong> telah mengirim sebanyak <strong>{phoneCountMap[selectedComplaint.phone.replace(/\D/g, "")] || 1} kali laporan</strong>.
                  </div>
                  <button
                    onClick={() => {
                      setFilterPhone(selectedComplaint.phone.replace(/\D/g, ""));
                      setSelectedComplaint(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 border border-blue-300 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors shrink-0"
                  >
                    Lihat Semua ({phoneCountMap[selectedComplaint.phone.replace(/\D/g, "")] || 1})
                  </button>
                </div>
              )}

              {/* Reporter Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50/80 border border-slate-100 p-4 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pelapor</p>
                  <p className="text-[13px] font-semibold text-slate-800 mt-1">{selectedComplaint.nama || "Warga"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kontak (WA/Telp)</p>
                  <p className="text-[13px] font-semibold text-slate-800 mt-1">{selectedComplaint.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-[13px] font-semibold text-slate-800 mt-1">{selectedComplaint.email || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</p>
                  <p className="text-[13px] font-semibold text-slate-800 mt-1">{selectedComplaint.category || "Umum"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Laporan</p>
                  <p className="text-[13px] font-semibold text-slate-800 mt-1">
                    {selectedComplaint.createdAt
                      ? new Date(typeof selectedComplaint.createdAt === "string" ? selectedComplaint.createdAt : (selectedComplaint.createdAt as { seconds: number }).seconds * 1000).toLocaleString("id-ID")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Saat Ini</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    selectedComplaint.status === "completed" || selectedComplaint.status === "resolved"
                      ? "bg-emerald-50 text-emerald-700"
                      : selectedComplaint.status === "processed"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {selectedComplaint.status === "completed" || selectedComplaint.status === "resolved"
                      ? "Selesai"
                      : selectedComplaint.status === "processed"
                      ? "Diproses"
                      : "Menunggu"}
                  </span>
                </div>
              </div>

              {/* Complaint Title */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Judul Pengaduan
                </p>
                <p className="text-[15px] font-bold text-slate-900">
                  {selectedComplaint.title || selectedComplaint.judul}
                </p>
              </div>

              {/* Complaint Content */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Isi Laporan Warga
                </p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-[13px] text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedComplaint.message || selectedComplaint.isi || "-"}
                </div>
              </div>

              {/* Photo Evidence */}
              {selectedComplaint.photoUrl && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Bukti Foto Lapangan
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedComplaint.photoUrl}
                    alt="Bukti foto"
                    className="h-44 rounded-xl border border-slate-200/70 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setImageModalUrl(selectedComplaint.photoUrl)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5">Klik gambar untuk melihat ukuran penuh.</p>
                </div>
              )}

              {/* Admin Response Section */}
              <div className="border-t border-slate-100 pt-5 space-y-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tulis Tanggapan Resmi / Catatan Tindak Lanjut
                </p>
                <p className="text-[11px] text-slate-400">
                  Tanggapan ini akan dapat dilihat langsung oleh pelapor saat mengecek status pengaduannya.
                </p>
                <textarea
                  placeholder="Contoh: Tim perbaikan sarana desa telah mengecek ke lokasi dan perbaikan dijadwalkan pada hari Jumat..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full min-h-[90px] px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1 focus-visible:ring-[#1b365d] transition-all duration-300 resize-y"
                />
                <div className="flex justify-between items-center pt-1">
                  <div className="flex gap-2">
                    {selectedComplaint.status !== "processed" && (
                      <button
                        onClick={() => handleStatusUpdate(selectedComplaint.id, "processed")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <Clock className="h-3.5 w-3.5" /> Tandai Diproses
                      </button>
                    )}
                    {selectedComplaint.status !== "completed" && (
                      <button
                        onClick={() => handleStatusUpdate(selectedComplaint.id, "completed")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-colors shadow-sm"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Tandai Selesai
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleSaveReply(selectedComplaint.id)}
                    disabled={savingReply}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1b365d] hover:bg-[#152a48] text-white rounded-lg text-[11px] font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" /> {savingReply ? "Menyimpan..." : "Simpan Tanggapan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageModalUrl} alt="Bukti Foto Penuh" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
