"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db, firebaseConfig } from "@/lib/firebase";
import { writeAuditLog } from "@/lib/audit";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
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
} from "lucide-react";
import {
  MANAGEABLE_FEATURES,
  DEFAULT_ADMIN_PERMISSIONS,
} from "@/lib/permissions";

interface AdminUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: "superadmin" | "admin" | "operator";
  department?: string;
  active: boolean;
  createdAt?: any;
  lastLogin?: any;
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

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: AdminUser[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          uid: data.uid || d.id,
          displayName: data.displayName || "Admin",
          email: data.email || "-",
          role: data.role || "admin",
          department: data.department || "Kelurahan",
          active: data.active !== false,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          permissions: Array.isArray(data.permissions)
            ? data.permissions
            : data.role === "superadmin"
            ? []
            : DEFAULT_ADMIN_PERMISSIONS,
        });
      });
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
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

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
      const secondaryAppName = `SecondaryApp_${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCred = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim(),
        formData.password
      );

      await updateProfile(userCred.user, {
        displayName: formData.displayName.trim(),
      });

      const newAdminData = {
        uid: userCred.user.uid,
        displayName: formData.displayName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        department: formData.department,
        permissions: formData.role === "superadmin" ? [] : formData.permissions,
        active: true,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userCred.user.uid), newAdminData);

      await signOut(secondaryAuth);

      await writeAuditLog(
        "CREATE",
        "admin",
        `Menambahkan admin baru: ${formData.displayName} (${formData.email}) - Peran: ${formData.role}, Seksi: ${formData.department}`
      );

      setSuccessMsg(`Admin ${formData.displayName} berhasil didaftarkan!`);
      setIsCreateOpen(false);
      await fetchAdmins();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Email sudah terdaftar. Gunakan email lain.");
      } else {
        setErrorMsg(err.message || "Gagal membuat admin baru.");
      }
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
      const updatePayload = {
        displayName: formData.displayName.trim(),
        role: formData.role,
        department: formData.department,
        permissions: formData.role === "superadmin" ? [] : formData.permissions,
        active: formData.active,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "users", editingAdmin.uid), updatePayload);

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
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memperbarui admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    if (admin.uid === currentUser?.uid) {
      alert("Anda tidak dapat menonaktifkan akun sendiri.");
      return;
    }

    const nextState = !admin.active;
    const confirmMsg = nextState
      ? `Aktifkan kembali akses untuk ${admin.displayName}?`
      : `Nonaktifkan akun ${admin.displayName}? Pengguna ini tidak akan bisa login ke dashboard.`;

    if (!confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, "users", admin.uid), {
        active: nextState,
        updatedAt: serverTimestamp(),
      });

      await writeAuditLog(
        "UPDATE",
        "admin",
        `${nextState ? "Mengaktifkan" : "Menonaktifkan"} akun admin: ${admin.displayName} (${admin.email})`
      );

      await fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah status akun admin.");
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.uid === currentUser?.uid) {
      alert("Anda tidak dapat menghapus akun sendiri!");
      return;
    }

    if (!confirm(`Hapus permanen hak akses admin ${admin.displayName} (${admin.email})?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "users", admin.uid));

      await writeAuditLog(
        "DELETE",
        "admin",
        `Menghapus data admin: ${admin.displayName} (${admin.email}) - Peran: ${admin.role}`
      );

      await fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus admin.");
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

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas: Khusus Super Admin</h2>
        <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
          Halaman Pengaturan Admin dan Penugasan Seksi Kelurahan hanya dapat dikelola oleh Super Administrator (Lurah / Seklur).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Pengaturan Admin & Hak Akses</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              Super Admin Only
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola petugas, operator, dan admin seksi di lingkungan Kelurahan Banjar Agung.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1b365d] hover:bg-[#152a48] text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <UserPlus size={16} />
          <span>Tambah Petugas / Admin</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60">
          <div className="flex items-center gap-2 text-purple-800 font-semibold text-sm mb-1">
            <ShieldCheck size={16} />
            <span>Super Admin</span>
          </div>
          <p className="text-xs text-purple-950/70 leading-relaxed">
            Lurah / Sekretaris Kelurahan. Akses penuh mengelola sistem, menambah/menonaktifkan staf admin, dan audit log.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60">
          <div className="flex items-center gap-2 text-[#1b365d] font-semibold text-sm mb-1">
            <Building2 size={16} />
            <span>Admin Seksi (Kasi)</span>
          </div>
          <p className="text-xs text-blue-950/70 leading-relaxed">
            Kepala Seksi Tapem, Ekbang, & Trantibum. Kelola pengaduan warga, pemrosesan permohonan surat, dan berita kegiatan.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-1">
            <Info size={16} />
            <span>Operator Pelayanan</span>
          </div>
          <p className="text-xs text-amber-950/70 leading-relaxed">
            Staf Front Office / Loket. Membantu verifikasi berkas surat, input data kependudukan dan agenda warga.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau bidang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
          >
            <option value="all">Semua Peran</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin Seksi</option>
            <option value="operator">Operator</option>
          </select>

          <button
            onClick={fetchAdmins}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Muat ulang data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Nama & Kontak</th>
                <th className="px-6 py-3.5">Peran / Hak Akses</th>
                <th className="px-6 py-3.5">Seksi / Penugasan</th>
                <th className="px-6 py-3.5">Status Akun</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-[#1b365d] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat daftar admin...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada admin yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isCurrent = admin.uid === currentUser?.uid;

                  return (
                    <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1b365d] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {admin.displayName.charAt(0) || "A"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {admin.displayName}
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail size={12} className="text-slate-400" />
                              <span>{admin.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              admin.role === "superadmin"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : admin.role === "operator"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-blue-100 text-[#1b365d] border border-blue-200"
                            }`}
                          >
                            <Shield size={12} />
                            {admin.role === "superadmin"
                              ? "Super Admin"
                              : admin.role === "operator"
                              ? "Operator"
                              : "Admin Seksi"}
                          </span>
                          <div>
                            {admin.role === "superadmin" ? (
                              <span className="text-[11px] text-purple-700 font-medium">Akses Penuh + Audit</span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">
                                {admin.permissions?.length ?? MANAGEABLE_FEATURES.length} dari {MANAGEABLE_FEATURES.length} Fitur
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span>{admin.department || "Kelurahan Banjar Agung"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          disabled={isCurrent}
                          title={isCurrent ? "Tidak dapat menonaktifkan akun sendiri" : "Klik untuk toggle status"}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            admin.active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          } ${isCurrent ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                        >
                          {admin.active ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(admin)}
                            className="p-1.5 text-slate-500 hover:text-[#1b365d] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit data admin"
                          >
                            <Edit2 size={16} />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus akses admin"
                            >
                              <Trash2 size={16} />
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

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-[#1b365d] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus size={18} />
                <h3 className="font-bold text-base">Tambah Admin / Petugas</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso, S.Sos"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Login
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nama@banjaragung.go.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Awal
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Peran
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin Seksi</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seksi / Bidang
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.role === "superadmin" ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Akses Penuh Super Admin</p>
                    <p className="text-purple-700/90 text-[11px] mt-0.5">
                      Super Admin memiliki akses tak terbatas ke seluruh fitur dan <strong>Log Aktivitas (Sistem Audit)</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Hak Akses Fitur / Menu
                      </label>
                      <p className="text-[11px] text-slate-400">Pilih menu mana saja yang boleh dilihat oleh admin ini</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: MANAGEABLE_FEATURES.map((f) => f.key) })}
                        className="text-[11px] text-[#1b365d] hover:underline font-semibold"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: [] })}
                        className="text-[11px] text-slate-500 hover:underline"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {MANAGEABLE_FEATURES.map((feat) => {
                      const isChecked = formData.permissions.includes(feat.key);
                      return (
                        <label
                          key={feat.key}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-blue-50/70 border-blue-200 text-slate-900"
                              : "bg-slate-50/40 border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  permissions: [...formData.permissions, feat.key],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  permissions: formData.permissions.filter((k) => k !== feat.key),
                                });
                              }
                            }}
                            className="mt-0.5 rounded text-[#1b365d] focus:ring-[#1b365d]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 leading-tight">{feat.label}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{feat.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800">
                    <Lock size={13} className="shrink-0 text-amber-600" />
                    <span>Fitur <strong>Sistem Audit & Kelola Admin</strong> terkunci otomatis khusus Super Admin.</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1b365d] text-white rounded-lg text-sm font-semibold hover:bg-[#152a48] disabled:bg-slate-300 flex items-center gap-2"
                >
                  {submitting ? "Mendaftarkan..." : "Daftarkan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-[#1b365d] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 size={18} />
                <h3 className="font-bold text-base">Ubah Data Admin</h3>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Tidak dapat diubah)
                </label>
                <input
                  type="email"
                  disabled
                  value={editingAdmin.email}
                  className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 text-slate-500 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Peran
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin Seksi</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seksi / Bidang
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b365d]"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Akses
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.active === true}
                      onChange={() => setFormData({ ...formData, active: true })}
                      className="text-[#1b365d]"
                    />
                    <span className="text-sm font-medium text-emerald-700">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.active === false}
                      onChange={() => setFormData({ ...formData, active: false })}
                      className="text-red-600"
                    />
                    <span className="text-sm font-medium text-red-700">Nonaktif</span>
                  </label>
                </div>
              </div>

              {formData.role === "superadmin" ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Akses Penuh Super Admin</p>
                    <p className="text-purple-700/90 text-[11px] mt-0.5">
                      Super Admin memiliki akses tak terbatas ke seluruh fitur dan <strong>Log Aktivitas (Sistem Audit)</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Hak Akses Fitur / Menu
                      </label>
                      <p className="text-[11px] text-slate-400">Pilih menu mana saja yang boleh dilihat oleh admin ini</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: MANAGEABLE_FEATURES.map((f) => f.key) })}
                        className="text-[11px] text-[#1b365d] hover:underline font-semibold"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: [] })}
                        className="text-[11px] text-slate-500 hover:underline"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {MANAGEABLE_FEATURES.map((feat) => {
                      const isChecked = formData.permissions.includes(feat.key);
                      return (
                        <label
                          key={feat.key}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-blue-50/70 border-blue-200 text-slate-900"
                              : "bg-slate-50/40 border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  permissions: [...formData.permissions, feat.key],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  permissions: formData.permissions.filter((k) => k !== feat.key),
                                });
                              }
                            }}
                            className="mt-0.5 rounded text-[#1b365d] focus:ring-[#1b365d]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 leading-tight">{feat.label}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{feat.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800">
                    <Lock size={13} className="shrink-0 text-amber-600" />
                    <span>Fitur <strong>Sistem Audit & Kelola Admin</strong> terkunci otomatis khusus Super Admin.</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1b365d] text-white rounded-lg text-sm font-semibold hover:bg-[#152a48] disabled:bg-slate-300 flex items-center gap-2"
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
