"use client";

/**
 * [HALAMAN ADMIN / DASHBOARD] Master Data Kependudukan
 * Pencatatan basis data warga per RW/RT, filter demografi, dan rekapitulasi jumlah jiwa.
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { apiList, apiInsert, apiUpdate, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Download,
  X,
  Users,
  UserCheck,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { usePolling } from "@/hooks/use-polling";

type Resident = {
  id: string;
  nik: string;
  nama: string;
  gender: string;
  address: string;
  occupation: string;
  birthDate: string;
  status: string;
  statusKeluarga: string;
  statusPenduduk: string;
  agama: string;
  education: string;
};

type FilterTab = "semua" | "laki" | "perempuan" | "kk";

const ITEMS_PER_PAGE = 10;

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"] as const;
const STATUS_KELUARGA_OPTIONS = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Orang Tua/Mertua",
  "Famili Lain",
] as const;
const STATUS_PENDUDUK_OPTIONS = ["Tetap", "Kontrak", "Pindah"] as const;
const AGAMA_OPTIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya",
] as const;
const EDUCATION_OPTIONS = [
  "Tidak/Belum Sekolah",
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/SMK/Sederajat",
  "Diploma (D1-D3)",
  "Sarjana (S1)",
  "Magister (S2)",
  "Doktor (S3)",
] as const;
const OCCUPATION_OPTIONS = [
  "Belum/Tidak Bekerja",
  "Pelajar/Mahasiswa",
  "PNS/ASN",
  "TNI/Polri",
  "Karyawan Swasta",
  "Wiraswasta/UMKM",
  "Petani/Pekebun",
  "Nelayan",
  "Buruh Harian Lepas",
  "Pedagang",
  "Guru/Pendidik",
  "Tenaga Kesehatan",
  "Ibu Rumah Tangga",
  "Pensiunan",
  "Pekerja Lepas/Freelance",
  "Sopir/Ojek",
  "Tukang/Pekerja Bangunan",
  "Lainnya",
] as const;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "laki", label: "Laki-laki" },
  { key: "perempuan", label: "Perempuan" },
  { key: "kk", label: "Kepala Keluarga" },
];

const EMPTY_FORM = {
  nik: "",
  nama: "",
  gender: "Laki-laki",
  address: "",
  occupation: "Belum/Tidak Bekerja",
  birthDate: "",
  statusKeluarga: "Kepala Keluarga",
  statusPenduduk: "Tetap",
  agama: "Islam",
  education: "SMA/SMK/Sederajat",
};

export default function PendudukDashboardPage() {
  const { success, error: showError, warning, confirm: showConfirm } = useToast();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const modalRef = useRef<HTMLDivElement>(null);
  const initialLoadedRef = useRef(false);

  const fetchResidents = useCallback(async () => {
    if (!initialLoadedRef.current) setLoading(true);
    try {
      const rows = await apiList("residents", { orderBy: "nama", order: "asc" });
      setResidents(
        (rows || []).map((row) => ({
          id: String(row.id),
          nik: String(row.nik || ""),
          nama: String(row.nama || ""),
          gender: String(row.gender || ""),
          address: String(row.address || ""),
          occupation: String(row.occupation || ""),
          birthDate: String(row.birth_date || ""),
          status: String(row.status || ""),
          statusKeluarga: String(row.status_keluarga || ""),
          statusPenduduk: String(row.status_penduduk || ""),
          agama: String(row.agama || ""),
          education: String(row.education || ""),
        }))
      );
    } catch (err) {
      console.error("Error fetching residents:", err);
      showError("Gagal memuat data penduduk. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
      initialLoadedRef.current = true;
    }
  }, [showError]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  usePolling(fetchResidents, 30_000);

  const stats = useMemo(() => {
    const total = residents.length;
    const laki = residents.filter((r) => r.gender === "Laki-laki").length;
    const perempuan = residents.filter((r) => r.gender === "Perempuan").length;
    const kk = residents.filter(
      (r) => r.statusKeluarga === "Kepala Keluarga" || r.status === "Kepala Keluarga"
    ).length;
    return { total, laki, perempuan, kk };
  }, [residents]);

  const filteredResidents = useMemo(() => {
    let result = residents;

    if (activeFilter === "laki") {
      result = result.filter((r) => r.gender === "Laki-laki");
    } else if (activeFilter === "perempuan") {
      result = result.filter((r) => r.gender === "Perempuan");
    } else if (activeFilter === "kk") {
      result = result.filter(
        (r) => r.statusKeluarga === "Kepala Keluarga" || r.status === "Kepala Keluarga"
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.nama?.toLowerCase().includes(q) ||
          r.nik?.includes(searchTerm) ||
          r.address?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [residents, activeFilter, searchTerm]);

  const totalPages = Math.ceil(filteredResidents.length / ITEMS_PER_PAGE);
  const paginatedResidents = filteredResidents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector<HTMLInputElement>("input, select");
      firstInput?.focus();
    }
  }, [isModalOpen]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (resident: Resident) => {
    setIsEditMode(true);
    setSelectedId(resident.id);
    setFormData({
      nik: resident.nik || "",
      nama: resident.nama || "",
      gender: resident.gender || "Laki-laki",
      address: resident.address || "",
      occupation: resident.occupation || "",
      birthDate: resident.birthDate || "",
      statusKeluarga:
        resident.statusKeluarga ||
        (resident.status === "Kepala Keluarga" ? "Kepala Keluarga" : "Anak"),
      statusPenduduk:
        resident.statusPenduduk ||
        (resident.status !== "Kepala Keluarga" ? resident.status : "Tetap") ||
        "Tetap",
      agama: resident.agama || "Islam",
      education: resident.education || "SMA/SMK/Sederajat",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    const confirmed = await showConfirm({
      title: "Hapus Data Penduduk?",
      message: `Apakah Anda yakin ingin menghapus data penduduk "${nama}"? Data yang dihapus tidak dapat dikembalikan.`,
      variant: "danger",
      confirmLabel: "Ya, Hapus",
    });
    if (confirmed) {
      try {
        await apiDelete("residents", id);
        success("Data penduduk berhasil dihapus.");
        fetchResidents();
      } catch (err) {
        console.error("Error deleting resident:", err);
        showError("Gagal menghapus data penduduk.");
      }
    }
  };

  const handleExportCSV = () => {
    if (residents.length === 0) {
      warning("Tidak ada data penduduk untuk diekspor.");
      return;
    }

    const sanitizeCSV = (val: string) =>
      /^[=+\-@]/.test(val) ? `'${val}` : val;
    const headers = [
      "NIK",
      "Nama Lengkap",
      "Jenis Kelamin",
      "Tanggal Lahir",
      "Agama",
      "Pendidikan",
      "Pekerjaan",
      "Status Keluarga",
      "Status Penduduk",
      "Alamat",
    ];
    const rows = residents.map((r) => [
      `"${sanitizeCSV(r.nik || "")}"`,
      `"${sanitizeCSV(r.nama || "")}"`,
      `"${sanitizeCSV(r.gender || "")}"`,
      `"${sanitizeCSV(r.birthDate || "")}"`,
      `"${sanitizeCSV(r.agama || "")}"`,
      `"${sanitizeCSV(r.education || "")}"`,
      `"${sanitizeCSV(r.occupation || "")}"`,
      `"${sanitizeCSV(r.statusKeluarga || (r.status === "Kepala Keluarga" ? "Kepala Keluarga" : "Anggota"))}"`,
      `"${sanitizeCSV(r.statusPenduduk || (r.status !== "Kepala Keluarga" ? r.status : "Tetap") || "Tetap")}"`,
      `"${sanitizeCSV((r.address || "").replace(/"/g, '""'))}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `data-penduduk-banjaragung-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (formData.nik && !/^\d{16}$/.test(formData.nik)) {
      showError("NIK harus 16 digit angka");
      setSaving(false);
      return;
    }
    try {
      const payload = {
        nik: formData.nik,
        nama: formData.nama,
        gender: formData.gender,
        address: formData.address,
        occupation: formData.occupation,
        birth_date: formData.birthDate || null,
        status_keluarga: formData.statusKeluarga,
        status_penduduk: formData.statusPenduduk,
        agama: formData.agama,
        education: formData.education,
        status:
          formData.statusKeluarga === "Kepala Keluarga"
            ? "Kepala Keluarga"
            : formData.statusPenduduk,
      };

      if (isEditMode && selectedId) {
        await apiUpdate("residents", selectedId, payload);
        success("Data penduduk berhasil diperbarui!");
      } else {
        await apiInsert("residents", payload);
        success("Data penduduk berhasil ditambahkan!");
      }
      setIsModalOpen(false);
      fetchResidents();
    } catch (err) {
      console.error("Error saving resident:", err);
      showError("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pageRange = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjusted = Math.max(1, end - 4);
    return Array.from({ length: end - adjusted + 1 }, (_, i) => adjusted + i);
  }, [totalPages, currentPage]);

  const statCards = [
    {
      label: "Total Penduduk",
      value: stats.total,
      icon: <Users className="h-4 w-4" />,
      iconBg: "bg-[#1b365d]/8",
      iconText: "text-[#1b365d]",
      numText: "text-slate-900",
    },
    {
      label: "Laki-laki",
      value: stats.laki,
      icon: <User className="h-4 w-4" />,
      iconBg: "bg-sky-50",
      iconText: "text-sky-600",
      numText: "text-sky-700",
    },
    {
      label: "Perempuan",
      value: stats.perempuan,
      icon: <User className="h-4 w-4" />,
      iconBg: "bg-rose-50",
      iconText: "text-rose-600",
      numText: "text-rose-700",
    },
    {
      label: "Kepala Keluarga",
      value: stats.kk,
      icon: <UserCheck className="h-4 w-4" />,
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      numText: "text-amber-700",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Data Penduduk</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola basis data kependudukan dan status demografi kelurahan
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 px-4 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="bg-[#1b365d] hover:bg-[#152a48] text-white h-9 px-4 text-xs font-bold shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Tambah Penduduk
          </Button>
        </div>
      </div>

      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl bg-slate-200/60 border border-slate-200/70 overflow-hidden">
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className="dash-card group bg-white px-4 py-3.5 flex items-center gap-3"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0 ${s.iconText}`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{s.label}</p>
              {loading ? (
                <div className="h-6 w-10 bg-slate-100 rounded mt-0.5 animate-pulse" />
              ) : (
                <p className={`text-xl font-bold tabular-nums leading-tight ${s.numText}`}>
                  {s.value.toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeFilter === tab.key
                  ? "bg-[#1b365d] text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            type="search"
            placeholder="Cari nama, NIK, atau alamat..."
            className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      
      <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Penduduk</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeFilter !== "semua" && (
                  <span className="inline-flex items-center gap-1 text-[#1b365d] font-semibold mr-1">
                    {FILTER_TABS.find((t) => t.key === activeFilter)?.label} ·
                  </span>
                )}
                <span className="tabular-nums font-semibold text-slate-500">{filteredResidents.length}</span> jiwa
              </p>
            </div>
          </div>
        </div>

        
        {loading ? (
          <LoadingState />
        ) : filteredResidents.length === 0 ? (
          <EmptyState hasSearch={!!searchTerm.trim()} hasFilter={activeFilter !== "semua"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left font-bold text-slate-400 px-6 py-3 text-[10px] uppercase tracking-wider">
                    Penduduk
                  </th>
                  <th className="text-left font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-wider hidden md:table-cell">
                    NIK
                  </th>
                  <th className="text-left font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-wider hidden lg:table-cell">
                    Status
                  </th>
                  <th className="text-left font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-wider hidden xl:table-cell">
                    Pekerjaan
                  </th>
                  <th className="text-left font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-wider hidden xl:table-cell">
                    Alamat
                  </th>
                  <th className="text-center font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-wider w-24">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedResidents.map((resident) => {
                  const isKK =
                    resident.statusKeluarga === "Kepala Keluarga" ||
                    resident.status === "Kepala Keluarga";
                  return (
                    <tr
                      key={resident.id}
                      className="hover:bg-[#1b365d]/[0.015] transition-colors group"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 text-white ${
                              resident.gender === "Laki-laki"
                                ? "bg-gradient-to-br from-[#1b365d] to-[#264478]"
                                : "bg-gradient-to-br from-rose-500 to-pink-600"
                            }`}
                          >
                            {(resident.nama || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {resident.nama}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {resident.gender === "Laki-laki" ? "L" : "P"}
                              {resident.education ? ` · ${resident.education}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="font-mono text-xs text-slate-500 tracking-wide">
                          {resident.nik || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            isKK
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {resident.statusKeluarga || (isKK ? "Kepala Keluarga" : "Anggota")}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 hidden xl:table-cell">
                        {resident.occupation || "-"}
                      </td>

                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="text-xs text-slate-500 truncate block max-w-[200px]">
                          {resident.address || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => handleOpenEdit(resident)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1b365d] hover:bg-[#1b365d]/[0.06] transition-all"
                            title={`Edit data ${resident.nama}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(resident.id, resident.nama)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title={`Hapus data ${resident.nama}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        
        {filteredResidents.length > ITEMS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Halaman <span className="font-semibold text-slate-600">{currentPage}</span> dari{" "}
              <span className="font-semibold text-slate-600">{totalPages}</span>
              <span className="text-slate-300 mx-1.5">·</span>
              <span className="tabular-nums">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredResidents.length)}
              </span>{" "}
              dari {filteredResidents.length} data
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman pertama"
              >
                <ChevronsLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="h-3 w-3" /> Sblm
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {pageRange.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                      page === currentPage
                        ? "bg-[#1b365d] text-white"
                        : "text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman selanjutnya"
              >
                Slnjt <ChevronRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman terakhir"
              >
                <ChevronsRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={isEditMode ? "Edit Data Penduduk" : "Tambah Penduduk Baru"}
        >
          <div
            ref={modalRef}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="relative bg-gradient-to-r from-[#1b365d] to-[#264478] px-6 py-5 text-white overflow-hidden shrink-0">
              <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/[0.04] -translate-y-1/2 translate-x-1/4" />
              <div className="absolute left-0 bottom-0 w-24 h-24 rounded-full bg-white/[0.04] translate-y-1/2 -translate-x-1/3" />

              <div className="relative flex justify-between items-start gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/10">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight">
                      {isEditMode ? "Edit Data Penduduk" : "Tambah Penduduk Baru"}
                    </h2>
                    <p className="text-[13px] text-white/50 mt-0.5">
                      {isEditMode
                        ? "Perbarui informasi penduduk di bawah ini."
                        : "Isi formulir berikut untuk menambahkan data penduduk."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  title="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
              
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Identitas
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nik" className="text-xs">NIK (16 Digit)</Label>
                    <Input
                      id="nik"
                      value={formData.nik}
                      onChange={(e) => updateField("nik", e.target.value)}
                      placeholder="Contoh: 320101..."
                      className="rounded-xl border-slate-200 focus-visible:ring-[#1b365d]"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nama" className="text-xs">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => updateField("nama", e.target.value)}
                      placeholder="Sesuai KTP"
                      className="rounded-xl border-slate-200 focus-visible:ring-[#1b365d]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs">Jenis Kelamin</Label>
                    <NativeSelect
                      id="gender"
                      value={formData.gender}
                      onChange={(v) => updateField("gender", v)}
                      options={GENDER_OPTIONS.map((g) => ({ value: g, label: g }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="birthDate" className="text-xs">Tanggal Lahir</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateField("birthDate", e.target.value)}
                      className="rounded-xl border-slate-200 focus-visible:ring-[#1b365d]"
                      required
                    />
                  </div>
                </div>
              </fieldset>

              
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Status Kependudukan
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="statusKeluarga" className="text-xs">Hubungan Keluarga</Label>
                    <NativeSelect
                      id="statusKeluarga"
                      value={formData.statusKeluarga}
                      onChange={(v) => updateField("statusKeluarga", v)}
                      options={STATUS_KELUARGA_OPTIONS.map((s) => ({
                        value: s,
                        label: s === "Orang Tua/Mertua" ? "Orang Tua / Mertua" : s,
                      }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="statusPenduduk" className="text-xs">Status Domisili</Label>
                    <NativeSelect
                      id="statusPenduduk"
                      value={formData.statusPenduduk}
                      onChange={(v) => updateField("statusPenduduk", v)}
                      options={STATUS_PENDUDUK_OPTIONS.map((s) => ({
                        value: s,
                        label: s === "Kontrak" ? "Kontrak / Sementara" : s,
                      }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agama" className="text-xs">Agama</Label>
                    <NativeSelect
                      id="agama"
                      value={formData.agama}
                      onChange={(v) => updateField("agama", v)}
                      options={AGAMA_OPTIONS.map((a) => ({ value: a, label: a }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="education" className="text-xs">Pendidikan Terakhir</Label>
                    <NativeSelect
                      id="education"
                      value={formData.education}
                      onChange={(v) => updateField("education", v)}
                      options={EDUCATION_OPTIONS.map((e) => ({
                        value: e,
                        label: e,
                      }))}
                    />
                  </div>
                </div>
              </fieldset>

              
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Pekerjaan &amp; Domisili
                </legend>
                <div className="space-y-1.5">
                  <Label htmlFor="occupation" className="text-xs">Pekerjaan</Label>
                  <NativeSelect
                    id="occupation"
                    value={formData.occupation}
                    onChange={(val) => updateField("occupation", val)}
                    options={OCCUPATION_OPTIONS}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs">
                    Alamat Domisili Lengkap (RT/RW)
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Contoh: Dusun Krajan RT 02 / RW 01"
                    className="rounded-xl border-slate-200 focus-visible:ring-[#1b365d]"
                    required
                  />
                </div>
              </fieldset>

              
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 text-xs font-bold rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-[#1b365d] hover:bg-[#152a48] text-white h-9 px-4 text-xs font-bold shadow-sm rounded-lg"
                >
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function NativeSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | { value: string; label: string }[];
}) {
  const normalizedOpts = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
  const hasValue = normalizedOpts.some((opt) => opt.value === value);
  return (
    <select
      id={id}
      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d] focus-visible:ring-offset-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {!hasValue && value && (
        <option value={value}>{value} (data lama)</option>
      )}
      {normalizedOpts.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function LoadingState() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="w-10 h-10 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
      <p className="text-sm text-slate-500 mt-4 font-medium">Memuat data kependudukan...</p>
    </div>
  );
}

function EmptyState({
  hasSearch,
  hasFilter,
}: {
  hasSearch: boolean;
  hasFilter: boolean;
}) {
  let message = "Belum ada data penduduk terdaftar.";
  let hint = 'Klik tombol "Tambah Penduduk" untuk mulai menambahkan data.';

  if (hasSearch && hasFilter) {
    message = "Tidak ada hasil yang cocok.";
    hint = "Coba ubah kata kunci pencarian atau ganti filter yang aktif.";
  } else if (hasSearch) {
    message = "Pencarian tidak menemukan hasil.";
    hint = "Coba kata kunci yang berbeda, atau periksa ejaan yang digunakan.";
  } else if (hasFilter) {
    message = "Tidak ada data untuk filter ini.";
    hint = "Pilih filter lain atau lihat semua data penduduk.";
  }

  return (
    <div className="px-6 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Users className="h-7 w-7 text-slate-300" />
      </div>
      <p className="text-sm font-bold text-slate-700">{message}</p>
      <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">{hint}</p>
    </div>
  );
}
