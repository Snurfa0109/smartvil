"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { AuditEntry, AuditAction, AuditModule } from "@/lib/audit";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  LogIn,
  LogOut,
  PlusCircle,
  Edit,
  Trash2,
  Calendar,
  User,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<(AuditEntry & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "audit_logs"),
        orderBy("timestamp", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);
      const list: (AuditEntry & { id: string })[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as AuditEntry) });
      });
      setLogs(list);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTimestamp = (ts: any) => {
    if (!ts) return "-";
    if (ts instanceof Timestamp) {
      return ts.toDate().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    return new Date(ts).toLocaleString("id-ID");
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case "LOGIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <LogIn size={12} />
            LOGIN
          </span>
        );
      case "LOGOUT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <LogOut size={12} />
            LOGOUT
          </span>
        );
      case "CREATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <PlusCircle size={12} />
            CREATE
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Edit size={12} />
            UPDATE
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <Trash2 size={12} />
            DELETE
          </span>
        );
      case "AKSES_DITOLAK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <ShieldAlert size={12} />
            DITOLAK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {action}
          </span>
        );
    }
  };

  const getModuleBadge = (mod: AuditModule) => {
    return (
      <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {mod}
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      (log.displayName && log.displayName.toLowerCase().includes(search.toLowerCase())) ||
      (log.email && log.email.toLowerCase().includes(search.toLowerCase())) ||
      (log.detail && log.detail.toLowerCase().includes(search.toLowerCase()));

    const matchAction = selectedAction === "all" || log.action === selectedAction;
    const matchModule = selectedModule === "all" || log.module === selectedModule;

    return matchSearch && matchAction && matchModule;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["Waktu", "User", "Email", "Role", "Aksi", "Modul", "Keterangan"];
    const rows = filteredLogs.map((l) => [
      `"${formatTimestamp(l.timestamp)}"`,
      `"${l.displayName || "-"}"`,
      `"${l.email || "-"}"`,
      `"${l.role || "-"}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${(l.detail || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-log-banjar-agung-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const loginCount = logs.filter((l) => l.action === "LOGIN").length;
  const rejectedCount = logs.filter((l) => l.action === "AKSES_DITOLAK").length;
  const changesCount = logs.filter((l) => ["CREATE", "UPDATE", "DELETE"].includes(l.action)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Log Aktivitas & Audit Keamanan</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#1b365d]">
              Live Audit Trail
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Rekam jejak setiap login, penolakan akses, dan perubahan konten oleh pengelola Kelurahan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 bg-white text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Unduh CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1b365d] hover:bg-[#152a48] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1b365d] flex items-center justify-center shrink-0">
            <History size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Rekaman</p>
            <p className="text-xl font-bold text-slate-800">{logs.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <LogIn size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Sesi Login Sukses</p>
            <p className="text-xl font-bold text-slate-800">{loginCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Edit size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Operasi Data</p>
            <p className="text-xl font-bold text-slate-800">{changesCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Akses Ditolak/Gagal</p>
            <p className="text-xl font-bold text-rose-700">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari user, email, atau detail aktivitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
          >
            <option value="all">Semua Tipe Aksi</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE">CREATE (Tambah Data)</option>
            <option value="UPDATE">UPDATE (Ubah Data)</option>
            <option value="DELETE">DELETE (Hapus Data)</option>
            <option value="AKSES_DITOLAK">AKSES DITOLAK</option>
          </select>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
          >
            <option value="all">Semua Modul</option>
            <option value="auth">Autentikasi (auth)</option>
            <option value="admin">Admin & Akses (admin)</option>
            <option value="berita">Berita & Informasi (berita)</option>
            <option value="agenda">Agenda Kegiatan (agenda)</option>
            <option value="layanan">Layanan & Surat (layanan)</option>
            <option value="pengaduan">Pengaduan Warga (pengaduan)</option>
            <option value="penduduk">Data Penduduk (penduduk)</option>
            <option value="settings">Profil & Settings (settings)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Waktu (WIB)</th>
                <th className="px-6 py-3.5">Pengguna</th>
                <th className="px-6 py-3.5">Aksi</th>
                <th className="px-6 py-3.5">Modul</th>
                <th className="px-6 py-3.5">Keterangan / Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-[#1b365d] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat riwayat audit...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada catatan aktivitas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        log.action === "AKSES_DITOLAK" ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-600 font-mono">
                        {formatTimestamp(log.timestamp)}
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {(log.displayName || log.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {log.displayName || "Pengguna"}
                            </div>
                            <div className="text-[11px] text-slate-500">{log.email || "-"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap">{getActionBadge(log.action)}</td>

                      <td className="px-6 py-3.5 whitespace-nowrap">{getModuleBadge(log.module)}</td>

                      <td className="px-6 py-3.5 text-xs text-slate-700 max-w-md break-words">
                        {log.detail}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
