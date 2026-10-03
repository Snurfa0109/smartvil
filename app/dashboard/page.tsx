"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Users, MessageSquare, TrendingUp, Plus, ArrowUpRight, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { apiCount, apiList } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  residents: number;
  news: number;
  complaints: number;
  requests: number;
}

interface RecentComplaint {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: any;
  nama: string;
  category: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    residents: 0,
    news: 0,
    complaints: 0,
    requests: 0,
  });

  const [requestBreakdown, setRequestBreakdown] = useState({
    pending: 0,
    processed: 0,
    ready: 0,
    completed: 0,
  });

  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          recentRows,
        ] = await Promise.all([
          apiCount("complaints", { column: "status", value: "pending" }),
          apiCount("residents"),
          apiCount("news"),
          apiCount("requests", { column: "status", value: "pending" }),
          apiCount("requests", { column: "status", value: "processed" }),
          apiCount("requests", { column: "status", value: "ready" }),
          apiCount("requests", { column: "status", value: "completed" }),
          apiList("complaints", { orderBy: "created_at", order: "desc", limit: 4 }),
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

        const complaintsData = (recentRows as Array<Record<string, unknown>>).map((row) => ({
          id: String(row.id),
          title: (row.title as string) || (row.category as string) || "Pengaduan",
          content: (row.message as string) || "",
          status: row.status as string,
          createdAt: row.created_at,
          nama: (row.nama as string) || "Anonim",
          category: (row.category as string) || "Umum",
        })) as RecentComplaint[];

        setRecentComplaints(complaintsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalReq = requestBreakdown.pending + requestBreakdown.processed + requestBreakdown.ready + requestBreakdown.completed || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Selamat datang di Pusat Kontrol Pelayanan Digital Kelurahan Banjar Agung.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/berita/tambah">
            <Button size="sm" variant="outline" className="text-xs border-slate-300">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Berita Baru
            </Button>
          </Link>
          <Link href="/dashboard/penduduk">
            <Button size="sm" className="text-xs bg-[#1b365d] hover:bg-[#152a48]">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Penduduk
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-sm transition-shadow border-l-4 border-l-[#1b365d]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Penduduk</CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-[#1b365d]">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.residents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Jiwa terdata di sistem</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow border-l-4 border-l-slate-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Berita &amp; Publikasi</CardTitle>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.news}</div>
            <p className="text-xs text-muted-foreground mt-1">Artikel aktif di portal</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengaduan Baru</CardTitle>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <MessageSquare className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600">{stats.complaints}</div>
            <p className="text-xs text-muted-foreground mt-1">Menunggu tindak lanjut</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Surat Masuk</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600">{stats.requests}</div>
            <p className="text-xs text-muted-foreground mt-1">Antrean perlu diproses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Real Status Chart */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Distribusi Status Pelayanan Surat</CardTitle>
              <CardDescription>Ringkasan real-time progres permohonan surat warga</CardDescription>
            </div>
            <Link href="/dashboard/layanan" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              Kelola Surat <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {[
              { label: "Menunggu Antrean", count: requestBreakdown.pending, color: "bg-amber-500", text: "text-amber-700" },
              { label: "Sedang Diproses", count: requestBreakdown.processed, color: "bg-blue-500", text: "text-blue-700" },
              { label: "Siap Diambil di Loket", count: requestBreakdown.ready, color: "bg-emerald-500", text: "text-emerald-700" },
              { label: "Selesai Diserahkan", count: requestBreakdown.completed, color: "bg-slate-700", text: "text-slate-700" },
            ].map((step, idx) => {
              const pct = Math.round((step.count / totalReq) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{step.label}</span>
                    <span className={`font-mono text-xs font-semibold ${step.text}`}>{step.count} berkas ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className={`${step.color} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.max(step.count > 0 ? 4 : 0, pct)}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-amber-50 rounded-lg">
                <p className="text-muted-foreground text-[10px]">Menunggu</p>
                <p className="text-base font-bold text-amber-700">{requestBreakdown.pending}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <p className="text-muted-foreground text-[10px]">Diproses</p>
                <p className="text-base font-bold text-blue-700">{requestBreakdown.processed}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <p className="text-muted-foreground text-[10px]">Siap Diambil</p>
                <p className="text-base font-bold text-emerald-700">{requestBreakdown.ready}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-muted-foreground text-[10px]">Selesai</p>
                <p className="text-base font-bold text-slate-700">{requestBreakdown.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Complaints */}
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Pengaduan Terkini</CardTitle>
              <CardDescription>Laporan terbaru yang masuk dari warga</CardDescription>
            </div>
            <Link href="/dashboard/pengaduan" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              Semua <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3">
              {recentComplaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Belum ada pengaduan warga.</p>
                </div>
              ) : (
                recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold bg-[#1b365d]/10 text-[#1b365d] px-2 py-0.5 rounded-full">
                        {complaint.category}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        complaint.status === "completed" || complaint.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : complaint.status === "processed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {complaint.status === "completed" || complaint.status === "resolved" ? "Selesai" : complaint.status === "processed" ? "Diproses" : "Menunggu"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{complaint.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{complaint.content}</p>
                    <p className="text-[10px] text-muted-foreground pt-1">Oleh: <strong>{complaint.nama}</strong></p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
