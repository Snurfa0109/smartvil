"use client";

/**
 * [HALAMAN USER / WARGA] Riwayat Pengajuan Surat & Pengaduan Mandiri
 * Dashboard warga untuk memantau status permohonan surat keterangan dan pengaduan aspirasi.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageBanner } from "@/components/layout/page-banner";
import { useCitizen } from "@/contexts/CitizenContext";
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ArrowRight, 
  Calendar, 
  User, 
  Tag, 
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RequestItem {
  id: string;
  ticket_code: string;
  type: string;
  type_name: string;
  nama: string;
  status: string;
  admin_notes?: string;
  created_at: string;
}

interface ComplaintItem {
  id: string;
  ticket_code: string;
  category: string;
  title: string;
  message: string;
  status: string;
  admin_response?: string;
  created_at: string;
}

export default function CitizenHistoryPage() {
  const { citizen, loading: authLoading } = useCitizen();
  const [activeTab, setActiveTab] = useState<"requests" | "complaints">("requests");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/citizen-history", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Gagal memuat riwayat");
      const data = await res.json();
      setRequests(data.requests || []);
      setComplaints(data.complaints || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (citizen) {
      fetchHistory();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [citizen, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "selesai":
      case "approved":
      case "disetujui":
        return {
          label: "Selesai",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
        };
      case "processed":
      case "processing":
      case "diproses":
        return {
          label: "Sedang Diproses",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: RefreshCw,
        };
      case "rejected":
      case "ditolak":
        return {
          label: "Ditolak",
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: XCircle,
        };
      case "pending":
      case "menunggu":
      default:
        return {
          label: "Menunggu Antrean",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <PageBanner
        pageKey="riwayat"
        overrideTitle="Riwayat Pengajuan & Pengaduan Anda"
        overrideSubtitle="Pantau seluruh pengajuan surat dan pelaporan aspirasi yang telah Anda kirimkan kepada Kelurahan Banjar Agung."
        overrideBadge="PORTAL WARGA"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 sm:p-3 flex gap-2">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 ${
              activeTab === "requests"
                ? "bg-[#1b365d] text-white shadow-md shadow-slate-900/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Pengajuan Surat</span>
            {requests.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === "requests" ? "bg-amber-400 text-slate-950" : "bg-slate-200 text-slate-700"
              }`}>
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("complaints")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 ${
              activeTab === "complaints"
                ? "bg-[#1b365d] text-white shadow-md shadow-slate-900/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Pengaduan Aspirasi</span>
            {complaints.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === "complaints" ? "bg-amber-400 text-slate-950" : "bg-slate-200 text-slate-700"
              }`}>
                {complaints.length}
              </span>
            )}
          </button>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#1b365d]" />
              <p className="text-sm font-medium">Memuat riwayat pengajuan Anda...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-red-800">Gagal Memuat Data</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <Button onClick={fetchHistory} variant="outline" className="mt-4 text-xs font-semibold">
                Coba Lagi
              </Button>
            </div>
          ) : activeTab === "requests" ? (
            requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Belum Ada Riwayat Pengajuan</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                  Anda belum pernah mengajukan permohonan surat keterangan online. Ajukan surat kebutuhan administrasi Anda secara mandiri dan cepat.
                </p>
                <Link href="/layanan">
                  <Button className="mt-6 bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold">
                    Buat Pengajuan Surat
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const BadgeIcon = badge.icon;
                  return (
                    <Card key={item.id} className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden">
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                                {item.ticket_code}
                              </span>
                              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                                <BadgeIcon className="w-3.5 h-3.5" />
                                <span>{badge.label}</span>
                              </div>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-[#1b365d]">
                              {item.type_name || item.type}
                            </h3>

                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(item.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {item.nama}
                              </span>
                            </div>
                          </div>

                          <Link href={`/layanan?tab=track&ticket=${encodeURIComponent(item.ticket_code)}`}>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs font-semibold hover:border-[#1b365d] hover:text-[#1b365d]">
                              Lacak Tiket
                              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                          </Link>
                        </div>

                        {item.admin_notes && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-xs sm:text-sm border border-slate-100">
                              <span className="font-bold text-slate-700 block mb-1">Catatan Petugas:</span>
                              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{item.admin_notes}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            complaints.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Belum Ada Riwayat Pengaduan</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                  Anda belum pernah menyampaikan aspirasi atau aduan terkait lingkungan Kelurahan Banjar Agung. Sampaikan keluhan Anda untuk perbaikan bersama.
                </p>
                <Link href="/pengaduan">
                  <Button className="mt-6 bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold">
                    Tulis Pengaduan Baru
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const BadgeIcon = badge.icon;
                  return (
                    <Card key={item.id} className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden">
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                                {item.ticket_code}
                              </span>
                              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                                <BadgeIcon className="w-3.5 h-3.5" />
                                <span>{badge.label}</span>
                              </div>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-[#1b365d]">
                              {item.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(item.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5" />
                                {item.category}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                              {item.message}
                            </p>
                          </div>

                          <Link href={`/pengaduan?tab=track&ticket=${encodeURIComponent(item.ticket_code)}`}>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs font-semibold hover:border-[#1b365d] hover:text-[#1b365d]">
                              Lacak Tiket
                              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                          </Link>
                        </div>

                        {item.admin_response && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="bg-emerald-50/60 rounded-xl p-3 sm:p-4 text-xs sm:text-sm border border-emerald-100">
                              <span className="font-bold text-emerald-900 block mb-1">Tanggapan Kelurahan:</span>
                              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{item.admin_response}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
