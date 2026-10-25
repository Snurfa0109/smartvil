"use client";

/**
 * @layer Frontend (Admin / Dashboard)
 * @role Ringkasan Statistik & Aktivitas Dashboard
 * @access Terautentikasi (Admin / Staf Kelurahan)
 * @description Menampilkan ikhtisar metrik layanan, jumlah penduduk, pengaduan terkini, dan log aktivitas kelurahan.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { usePolling } from "@/hooks/use-polling";
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
  Hourglass,
  Settings,
  PackageCheck,
  CheckCircle,
  Newspaper,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/api";

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
  const [error, setError] = useState<string | null>(null);
  const [loketActive, setLoketActive] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = getToken();
      const res = await fetch("/api/dashboard-stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Gagal memuat data (${res.status})`);
      const data = await res.json();

      setStats(data.stats);
      setRequestBreakdown(data.requestBreakdown);

      const complaintsList: ActivityItem[] = (data.recentComplaints || []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        kind: "complaint" as const,
        title: String(row.title || row.category || "Pengaduan Warga"),
        detail: String(row.message || ""),
        nama: String(row.nama || "Warga"),
        status: String(row.status || "pending"),
        category: String(row.category || "Umum"),
        createdAt: (row.created_at as string | number | Date) || undefined,
      }));

      const requestsList: ActivityItem[] = (data.recentRequests || []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        kind: "request" as const,
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
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cleanup abort on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

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

    // Check if loket is active (08:00–15:30 WIB, Mon–Fri)
    const checkLoketStatus = () => {
      const now = new Date();
      // Convert to WIB (UTC+7)
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const wib = new Date(utc + 7 * 3600000);
      const day = wib.getDay(); // 0=Sun, 6=Sat
      const hours = wib.getHours();
      const minutes = wib.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      setLoketActive(day >= 1 && day <= 5 && timeInMinutes >= 480 && timeInMinutes < 930);
    };
    checkLoketStatus();
    const loketTimer = setInterval(checkLoketStatus, 60_000);

    fetchData();
    return () => clearInterval(loketTimer);
  }, [fetchData]);

  usePolling(fetchData, 30_000);

  const totalReq =
    requestBreakdown.pending +
    requestBreakdown.processed +
    requestBreakdown.ready +
    requestBreakdown.completed;
  const totalReqDivisor = totalReq || 1;

  const pipelineStages: Array<{
    key: keyof RequestBreakdown;
    label: string;
    sublabel: string;
    count: number;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    iconText: string;
    numText: string;
    barColor: string;
    actionNote: string;
  }> = [
    {
      key: "pending",
      label: "Menunggu",
      sublabel: "Permohonan baru masuk dari warga",
      count: requestBreakdown.pending,
      icon: <Hourglass className="h-5 w-5" />,
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      numText: "text-amber-700",
      barColor: "bg-amber-500",
      actionNote: "Perlu pemeriksaan kelengkapan berkas pemohon di loket",
    },
    {
      key: "processed",
      label: "Diproses",
      sublabel: "Penyusunan berkas & validasi data",
      count: requestBreakdown.processed,
      icon: <Settings className="h-5 w-5" />,
      gradient: "from-sky-500 to-blue-600",
      iconBg: "bg-sky-100",
      iconText: "text-sky-600",
      numText: "text-sky-700",
      barColor: "bg-sky-500",
      actionNote: "Menunggu penomoran atau penandatanganan pejabat",
    },
    {
      key: "ready",
      label: "Siap Diambil",
      sublabel: "Dokumen resmi sudah tercetak",
      count: requestBreakdown.ready,
      icon: <PackageCheck className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      numText: "text-emerald-700",
      barColor: "bg-emerald-500",
      actionNote: "Siap diserahkan kepada warga yang datang ke kantor",
    },
    {
      key: "completed",
      label: "Selesai",
      sublabel: "Arsip pelayanan terlaksana",
      count: requestBreakdown.completed,
      icon: <CheckCircle className="h-5 w-5" />,
      gradient: "from-slate-500 to-slate-700",
      iconBg: "bg-slate-100",
      iconText: "text-slate-500",
      numText: "text-slate-700",
      barColor: "bg-slate-500",
      actionNote: "Pelayanan telah tuntas dan tersimpan di basis data",
    },
  ];

  const filteredActivities = useMemo(() =>
    activities.filter((item) => {
      if (activityTab === "requests") return item.kind === "request";
      if (activityTab === "complaints") return item.kind === "complaint";
      return true;
    }),
    [activities, activityTab]
  );

  const activeStageInfo = pipelineStages.find((s) => s.key === selectedPipelineStage) || pipelineStages[0];

  return (
    <div className="space-y-6 pb-8">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1b365d] via-[#1f3f6e] to-[#264478] p-6 md:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-white/[0.04] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 rounded-full bg-white/[0.03] translate-y-1/2" />
        <div className="absolute right-1/4 bottom-0 w-32 h-32 rounded-full bg-[#c9971c]/10 translate-y-1/3" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                <Calendar className="h-3 w-3" />
                {dateLabel || "Kelurahan Banjar Agung"}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border ${
                loketActive
                  ? "text-emerald-300 bg-emerald-500/15 border-emerald-400/20"
                  : "text-red-300 bg-red-500/15 border-red-400/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${loketActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                {loketActive ? "Loket Aktif · 08.00–15.30" : "Loket Tutup"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Pusat Kontrol Pelayanan
            </h1>
            <p className="text-white/50 text-sm mt-2 max-w-xl leading-relaxed">
              Pantau antrean dokumen, tindak lanjuti aspirasi warga, dan kelola basis data administrasi kependudukan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href="/dashboard/layanan">
              <Button size="sm" className="bg-white text-[#1b365d] hover:bg-white/90 h-9 px-4 text-xs font-bold shadow-md">
                <Inbox className="mr-1.5 h-3.5 w-3.5" /> Buka Loket
              </Button>
            </Link>
            <Link href="/dashboard/berita/tambah">
              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-9 px-3 text-xs font-medium">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Berita Baru
              </Button>
            </Link>
            <Link href="/dashboard/penduduk">
              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-9 px-3 text-xs font-medium">
                <Users className="mr-1.5 h-3.5 w-3.5" /> Data Penduduk
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-100 h-8 text-xs font-bold shrink-0"
            onClick={() => { setError(null); fetchData(); }}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Coba Lagi
          </Button>
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          {
            href: "/dashboard/layanan",
            label: "Antrean Surat",
            value: stats.requests,
            sub: `${requestBreakdown.processed} sedang berjalan`,
            cta: "Buka antrean",
            icon: <Inbox className="h-5 w-5" />,
            gradient: "from-[#1b365d] to-[#264478]",
            iconBg: "bg-[#1b365d]/10",
            iconText: "text-[#1b365d]",
            numText: "text-[#1b365d]",
            hoverBorder: "hover:border-[#1b365d]/40",
            ctaColor: "text-[#1b365d]",
            accentBar: "bg-[#1b365d]",
          },
          {
            href: "/dashboard/pengaduan",
            label: "Pengaduan Baru",
            value: stats.complaints,
            sub: "Laporan terbuka warga",
            cta: "Periksa",
            icon: <AlertCircle className="h-5 w-5" />,
            gradient: "from-amber-500 to-orange-500",
            iconBg: "bg-amber-100",
            iconText: "text-amber-600",
            numText: "text-amber-700",
            hoverBorder: "hover:border-amber-300",
            ctaColor: "text-amber-700",
            accentBar: "bg-amber-500",
          },
          {
            href: "/dashboard/penduduk",
            label: "Penduduk Terdata",
            value: stats.residents,
            sub: "Master data kependudukan",
            cta: "Kelola",
            icon: <Users className="h-5 w-5" />,
            gradient: "from-emerald-500 to-teal-600",
            iconBg: "bg-emerald-100",
            iconText: "text-emerald-600",
            numText: "text-emerald-700",
            hoverBorder: "hover:border-emerald-300",
            ctaColor: "text-emerald-700",
            accentBar: "bg-emerald-500",
          },
          {
            href: "/dashboard/berita",
            label: "Publikasi Portal",
            value: stats.news,
            sub: "Warta & agenda kelurahan",
            cta: "Lihat",
            icon: <Newspaper className="h-5 w-5" />,
            gradient: "from-violet-500 to-purple-600",
            iconBg: "bg-violet-100",
            iconText: "text-violet-600",
            numText: "text-violet-700",
            hoverBorder: "hover:border-violet-300",
            ctaColor: "text-violet-700",
            accentBar: "bg-violet-500",
          },
        ] as const).map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`dash-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white ${card.hoverBorder} hover:shadow-lg transition-all duration-300 flex flex-col`}
          >
            <div className={`h-1 ${card.accentBar}`} />

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                  {loading ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-lg mt-2 animate-pulse" />
                  ) : (
                    <p className={`text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight ${card.numText}`}>
                      {card.value.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
                <div className={`w-11 h-11 rounded-xl ${card.iconBg} ${card.iconText} flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110`}>
                  {card.icon}
                </div>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between text-[11px] border-t border-slate-100">
                <span className="text-slate-400">{card.sub}</span>
                <span className={`font-bold ${card.ctaColor} flex items-center gap-0.5 group-hover:gap-1.5 transition-all`}>
                  {card.cta}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Pipeline + Activity ── */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">

        {/* Left: Pipeline */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-md shadow-[#1b365d]/20">
                  <Layers className="h-[18px] w-[18px] text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Alur Progres Pelayanan</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Total <span className="tabular-nums font-bold text-slate-600">{totalReq}</span> berkas permohonan
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/layanan"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1b365d] bg-[#1b365d]/[0.06] hover:bg-[#1b365d]/[0.12] px-3 py-1.5 rounded-lg transition-colors"
              >
                Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-4 gap-0 rounded-xl overflow-hidden border border-slate-200/80">
              {pipelineStages.map((stage, idx) => {
                const isActive = selectedPipelineStage === stage.key;
                const pct = Math.round((stage.count / totalReqDivisor) * 100);
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => setSelectedPipelineStage(stage.key)}
                    className={`relative text-left transition-all duration-300 group/stage ${
                      idx < pipelineStages.length - 1 ? "border-r border-slate-100" : ""
                    } ${
                      isActive
                        ? `bg-gradient-to-b ${stage.gradient} text-white`
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="px-3.5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all duration-200 ${
                          isActive ? "bg-white/20 text-white" : `${stage.iconBg} ${stage.iconText}`
                        }`}>
                          {stage.icon}
                        </div>
                        <span className={`text-[10px] font-mono font-bold tabular-nums ${isActive ? "text-white/50" : "text-slate-300"}`}>
                          {pct}%
                        </span>
                      </div>

                      <p className={`text-2xl font-extrabold tabular-nums leading-none ${isActive ? "text-white" : stage.numText}`}>
                        {stage.count}
                      </p>
                      <p className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${isActive ? "text-white/60" : "text-slate-400"}`}>
                        {stage.label}
                      </p>

                      <div className={`w-full h-[3px] rounded-full overflow-hidden mt-3 ${isActive ? "bg-white/15" : "bg-slate-100"}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${isActive ? "bg-white/50" : stage.barColor + "/60"}`}
                          style={{ width: `${Math.max(stage.count > 0 ? 10 : 0, pct)}%` }}
                        />
                      </div>
                    </div>

                    {isActive && <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/30" />}
                  </button>
                );
              })}
            </div>

            <div className={`rounded-xl p-4 border transition-all duration-300 ${
              activeStageInfo.key === "pending" ? "bg-amber-50/60 border-amber-200/50" :
              activeStageInfo.key === "processed" ? "bg-sky-50/60 border-sky-200/50" :
              activeStageInfo.key === "ready" ? "bg-emerald-50/60 border-emerald-200/50" :
              "bg-slate-50/80 border-slate-200/60"
            }`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${activeStageInfo.iconBg} ${activeStageInfo.iconText}`}>
                    {activeStageInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{activeStageInfo.label}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${activeStageInfo.iconBg} ${activeStageInfo.iconText}`}>
                        {activeStageInfo.count} berkas
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeStageInfo.sublabel}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/layanan">
                  <Button size="sm" className={`h-8 text-xs rounded-lg font-bold shadow-sm transition-all ${
                    activeStageInfo.key === "pending" ? "bg-amber-500 hover:bg-amber-600 text-white" :
                    activeStageInfo.key === "processed" ? "bg-sky-500 hover:bg-sky-600 text-white" :
                    activeStageInfo.key === "ready" ? "bg-emerald-500 hover:bg-emerald-600 text-white" :
                    "bg-[#1b365d] hover:bg-[#152a48] text-white"
                  }`}>
                    Periksa di Loket
                    <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed pl-12">
                {activeStageInfo.actionNote}.
              </p>
            </div>

            <div className="flex items-center gap-2 px-1">
              <div className="flex items-center gap-1">
                {pipelineStages.map((stage, idx) => (
                  <div key={stage.key} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      selectedPipelineStage === stage.key ? stage.barColor + " scale-125" : "bg-slate-200"
                    }`} />
                    {idx < pipelineStages.length - 1 && (
                      <div className="w-6 h-px bg-slate-200" />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-300 ml-1 font-medium">Alur kerja pelayanan</span>
            </div>
          </div>
        </div>

        {/* Right: Activity Stream */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#c9971c] to-[#a67c15] flex items-center justify-center shadow-md shadow-[#c9971c]/20">
                  <Activity className="h-[18px] w-[18px] text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Aktivitas Terkini</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Permohonan & aspirasi terbaru</p>
                </div>
              </div>

              <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-medium">
                {([
                  { key: "all" as const, label: "Semua" },
                  { key: "requests" as const, label: "Surat" },
                  { key: "complaints" as const, label: "Aduan" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivityTab(tab.key)}
                    className={`px-2.5 py-1 rounded-md transition-all duration-200 ${
                      activityTab === tab.key
                        ? "bg-white text-[#1b365d] font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 flex flex-col flex-1">
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto sidebar-scroll flex-1">
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#c9971c] rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 mt-3 font-medium">Memuat aktivitas...</p>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center bg-slate-50/50">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Inbox className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Belum ada aktivitas</p>
                  <p className="text-[11px] text-slate-400 mt-1">Permohonan atau pengaduan baru akan tampil di sini.</p>
                </div>
              ) : (
                filteredActivities.map((item) => {
                  const isReq = item.kind === "request";
                  const statusMap: Record<string, { label: string; cls: string; dot: string }> = {
                    completed: { label: "Selesai", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
                    resolved: { label: "Selesai", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
                    ready: { label: "Siap Ambil", cls: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
                    processed: { label: "Diproses", cls: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
                    pending: { label: "Menunggu", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
                  };
                  const st = statusMap[item.status] || statusMap.pending;

                  const timeAgo = item.createdAt ? (() => {
                    const diff = Date.now() - new Date(item.createdAt!).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 1) return "Baru saja";
                    if (mins < 60) return `${mins} menit lalu`;
                    const hours = Math.floor(mins / 60);
                    if (hours < 24) return `${hours} jam lalu`;
                    const days = Math.floor(hours / 24);
                    return `${days} hari lalu`;
                  })() : "";

                  return (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={isReq ? `/dashboard/layanan?search=${encodeURIComponent(item.nama)}` : `/dashboard/pengaduan?search=${encodeURIComponent(item.nama)}`}
                      className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200"
                    >
                      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isReq
                          ? "bg-gradient-to-br from-[#1b365d]/10 to-[#1b365d]/5 text-[#1b365d]"
                          : "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600"
                      }`}>
                        {isReq ? <FileText className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-[#1b365d] transition-colors">
                            {item.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400 truncate">{item.nama}</span>
                          {timeAgo && (
                            <>
                              <span className="text-slate-200 text-[8px]">●</span>
                              <span className="text-[10px] text-slate-300 font-medium shrink-0">{timeAgo}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${st.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            {!loading && filteredActivities.length > 0 && (
              <div className="pt-3 mt-2 border-t border-slate-100">
                <Link
                  href="/dashboard/layanan"
                  className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#1b365d] bg-[#1b365d]/[0.04] hover:bg-[#1b365d]/[0.08] py-2 rounded-lg transition-colors"
                >
                  Lihat semua aktivitas <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
