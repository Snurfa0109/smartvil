"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Plus,
  AlertCircle,
  Inbox,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiCount, apiList } from "@/lib/api";

interface DashboardStats {
  residents: number;
  news: number;
  complaints: number;
  requests: number;
}

interface RequestBreakdown {
  pending: number;
  processed: number;
  ready: number;
  completed: number;
}

interface ActivityItem {
  id: string;
  kind: "request" | "complaint";
  title: string;
  detail: string;
  nama: string;
  status: string;
  category?: string;
  createdAt?: string | number | Date;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    residents: 0,
    news: 0,
    complaints: 0,
    requests: 0,
  });

  const [requestBreakdown, setRequestBreakdown] = useState<RequestBreakdown>({
    pending: 0,
    processed: 0,
    ready: 0,
    completed: 0,
  });

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityTab, setActivityTab] = useState<"all" | "requests" | "complaints">("all");
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<keyof RequestBreakdown>("pending");
  const [dateLabel, setDateLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const formatted = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
      setDateLabel(formatted);
    } catch {
      setDateLabel("Pelayanan Aktif");
    }

    const fetchData = async () => {
      try {
        const [
          pendingComplaints,
          residentsTotal,
          newsTotal,
          reqPending,
          reqProcessed,
          reqReady,
          reqCompleted,
          recentComplaintRows,
          recentRequestRows,
        ] = await Promise.all([
          apiCount("complaints", { column: "status", value: "pending" }),
          apiCount("residents"),
          apiCount("news"),
          apiCount("requests", { column: "status", value: "pending" }),
          apiCount("requests", { column: "status", value: "processed" }),
          apiCount("requests", { column: "status", value: "ready" }),
          apiCount("requests", { column: "status", value: "completed" }),
          apiList("complaints", { orderBy: "created_at", order: "desc", limit: 6 }),
          apiList("requests", { orderBy: "created_at", order: "desc", limit: 6 }),
        ]);

        setStats({
          residents: residentsTotal,
          news: newsTotal,
          complaints: pendingComplaints,
          requests: reqPending,
        });

        setRequestBreakdown({
          pending: reqPending,
          processed: reqProcessed,
          ready: reqReady,
          completed: reqCompleted,
        });

        const complaintsList: ActivityItem[] = (recentComplaintRows || []).map((row) => ({
          id: String(row.id),
          kind: "complaint",
          title: String(row.title || row.category || "Pengaduan Warga"),
          detail: String(row.message || ""),
          nama: String(row.nama || "Warga"),
          status: String(row.status || "pending"),
          category: String(row.category || "Umum"),
          createdAt: (row.created_at as string | number | Date) || undefined,
        }));

        const requestsList: ActivityItem[] = (recentRequestRows || []).map((row) => ({
          id: String(row.id),
          kind: "request",
          title: String(row.type_name || "Permohonan Surat"),
          detail: String(row.keperluan || "Keperluan administrasi kependudukan"),
          nama: String(row.nama || "Warga"),
          status: String(row.status || "pending"),
          category: String(row.ticket_code || "Surat"),
          createdAt: (row.created_at as string | number | Date) || undefined,
        }));

        const merged = [...complaintsList, ...requestsList].sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });

        setActivities(merged);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalReq =
    requestBreakdown.pending +
    requestBreakdown.processed +
    requestBreakdown.ready +
    requestBreakdown.completed || 1;

  const pipelineStages: Array<{
    key: keyof RequestBreakdown;
    label: string;
    sublabel: string;
    count: number;
    badgeStyle: string;
    barColor: string;
    actionNote: string;
  }> = [
    {
      key: "pending",
      label: "Menunggu Verifikasi",
      sublabel: "Permohonan baru masuk dari warga",
      count: requestBreakdown.pending,
      badgeStyle: "bg-amber-100 text-amber-900 border-amber-200",
      barColor: "bg-amber-500",
      actionNote: "Perlu pemeriksaan kelengkapan berkas pemohon di loket",
    },
    {
      key: "processed",
      label: "Sedang Diproses",
      sublabel: "Penyusunan berkas & validasi data",
      count: requestBreakdown.processed,
      badgeStyle: "bg-blue-100 text-blue-900 border-blue-200",
      barColor: "bg-blue-600",
      actionNote: "Menunggu penomoran atau penandatanganan pejabat",
    },
    {
      key: "ready",
      label: "Siap Diambil di Loket",
      sublabel: "Dokumen resmi sudah tercetak",
      count: requestBreakdown.ready,
      badgeStyle: "bg-emerald-100 text-emerald-900 border-emerald-200",
      barColor: "bg-emerald-600",
      actionNote: "Siap diserahkan kepada warga yang datang ke kantor",
    },
    {
      key: "completed",
      label: "Selesai Diserahkan",
      sublabel: "Arsip pelayanan terlaksana",
      count: requestBreakdown.completed,
      badgeStyle: "bg-slate-100 text-slate-800 border-slate-200",
      barColor: "bg-slate-600",
      actionNote: "Pelayanan telah tuntas dan tersimpan di basis data",
    },
  ];

  const filteredActivities = activities.filter((item) => {
    if (activityTab === "requests") return item.kind === "request";
    if (activityTab === "complaints") return item.kind === "complaint";
    return true;
  });

  const activeStageInfo = pipelineStages.find((s) => s.key === selectedPipelineStage) || pipelineStages[0];

  return (
    <div className="space-y-6 pb-8">
      {/* Header Context & Action Center */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-bl from-slate-100 to-transparent pointer-events-none rounded-tr-2xl" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b365d] bg-[#1b365d]/10 px-2.5 py-0.5 rounded-full">
                <Calendar className="h-3 w-3" />
                {dateLabel || "Pemerintah Kelurahan Banjar Agung"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Loket Pelayanan Aktif (08.00 - 15.30 WIB)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pusat Kontrol Pelayanan Kelurahan
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed">
              Pantau antrean dokumen warga, tindak lanjuti aspirasi pengaduan, dan kelola basis data administrasi kependudukan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/dashboard/layanan">
              <Button size="sm" className="bg-[#1b365d] hover:bg-[#152a48] text-white h-9 px-4 text-xs font-semibold shadow-xs">
                <Inbox className="mr-1.5 h-3.5 w-3.5" /> Buka Loket Permohonan
              </Button>
            </Link>
            <Link href="/dashboard/berita/tambah">
              <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9 px-3 text-xs font-medium">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Berita Baru
              </Button>
            </Link>
            <Link href="/dashboard/penduduk">
              <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9 px-3 text-xs font-medium">
                <Users className="mr-1.5 h-3.5 w-3.5" /> Data Penduduk
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Actionable Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Permohonan Surat */}
        <Link
          href="/dashboard/layanan"
          className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#1b365d]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Antrean Surat</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-[#1b365d] group-hover:scale-105 transition-transform">
                  {stats.requests}
                </span>
                <span className="text-xs text-slate-500 font-medium">berkas menunggu</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#1b365d]/10 text-[#1b365d] flex items-center justify-center shrink-0 group-hover:bg-[#1b365d] group-hover:text-white transition-colors">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>{requestBreakdown.processed} sedang berjalan</span>
            <span className="font-semibold text-[#1b365d] group-hover:underline">Buka antrean</span>
          </div>
        </Link>

        {/* Metric 2: Pengaduan Warga */}
        <Link
          href="/dashboard/pengaduan"
          className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-amber-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengaduan Baru</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-amber-700 group-hover:scale-105 transition-transform">
                  {stats.complaints}
                </span>
                <span className="text-xs text-slate-500 font-medium">laporan terbuka</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Tindak lanjut aspirasi warga</span>
            <span className="font-semibold text-amber-800 group-hover:underline">Periksa</span>
          </div>
        </Link>

        {/* Metric 3: Data Penduduk */}
        <Link
          href="/dashboard/penduduk"
          className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penduduk Terdata</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 group-hover:scale-105 transition-transform">
                  {stats.residents.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-slate-500 font-medium">jiwa</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Master data kependudukan</span>
            <span className="font-semibold text-slate-800 group-hover:underline">Kelola</span>
          </div>
        </Link>

        {/* Metric 4: Berita Publikasi */}
        <Link
          href="/dashboard/berita"
          className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Publikasi Portal</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 group-hover:scale-105 transition-transform">
                  {stats.news}
                </span>
                <span className="text-xs text-slate-500 font-medium">artikel aktif</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Warta & agenda kelurahan</span>
            <span className="font-semibold text-slate-800 group-hover:underline">Lihat</span>
          </div>
        </Link>
      </div>

      {/* Main Workspace: Interactive Pipeline & Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Section: Interactive Pipeline (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#1b365d]" />
                Alur Progres Pelayanan Dokumen
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total beban kerja berjalan: {totalReq} berkas permohonan warga
              </p>
            </div>
            <Link
              href="/dashboard/layanan"
              className="text-xs font-semibold text-[#1b365d] hover:underline self-start sm:self-auto flex items-center gap-1"
            >
              Semua Permohonan
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Interactive Stage Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {pipelineStages.map((stage) => {
              const isActive = selectedPipelineStage === stage.key;
              const pct = Math.round((stage.count / totalReq) * 100);
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => setSelectedPipelineStage(stage.key)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                    isActive
                      ? "border-[#1b365d] bg-slate-50/80 shadow-xs ring-1 ring-[#1b365d]/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-500 truncate">{stage.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stage.count}</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className={`${stage.barColor} h-full`} style={{ width: `${Math.max(stage.count > 0 ? 8 : 0, pct)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{pct}% total</p>
                </button>
              );
            })}
          </div>

          {/* Detailed Selected Stage Context Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${activeStageInfo.badgeStyle}`}>
                  {activeStageInfo.label}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {activeStageInfo.count} Berkas Terdaftar
                </span>
              </div>
              <Link href="/dashboard/layanan">
                <Button size="sm" variant="outline" className="h-7 text-xs bg-white border-slate-300 hover:bg-slate-100">
                  Periksa di Loket
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeStageInfo.sublabel}. {activeStageInfo.actionNote}.
            </p>
          </div>

          {/* Quick Guidance Strip */}
          <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <span>Petugas wajib memverifikasi dokumen fisik saat warga datang ke kantor kelurahan.</span>
            <Link href="/dashboard/layanan" className="font-semibold text-[#1b365d] hover:underline shrink-0">
              Cetak Dokumen Resmi
            </Link>
          </div>
        </div>

        {/* Right Section: Unified Activity Stream (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Aktivitas Pelayanan Terkini</h2>
              <p className="text-xs text-slate-500 mt-0.5">Permohonan surat & aspirasi masuk terbaru</p>
            </div>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium self-start">
            <button
              type="button"
              onClick={() => setActivityTab("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activityTab === "all" ? "bg-white text-[#1b365d] font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActivityTab("requests")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activityTab === "requests" ? "bg-white text-[#1b365d] font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Surat
            </button>
            <button
              type="button"
              onClick={() => setActivityTab("complaints")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activityTab === "complaints" ? "bg-white text-[#1b365d] font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pengaduan
            </button>
          </div>

          {/* Stream List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Memuat data aktivitas...
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <Inbox className="h-7 w-7 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Belum ada aktivitas tercatat</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Permohonan atau pengaduan baru warga akan tampil di sini.</p>
              </div>
            ) : (
              filteredActivities.map((item) => {
                const isReq = item.kind === "request";
                return (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/80 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isReq ? "bg-[#1b365d]/10 text-[#1b365d]" : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {isReq ? "Surat" : "Pengaduan"}
                        </span>
                        {item.category && (
                          <span className="text-[10px] font-mono text-slate-500 truncate">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === "completed" || item.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "ready"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "processed"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status === "completed" || item.status === "resolved"
                          ? "Selesai"
                          : item.status === "ready"
                          ? "Siap Diambil"
                          : item.status === "processed"
                          ? "Diproses"
                          : "Menunggu"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                      {item.title}
                    </p>

                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1">
                      {item.detail}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                      <span>Pemohon / Pengirim: <strong className="text-slate-700">{item.nama}</strong></span>
                      <Link
                        href={isReq ? "/dashboard/layanan" : "/dashboard/pengaduan"}
                        className="font-semibold text-[#1b365d] hover:underline"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
