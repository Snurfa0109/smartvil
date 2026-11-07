"use client";

/**
 * [HALAMAN ADMIN / DASHBOARD] Manajemen Akun Pengguna Warga
 * Monitoring akun terdaftar mandiri portal kelurahan, verifikasi profil, dan pengelolaan kata sandi.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import {
  UserCheck,
  Search,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Phone,
  Calendar,
  FileText,
  MessageSquare,
  ShieldAlert,
  X,
  CheckCircle2,
  Users,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Pencil,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface CitizenAccountItem {
  id: string;
  phone: string;
  nama: string;
  resident_id: string;
  created_at: string;
  nik?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  birth_date?: string;
  status_keluarga?: string;
  status_penduduk?: string;
  agama?: string;
  education?: string;
  total_requests: number;
  total_complaints: number;
}

export default function CitizenAccountsPage() {
  const { role, isSuperAdmin } = useAuth();
  const { success, error: showError, confirm: showConfirm } = useToast();

  const [citizens, setCitizens] = useState<CitizenAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const initialLoadedRef = useRef(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenAccountItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [visibleNiks, setVisibleNiks] = useState<Record<string, boolean>>({});

  const fetchCitizens = useCallback(async () => {
    if (!initialLoadedRef.current) setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/citizen-accounts${search ? `?search=${encodeURIComponent(search)}` : ""}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Gagal memuat akun warga");
      }

      const data: CitizenAccountItem[] = await res.json();
      setCitizens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching citizens:", err);
    } finally {
      setLoading(false);
      initialLoadedRef.current = true;
    }
  }, [search]);

  useEffect(() => {
    fetchCitizens();
  }, [fetchCitizens]);

  const stats = useMemo(() => {
    const total = citizens.length;
    const withRequests = citizens.filter((c) => Number(c.total_requests) > 0).length;
    const withComplaints = citizens.filter((c) => Number(c.total_complaints) > 0).length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonth = citizens.filter((c) => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    return { total, withRequests, withComplaints, thisMonth };
  }, [citizens]);

  const handleOpenPasswordModal = (citizen: CitizenAccountItem) => {
    setSelectedCitizen(citizen);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setPasswordModalOpen(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitizen) return;

    if (newPassword.length < 6) {
      showError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setSavingPassword(true);
    try {
      const token = getToken();
      const res = await fetch("/api/citizen-accounts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "reset_password",
          id: selectedCitizen.id,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah kata sandi");
      }

      await writeAuditLog(
        "UPDATE",
        "warga",
        `Reset kata sandi akun warga: ${selectedCitizen.nama || selectedCitizen.phone} (ID: ${selectedCitizen.id})`
      );

      success(`Kata sandi akun ${selectedCitizen.nama || selectedCitizen.phone} berhasil diperbarui.`);
      setPasswordModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengubah kata sandi";
      showError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleOpenEditModal = (citizen: CitizenAccountItem) => {
    setSelectedCitizen(citizen);
    setEditNama(citizen.nama || "");
    setEditPhone(citizen.phone || "");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitizen) return;

    if (!editNama.trim() || !editPhone.trim()) {
      showError("Nama dan nomor HP wajib diisi.");
      return;
    }

    setSavingEdit(true);
    try {
      const token = getToken();
      const res = await fetch("/api/citizen-accounts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_profile",
          id: selectedCitizen.id,
          nama: editNama.trim(),
          phone: editPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui profil warga");
      }

      await writeAuditLog(
        "UPDATE",
        "warga",
        `Perbarui data akun warga: ${editNama} (${editPhone})`
      );

      success("Data akun warga berhasil diperbarui.");
      setEditModalOpen(false);
      fetchCitizens();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui data";
      showError(message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCitizen = async (citizen: CitizenAccountItem) => {
    const confirmed = await showConfirm({
      title: "Hapus Akun Warga",
      message: `Apakah Anda yakin ingin menghapus akun warga "${citizen.nama || citizen.phone}"? Warga tidak akan bisa login lagi dengan akun ini.`,
      confirmLabel: "Hapus Akun",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const token = getToken();
      const res = await fetch(`/api/citizen-accounts?id=${encodeURIComponent(citizen.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus akun warga");
      }

      await writeAuditLog(
        "DELETE",
        "warga",
        `Hapus akun warga: ${citizen.nama || citizen.phone} (ID: ${citizen.id})`
      );

      success("Akun warga berhasil dihapus.");
      fetchCitizens();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus akun";
      showError(message);
    }
  };

  const toggleNikVisibility = (id: string) => {
    setVisibleNiks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success(`${label} berhasil disalin ke papan klip.`);
  };

  const formatPhoneNumber = (phone: string) => {
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    return clean;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <UserCheck className="h-6 w-6 text-[#1b365d]" />
            Manajemen Akun Warga
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoring akun terdaftar mandiri portal SmartVil, verifikasi identitas, dan pengaturan kata sandi warga.
          </p>
        </div>
        <button
          onClick={() => fetchCitizens()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Muat Ulang
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#1b365d]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Akun Warga</p>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Daftar Bulan Ini</p>
              <p className="text-xl font-bold text-slate-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pernah Ajukan Surat</p>
              <p className="text-xl font-bold text-slate-900">{stats.withRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pernah Mengadu</p>
              <p className="text-xl font-bold text-slate-900">{stats.withComplaints}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama warga, nomor HP, NIK, alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9.5 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>
          <div className="text-xs text-slate-500 self-center">
            Menampilkan <span className="font-semibold text-slate-800">{citizens.length}</span> akun
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4">Nama & Kontak Warga</th>
                <th className="py-3 px-4">NIK & Kependudukan</th>
                <th className="py-3 px-4">Alamat Domisili</th>
                <th className="py-3 px-4 text-center">Aktivitas</th>
                <th className="py-3 px-4">Terdaftar Pada</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-[#1b365d] rounded-full animate-spin" />
                      <p className="text-xs font-medium">Memuat data akun warga...</p>
                    </div>
                  </td>
                </tr>
              ) : citizens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">Belum Ada Akun Warga</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {search
                          ? "Tidak ditemukan akun warga yang cocok dengan kata kunci pencarian Anda."
                          : "Warga yang mendaftar mandiri melalui portal publik akan muncul di halaman ini."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                citizens.map((citizen) => {
                  const isNikVisible = !!visibleNiks[citizen.id];
                  const rawNik = citizen.nik || "-";
                  const maskedNik =
                    rawNik.length === 16
                      ? `${rawNik.slice(0, 6)}******${rawNik.slice(12)}`
                      : rawNik;
                  const waNumber = formatPhoneNumber(citizen.phone);

                  return (
                    <tr key={citizen.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {citizen.nama || "Tanpa Nama"}
                          {citizen.gender && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                              {citizen.gender === "Laki-laki" ? "L" : citizen.gender === "Perempuan" ? "P" : citizen.gender}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {citizen.phone}
                          </span>
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded-md transition-colors"
                            title="Buka WhatsApp Warga"
                          >
                            WA
                            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                          <span>{isNikVisible ? rawNik : maskedNik}</span>
                          {rawNik !== "-" && (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleNikVisibility(citizen.id)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded"
                                title={isNikVisible ? "Sembunyikan NIK" : "Tampilkan NIK Lengkap"}
                              >
                                {isNikVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(rawNik, "NIK")}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded"
                                title="Salin NIK"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {citizen.status_keluarga || "Status Keluarga -"} • {citizen.status_penduduk || "Tetap"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {citizen.address || "Belum ada data alamat"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-center">
                        <div className="inline-flex flex-col gap-1 items-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              Number(citizen.total_requests) > 0
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <FileText className="h-2.5 w-2.5" />
                            {citizen.total_requests} Surat
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              Number(citizen.total_complaints) > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            {citizen.total_complaints} Aduan
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(citizen.created_at)}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCitizen(citizen);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Profil Warga"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(citizen)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Ganti / Reset Kata Sandi"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(citizen)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Akun"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {(isSuperAdmin || role === "admin") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCitizen(citizen)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Akun Warga"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {passwordModalOpen && selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ganti Kata Sandi Warga</h3>
                  <p className="text-xs text-slate-500">
                    {selectedCitizen.nama || selectedCitizen.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Perhatian Petugas:
                </p>
                <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                  Pastikan identitas warga telah diverifikasi sebelum melakukan reset kata sandi akun warga secara manual.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Kata Sandi Baru</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-9 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Konfirmasi Kata Sandi Baru</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi kata sandi baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1b365d] hover:bg-[#152a48] disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {savingPassword ? "Menyimpan..." : "Simpan Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1b365d]">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Profil Akun Warga</h3>
                  <p className="text-xs text-slate-500">ID: {selectedCitizen.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nama Lengkap Warga</label>
                <Input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  required
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nomor HP / WhatsApp (Aktif)</label>
                <Input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  placeholder="Contoh: 081234567890"
                  className="text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1b365d] hover:bg-[#152a48] disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailModalOpen && selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1b365d]">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Detail Lengkap Akun Warga</h3>
                  <p className="text-xs text-slate-500">Informasi profil kependudukan & aktivitas portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Nama Lengkap:</span>
                  <span className="font-semibold text-slate-900">{selectedCitizen.nama || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Nomor HP / WhatsApp:</span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedCitizen.phone || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Nomor Induk Kependudukan (NIK):</span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedCitizen.nik || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Jenis Kelamin:</span>
                  <span className="font-semibold text-slate-900">{selectedCitizen.gender || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Tanggal Lahir:</span>
                  <span className="font-semibold text-slate-900">{selectedCitizen.birth_date || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Agama:</span>
                  <span className="font-semibold text-slate-900">{selectedCitizen.agama || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Pendidikan:</span>
                  <span className="font-semibold text-slate-900">{selectedCitizen.education || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Pekerjaan:</span>
                  <span className="font-semibold text-slate-900">{selectedCitizen.occupation || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Status Keluarga:</span>
                  <span className="font-semibold text-slate-900">{selectedCitizen.status_keluarga || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Status Kependudukan:</span>
                  <span className="font-semibold text-slate-900">{selectedCitizen.status_penduduk || "Tetap"}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Alamat Tempat Tinggal
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedCitizen.address || "Belum ada informasi alamat."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] text-blue-700 font-semibold block flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Permohonan Surat
                  </span>
                  <span className="text-lg font-bold text-blue-900">{selectedCitizen.total_requests} Pengajuan</span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Laporan Pengaduan
                  </span>
                  <span className="text-lg font-bold text-amber-900">{selectedCitizen.total_complaints} Laporan</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Terdaftar sejak: {formatDate(selectedCitizen.created_at)}</span>
                <span className="font-mono">ID: {selectedCitizen.id}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenPasswordModal(selectedCitizen);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Ganti Kata Sandi
              </button>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
