"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiList, apiUpdate, getToken } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Shield,
  Building2,
  Mail,
  KeyRound,
  AlertTriangle,
  X,
  RefreshCw,
  Info,
  Lock,
  Users,
} from "lucide-react";
import {
  MANAGEABLE_FEATURES,
  DEFAULT_ADMIN_PERMISSIONS,
} from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { usePolling } from "@/hooks/use-polling";

interface AdminUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: "superadmin" | "admin" | "operator";
  department?: string;
  active: boolean;
  createdAt?: string;
  lastLogin?: string;
  permissions?: string[];
}

const DEPARTMENTS = [
  "Sekretariat Kelurahan",
  "Seksi Tata Pemerintahan (Tapem)",
  "Seksi Ekonomi, Pembangunan & Kesra",
  "Seksi Ketentraman & Ketertiban (Trantibum)",
  "Front Office / Pelayanan Terpadu",
];

export default function AdminsManagementPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { error: showError, warning, confirm: showConfirm } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "admin" as "superadmin" | "admin" | "operator",
    department: DEPARTMENTS[0],
    active: true,
    permissions: [...DEFAULT_ADMIN_PERMISSIONS],
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiList("profiles");
      const list: AdminUser[] = (rows || []).map((row) => ({
        id: String(row.id),
        uid: String(row.id),
        displayName: String(row.display_name || "Admin"),
        email: String(row.email || "-"),
        role: (row.role as AdminUser["role"]) || "admin",
        department: String(row.department || "Kelurahan"),
        active: Number(row.active) !== 0,
        createdAt: String(row.created_at ?? ""),
        lastLogin: String(row.last_login ?? ""),
        permissions: Array.isArray(row.permissions)
          ? row.permissions
          : row.role === "superadmin"
          ? []
          : DEFAULT_ADMIN_PERMISSIONS,
      }));
      list.sort((a, b) => {
        if (a.role === "superadmin" && b.role !== "superadmin") return -1;
        if (b.role === "superadmin" && a.role !== "superadmin") return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      setAdmins(list);
    } catch (err) {
      console.error("Error fetching admins:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  usePolling(fetchAdmins, 30_000);

  const handleOpenCreate = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setFormData({
      displayName: "",
      email: "",
      password: "",
      role: "admin",
      department: DEPARTMENTS[1],
      active: true,
      permissions: [...DEFAULT_ADMIN_PERMISSIONS],
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (admin: AdminUser) => {
    setErrorMsg("");
    setSuccessMsg("");
    setEditingAdmin(admin);
    setFormData({
      displayName: admin.displayName,
      email: admin.email,
      password: "",
      role: admin.role,
      department: admin.department || DEPARTMENTS[0],
      active: admin.active,
      permissions: admin.permissions ? [...admin.permissions] : [...DEFAULT_ADMIN_PERMISSIONS],
    });
    setIsEditOpen(true);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.email.trim() || !formData.password) {
      setErrorMsg("Nama, email, dan kata sandi wajib diisi.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const token = getToken();
      if (!token) {
        setErrorMsg("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          displayName: formData.displayName.trim(),
          role: formData.role,
          department: formData.department,
          permissions: formData.role === "superadmin" ? [] : formData.permissions,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error || "Gagal membuat admin baru.");
        return;
      }

      await writeAuditLog(
        "CREATE",
        "admin",
        `Menambahkan admin baru: ${formData.displayName} (${formData.email}) - Peran: ${formData.role}, Seksi: ${formData.department}`
      );

      setSuccessMsg(`Admin ${formData.displayName} berhasil didaftarkan!`);
      setIsCreateOpen(false);
      await fetchAdmins();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Gagal membuat admin baru.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      await apiUpdate("profiles", editingAdmin.uid, {
        display_name: formData.displayName.trim(),
        role: formData.role,
        department: formData.department,
        permissions: formData.role === "superadmin" ? [] : formData.permissions,
        active: formData.active ? 1 : 0,
      });

      await writeAuditLog(
        "UPDATE",
        "admin",
        `Memperbarui profil admin: ${formData.displayName} (${editingAdmin.email}) - Status: ${
          formData.active ? "Aktif" : "Nonaktif"
        }, Peran: ${formData.role}`
      );

      setSuccessMsg(`Data admin ${formData.displayName} berhasil diperbarui.`);
      setIsEditOpen(false);
      setEditingAdmin(null);
      await fetchAdmins();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Gagal memperbarui admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    if (admin.uid === currentUser?.uid) {
      warning("Anda tidak dapat menonaktifkan akun sendiri.");
      return;
    }

    const nextState = !admin.active;
    const confirmMsg = nextState
      ? `Aktifkan kembali akses untuk ${admin.displayName}?`
      : `Nonaktifkan akun ${admin.displayName}? Pengguna ini tidak akan bisa login ke dashboard.`;

    const confirmed = await showConfirm({
      title: nextState ? "Aktifkan Akun?" : "Nonaktifkan Akun?",
      message: confirmMsg,
      variant: nextState ? "default" : "danger",
      confirmLabel: nextState ? "Ya, Aktifkan" : "Ya, Nonaktifkan",
    });
    if (!confirmed) return;

    try {
      await apiUpdate("profiles", admin.uid, { active: nextState ? 1 : 0 });

      await writeAuditLog(
        "UPDATE",
        "admin",
        `${nextState ? "Mengaktifkan" : "Menonaktifkan"} akun admin: ${admin.displayName} (${admin.email})`
      );

      await fetchAdmins();
    } catch (err) {
      console.error(err);
      showError("Gagal mengubah status akun admin.");
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.uid === currentUser?.uid) {
      warning("Anda tidak dapat menghapus akun sendiri!");
      return;
    }

    const confirmed = await showConfirm({
      title: "Hapus Admin?",
      message: `Hapus permanen hak akses admin ${admin.displayName} (${admin.email})?`,
      variant: "danger",
      confirmLabel: "Ya, Hapus",
    });
    if (!confirmed) return;

    try {
      const token = getToken();
      if (!token) {
        showError("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }
      const res = await fetch("/api/admins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: admin.uid }),
      });
      if (!res.ok) {
        const result = await res.json();
        showError(result.error || "Gagal menghapus admin.");
        return;
      }

      await writeAuditLog(
        "DELETE",
        "admin",
        `Menghapus data admin: ${admin.displayName} (${admin.email}) - Peran: ${admin.role}`
      );

      await fetchAdmins();
    } catch (err) {
      console.error(err);
      showError("Gagal menghapus admin.");
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const matchSearch =
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.department && a.department.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "all" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const superadminCount = admins.filter((a) => a.role === "superadmin").length;
  const adminCount = admins.filter((a) => a.role === "admin").length;
  const operatorCount = admins.filter((a) => a.role === "operator").length;

  const getRoleBadge = (role: string) => {
    if (role === "superadmin") return { bg: "bg-violet-50", text: "text-violet-700", label: "Super Admin" };
    if (role === "operator") return { bg: "bg-amber-50", text: "text-amber-700", label: "Operator" };
    return { bg: "bg-[#1b365d]/[0.06]", text: "text-[#1b365d]", label: "Admin Seksi" };
  };

  if (!isSuperAdmin) {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas: Khusus Super Admin</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
          Halaman ini hanya dapat dikelola oleh Super Administrator (Lurah / Seklur).
        </p>
      </div>
    );
  }

  const PermissionsSection = () => (
    formData.role === "superadmin" ? (
      <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-900 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">Akses Penuh Super Admin</p>
          <p className="text-violet-700/90 text-[10px] mt-0.5">
            Super Admin memiliki akses tak terbatas ke seluruh fitur dan <strong>Log Aktivitas (Sistem Audit)</strong>.
          </p>
        </div>
      </div>
    ) : (
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hak Akses Fitur</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Pilih menu yang boleh diakses admin ini</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, permissions: MANAGEABLE_FEATURES.map((f) => f.key) })}
              className="text-[10px] text-[#1b365d] hover:underline font-bold"
            >
              Pilih Semua
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, permissions: [] })}
              className="text-[10px] text-slate-500 hover:underline font-bold"
            >
              Kosongkan
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {MANAGEABLE_FEATURES.map((feat) => {
            const isChecked = formData.permissions.includes(feat.key);
            return (
              <label
                key={feat.key}
                className={`flex items-start gap-2.5 p-2 rounded-lg border text-[11px] cursor-pointer transition-all ${
                  isChecked
                    ? "bg-[#1b365d]/[0.04] border-[#1b365d]/20 text-slate-900"
                    : "bg-slate-50/40 border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, permissions: [...formData.permissions, feat.key] });
                    } else {
                      setFormData({ ...formData, permissions: formData.permissions.filter((k) => k !== feat.key) });
                    }
                  }}
                  className="mt-0.5 rounded text-[#1b365d] focus:ring-[#1b365d]"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 leading-tight">{feat.label}</p>
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">{feat.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[10px] text-amber-800">
          <Lock size={12} className="shrink-0 text-amber-600" />
          <span>Fitur <strong>Sistem Audit & Kelola Admin</strong> terkunci khusus Super Admin.</span>
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-md shadow-[#1b365d]/15">
            <ShieldCheck className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pengaturan Admin</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">Kelola petugas, operator, dan hak akses dashboard</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b365d] hover:bg-[#152a48] text-white rounded-lg text-xs font-bold transition-colors shadow-sm h-9"
        >
          <UserPlus className="h-3.5 w-3.5" /> Tambah Admin
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Super Admin", value: superadminCount, iconBg: "bg-violet-100", iconText: "text-violet-600", numText: "text-violet-700", accentBar: "bg-violet-500", icon: <ShieldCheck className="h-[18px] w-[18px]" /> },
          { label: "Admin Seksi", value: adminCount, iconBg: "bg-[#1b365d]/10", iconText: "text-[#1b365d]", numText: "text-[#1b365d]", accentBar: "bg-[#1b365d]", icon: <Building2 className="h-[18px] w-[18px]" /> },
          { label: "Operator", value: operatorCount, iconBg: "bg-amber-100", iconText: "text-amber-600", numText: "text-amber-700", accentBar: "bg-amber-500", icon: <Users className="h-[18px] w-[18px]" /> },
        ] as const).map((stat, i) => (
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
                    {stat.value}
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

      {/* Role info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-violet-200/70 bg-violet-50/40">
          <div className="flex items-center gap-2 text-violet-700 font-bold text-[12px] mb-1">
            <ShieldCheck size={14} /> Super Admin
          </div>
          <p className="text-[10px] text-violet-900/60 leading-relaxed">
            Lurah / Seklur. Akses penuh ke seluruh sistem, audit log, dan kelola admin.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#1b365d]/10 bg-[#1b365d]/[0.02]">
          <div className="flex items-center gap-2 text-[#1b365d] font-bold text-[12px] mb-1">
            <Building2 size={14} /> Admin Seksi (Kasi)
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Kepala Seksi Tapem, Ekbang, & Trantibum. Kelola pengaduan, surat, dan berita.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/40">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-[12px] mb-1">
            <Info size={14} /> Operator Pelayanan
          </div>
          <p className="text-[10px] text-amber-900/60 leading-relaxed">
            Staf Front Office / Loket. Verifikasi berkas, input data kependudukan.
          </p>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            type="search"
            placeholder="Cari nama, email, atau bidang..."
            className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 text-[11px] font-bold border border-slate-200 rounded-xl px-3 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
          >
            <option value="all">Semua Peran</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin Seksi</option>
            <option value="operator">Operator</option>
          </select>
          <button
            onClick={fetchAdmins}
            disabled={loading}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#1b365d] hover:border-[#1b365d]/30 flex items-center justify-center transition-all"
            title="Muat ulang data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1b365d]/[0.06] flex items-center justify-center">
              <Users className="h-4 w-4 text-[#1b365d]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-800">Daftar Admin</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                <span className="tabular-nums font-semibold text-slate-500">{filteredAdmins.length}</span> petugas terdaftar
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-3 font-medium">Memuat daftar admin...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-700">Tidak ada admin yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-3">Nama & Kontak</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Peran</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Seksi</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => {
                  const isCurrent = admin.uid === currentUser?.uid;
                  const roleBadge = getRoleBadge(admin.role);

                  return (
                    <tr key={admin.id} className="border-b border-slate-100/80 last:border-0 hover:bg-[#1b365d]/[0.015] transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                            {admin.displayName.charAt(0) || "A"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-[#1b365d] transition-colors">
                                {admin.displayName}
                              </p>
                              {isCurrent && (
                                <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                              <Mail size={10} />
                              <span className="truncate">{admin.email}</span>
                            </div>
                            {/* Mobile: show role + status inline */}
                            <div className="flex items-center gap-1.5 mt-1 sm:hidden">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${roleBadge.bg} ${roleBadge.text}`}>
                                <Shield size={9} /> {roleBadge.label}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold ${admin.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                {admin.active ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${roleBadge.bg} ${roleBadge.text}`}>
                            <Shield size={10} /> {roleBadge.label}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {admin.role === "superadmin"
                              ? "Akses Penuh"
                              : `${admin.permissions?.length ?? MANAGEABLE_FEATURES.length}/${MANAGEABLE_FEATURES.length} Fitur`}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                          <Building2 size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{admin.department || "Kelurahan"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          disabled={isCurrent}
                          title={isCurrent ? "Tidak dapat menonaktifkan akun sendiri" : "Toggle status"}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                            admin.active
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          } ${isCurrent ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                        >
                          {admin.active ? <><CheckCircle2 size={10} /> Aktif</> : <><XCircle size={10} /> Nonaktif</>}
                        </button>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(admin)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1b365d] hover:bg-[#1b365d]/[0.06] transition-all"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsCreateOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-[#1b365d] to-[#264478] px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-base text-white">Tambah Admin</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Identitas</legend>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso, S.Sos"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Login</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                    <input
                      type="email"
                      required
                      placeholder="nama@banjaragung.go.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kata Sandi Awal</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Penugasan</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tingkat Peran</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as "superadmin" | "admin" | "operator" })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    >
                      <option value="superadmin">Super Admin</option>
                      <option value="admin">Admin Seksi</option>
                      <option value="operator">Operator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Seksi / Bidang</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              <PermissionsSection />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1b365d] text-white rounded-xl text-xs font-bold hover:bg-[#152a48] disabled:bg-slate-300 transition-colors"
                >
                  {submitting ? "Mendaftarkan..." : "Daftarkan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsEditOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-[#1b365d] to-[#264478] px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Edit2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-base text-white">Ubah Data Admin</h3>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email (Tidak dapat diubah)</label>
                <input
                  type="email"
                  disabled
                  value={editingAdmin.email}
                  className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-400 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tingkat Peran</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "superadmin" | "admin" | "operator" })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin Seksi</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Seksi / Bidang</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Akses</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.active === true}
                      onChange={() => setFormData({ ...formData, active: true })}
                      className="text-[#1b365d]"
                    />
                    <span className="text-[12px] font-bold text-emerald-700">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.active === false}
                      onChange={() => setFormData({ ...formData, active: false })}
                      className="text-red-600"
                    />
                    <span className="text-[12px] font-bold text-red-700">Nonaktif</span>
                  </label>
                </div>
              </div>

              <PermissionsSection />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1b365d] text-white rounded-xl text-xs font-bold hover:bg-[#152a48] disabled:bg-slate-300 transition-colors"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
