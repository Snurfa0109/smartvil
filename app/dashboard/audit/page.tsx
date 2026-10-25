"use client";

/**
 * @layer Frontend (Admin / Dashboard)
 * @role Monitoring Audit Trail & Log Aktivitas
 * @access Terautentikasi (Super Admin Only)
 * @description Menampilkan rekam jejak aktivitas pengguna, perubahan data sensitif, dan log autentikasi sistem.
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { apiList } from "@/lib/api";
import { AuditEntry, AuditAction, AuditModule } from "@/lib/audit";
import {
  History,
  Search,
  RefreshCw,
  ShieldAlert,
  LogIn,
  LogOut,
  PlusCircle,
  Edit,
  Trash2,
  FileSpreadsheet,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePolling } from "@/hooks/use-polling";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<(AuditEntry & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const initialLoadedRef = useRef(false);

  const fetchLogs = useCallback(async () => {
    if (!initialLoadedRef.current) setLoading(true);
    try {
      const rows = await apiList("audit_logs", { orderBy: "timestamp", order: "desc", limit: 100 });
      const list: (AuditEntry & { id: string })[] = (rows || []).map((row) => ({
        id: String(row.id),
        uid: String(row.uid || ""),
        email: String(row.email || ""),
        displayName: String(row.display_name || ""),
        role: String(row.role || ""),
        action: (row.action as AuditAction) || "AKSES_DITOLAK",
        module: (row.module as AuditModule) || "sistem",
        detail: String(row.detail || ""),
        timestamp: row.timestamp as string | number | Date | undefined,
      }));
      setLogs(list);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
      initialLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  usePolling(fetchLogs, 30_000);

  const formatTimestamp = (ts: unknown) => {
    if (!ts) return "-";
    if (typeof ts === "string" || typeof ts === "number") {
      return new Date(ts).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      return new Date((ts as { seconds: number }).seconds * 1000).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    return String(ts);
  };

  const actionConfig: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
    LOGIN: { icon: <LogIn className="h-3 w-3" />, bg: "bg-emerald-50", text: "text-emerald-700", label: "LOGIN" },
    LOGOUT: { icon: <LogOut className="h-3 w-3" />, bg: "bg-slate-100", text: "text-slate-600", label: "LOGOUT" },
    CREATE: { icon: <PlusCircle className="h-3 w-3" />, bg: "bg-sky-50", text: "text-sky-700", label: "CREATE" },
    UPDATE: { icon: <Edit className="h-3 w-3" />, bg: "bg-amber-50", text: "text-amber-700", label: "UPDATE" },
    DELETE: { icon: <Trash2 className="h-3 w-3" />, bg: "bg-red-50", text: "text-red-700", label: "DELETE" },
    AKSES_DITOLAK: { icon: <ShieldAlert className="h-3 w-3" />, bg: "bg-rose-100", text: "text-rose-800", label: "DITOLAK" },
  };

  const getActionBadge = (action: AuditAction) => {
    const cfg = actionConfig[action] || { icon: null, bg: "bg-slate-100", text: "text-slate-600", label: action };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  const getModuleBadge = (mod: AuditModule) => (
    <span className="capitalize px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#1b365d]/[0.06] text-[#1b365d]">
      {mod}
    </span>
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        (log.displayName && log.displayName.toLowerCase().includes(search.toLowerCase())) ||
        (log.email && log.email.toLowerCase().includes(search.toLowerCase())) ||
        (log.detail && log.detail.toLowerCase().includes(search.toLowerCase()));
      const matchAction = selectedAction === "all" || log.action === selectedAction;
      const matchModule = selectedModule === "all" || log.module === selectedModule;
      return matchSearch && matchAction && matchModule;
    });
  }, [logs, search, selectedAction, selectedModule]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const sanitizeCSV = (val: string) =>
      /^[=+\-@]/.test(val) ? `'${val}` : val;
    const headers = ["Waktu", "User", "Email", "Role", "Aksi", "Modul", "Keterangan"];
    const rows = filteredLogs.map((l) => [
      `"${sanitizeCSV(formatTimestamp(l.timestamp))}"`,
      `"${sanitizeCSV(l.displayName || "-")}"`,
      `"${sanitizeCSV(l.email || "-")}"`,
      `"${sanitizeCSV(l.role || "-")}"`,
      `"${sanitizeCSV(l.action)}"`,
      `"${sanitizeCSV(l.module)}"`,
      `"${sanitizeCSV((l.detail || "").replace(/"/g, '""'))}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-log-banjar-agung-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loginCount = logs.filter((l) => l.action === "LOGIN").length;
  const rejectedCount = logs.filter((l) => l.action === "AKSES_DITOLAK").length;
  const changesCount = logs.filter((l) => ["CREATE", "UPDATE", "DELETE"].includes(l.action)).length;

  const statCards = [
    {
      label: "Total Rekaman",
      value: logs.length,
      icon: <History className="h-[18px] w-[18px]" />,
      iconBg: "bg-[#1b365d]/10",
      iconText: "text-[#1b365d]",
      numText: "text-[#1b365d]",
      accentBar: "bg-[#1b365d]",
    },
    {
      label: "Login Sukses",
      value: loginCount,
      icon: <LogIn className="h-[18px] w-[18px]" />,
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      numText: "text-emerald-700",
      accentBar: "bg-emerald-500",
    },
    {
      label: "Operasi Data",
      value: changesCount,
      icon: <Edit className="h-[18px] w-[18px]" />,
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      numText: "text-amber-700",
      accentBar: "bg-amber-500",
    },
    {
      label: "Akses Ditolak",
      value: rejectedCount,
      icon: <ShieldAlert className="h-[18px] w-[18px]" />,
      iconBg: "bg-rose-100",
      iconText: "text-rose-600",
      numText: "text-rose-700",
      accentBar: "bg-rose-500",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-md shadow-[#1b365d]/15">
            <Activity className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Log Aktivitas & Audit</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">Rekam jejak login, perubahan data, dan keamanan sistem</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Unduh CSV
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b365d] hover:bg-[#152a48] text-white rounded-lg text-[11px] font-bold transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Segarkan
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                {loading ? (
                  <div className="h-7 w-12 bg-slate-100 rounded-lg mt-1.5 animate-pulse" />
                ) : (
                  <p className={`text-2xl font-extrabold mt-1 tabular-nums tracking-tight ${stat.numText}`}>
                    {stat.value.toLocaleString("id-ID")}
                  </p>
                )}
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} ${stat.iconText} flex items-center justify-center shrink-0 dash-icon-box`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: search + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            type="search"
            placeholder="Cari user, email, atau detail..."
            className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="h-9 text-[11px] font-bold border border-slate-200 rounded-xl px-3 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
          >
            <option value="all">Semua Aksi</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="AKSES_DITOLAK">AKSES DITOLAK</option>
          </select>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="h-9 text-[11px] font-bold border border-slate-200 rounded-xl px-3 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
          >
            <option value="all">Semua Modul</option>
            <option value="auth">Autentikasi</option>
            <option value="admin">Admin & Akses</option>
            <option value="berita">Berita</option>
            <option value="agenda">Agenda</option>
            <option value="layanan">Layanan & Surat</option>
            <option value="pengaduan">Pengaduan</option>
            <option value="penduduk">Penduduk</option>
            <option value="settings">Profil & Settings</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
        {/* Table header bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1b365d]/[0.06] flex items-center justify-center">
              <History className="h-4 w-4 text-[#1b365d]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-800">Riwayat Aktivitas</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {filteredLogs.length === logs.length ? (
                  <><span className="tabular-nums font-semibold text-slate-500">{logs.length}</span> rekaman terakhir</>
                ) : (
                  <><span className="tabular-nums font-semibold text-slate-500">{filteredLogs.length}</span> dari {logs.length} rekaman</>
                )}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-3 font-medium">Memuat riwayat audit...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <History className="h-6 w-6 text-slate-300" />
            </div>
            {logs.length === 0 ? (
              <>
                <p className="text-sm font-bold text-slate-700">Belum ada rekaman</p>
                <p className="text-xs text-slate-400 mt-1">Aktivitas admin akan tercatat secara otomatis.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-700">Tidak ada hasil</p>
                <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian.</p>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setSelectedAction("all"); setSelectedModule("all"); }}
                  className="mt-3 text-xs font-semibold text-[#1b365d] hover:underline"
                >
                  Reset filter
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-3">Waktu</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">Pengguna</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Aksi</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Modul</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`border-b border-slate-100/80 last:border-0 hover:bg-[#1b365d]/[0.015] transition-colors group ${
                      log.action === "AKSES_DITOLAK" ? "bg-rose-50/30" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[11px] text-slate-500 font-mono">{formatTimestamp(log.timestamp)}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(log.displayName || log.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-slate-800 truncate">
                            {log.displayName || "Pengguna"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{log.email || "-"}</p>
                          {/* Mobile: show action + module inline */}
                          <div className="flex items-center gap-1.5 mt-1 sm:hidden">
                            {getActionBadge(log.action)}
                            {getModuleBadge(log.module)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap hidden sm:table-cell">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell">
                      {getModuleBadge(log.module)}
                    </td>

                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <p className="text-[11px] text-slate-500 max-w-sm truncate" title={log.detail}>
                        {log.detail || "-"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
