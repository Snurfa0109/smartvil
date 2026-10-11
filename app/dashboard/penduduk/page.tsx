"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

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
  occupation: "",
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

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiList("residents", { orderBy: "nama", order: "asc" });
      setResidents(
        (rows || []).map((row: any) => ({
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
    }
  }, [showError]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Derived stats from real data
  const stats = useMemo(() => {
    const total = residents.length;
    const laki = residents.filter((r) => r.gender === "Laki-laki").length;
    const perempuan = residents.filter((r) => r.gender === "Perempuan").length;
    const kk = residents.filter(
      (r) => r.statusKeluarga === "Kepala Keluarga" || r.status === "Kepala Keluarga"
    ).length;
    return { total, laki, perempuan, kk };
  }, [residents]);

  // Filter + search
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

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  // Keyboard: close modal with Escape
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isModalOpen]);

  // Focus trap: focus first input when modal opens
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
      `"${r.nik || ""}"`,
      `"${r.nama || ""}"`,
      `"${r.gender || ""}"`,
      `"${r.birthDate || ""}"`,
      `"${r.agama || ""}"`,
      `"${r.education || ""}"`,
      `"${r.occupation || ""}"`,
      `"${r.statusKeluarga || (r.status === "Kepala Keluarga" ? "Kepala Keluarga" : "Anggota")}"`,
      `"${r.statusPenduduk || (r.status !== "Kepala Keluarga" ? r.status : "Tetap") || "Tetap"}"`,
      `"${(r.address || "").replace(/"/g, '""')}"`,
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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

  // Pagination range (show page numbers around current)
  const pageRange = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjusted = Math.max(1, end - 4);
    return Array.from({ length: end - adjusted + 1 }, (_, i) => adjusted + i);
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Data Penduduk
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola basis data kependudukan dan status demografi kelurahan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs border-slate-300"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="text-xs bg-[#1b365d] hover:bg-[#152a48]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Penduduk
          </Button>
        </div>
      </div>

      {/* Summary Cards: values derived from real fetched data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Penduduk"
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
          color="navy"
          loading={loading}
        />
        <SummaryCard
          label="Laki-laki"
          value={stats.laki}
          icon={<User className="h-5 w-5" />}
          color="sky"
          loading={loading}
        />
        <SummaryCard
          label="Perempuan"
          value={stats.perempuan}
          icon={<User className="h-5 w-5" />}
          color="rose"
          loading={loading}
        />
        <SummaryCard
          label="Kepala Keluarga"
          value={stats.kk}
          icon={<UserCheck className="h-5 w-5" />}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeFilter === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Cari nama, NIK, atau alamat..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Daftar Penduduk</CardTitle>
            {activeFilter !== "semua" && (
              <span className="text-xs bg-[#1b365d]/10 text-[#1b365d] px-2 py-0.5 rounded font-medium">
                {FILTER_TABS.find((t) => t.key === activeFilter)?.label}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {filteredResidents.length} jiwa
          </span>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <LoadingState />
          ) : filteredResidents.length === 0 ? (
            <EmptyState hasSearch={!!searchTerm.trim()} hasFilter={activeFilter !== "semua"} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/80">
                    <th className="text-left font-semibold text-slate-600 px-6 py-3 text-xs uppercase tracking-wide">
                      Penduduk
                    </th>
                    <th className="text-left font-semibold text-slate-600 px-4 py-3 text-xs uppercase tracking-wide hidden md:table-cell">
                      NIK
                    </th>
                    <th className="text-left font-semibold text-slate-600 px-4 py-3 text-xs uppercase tracking-wide hidden lg:table-cell">
                      Status
                    </th>
                    <th className="text-left font-semibold text-slate-600 px-4 py-3 text-xs uppercase tracking-wide hidden xl:table-cell">
                      Pekerjaan
                    </th>
                    <th className="text-left font-semibold text-slate-600 px-4 py-3 text-xs uppercase tracking-wide hidden xl:table-cell">
                      Alamat
                    </th>
                    <th className="text-center font-semibold text-slate-600 px-4 py-3 text-xs uppercase tracking-wide w-24">
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
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Combined name + gender + education for density */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                resident.gender === "Laki-laki"
                                  ? "bg-sky-50 text-sky-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {(resident.nama || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {resident.nama}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {resident.gender === "Laki-laki" ? "L" : "P"}
                                {resident.education ? ` · ${resident.education}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="font-mono text-xs text-slate-600 tracking-wide">
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
                              className="p-1.5 rounded-md text-slate-400 hover:text-[#1b365d] hover:bg-slate-100 transition-colors"
                              title={`Edit data ${resident.nama}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(resident.id, resident.nama)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title={`Hapus data ${resident.nama}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </CardContent>

        {/* Pagination */}
        {filteredResidents.length > ITEMS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              {" - "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredResidents.length)} dari{" "}
              {filteredResidents.length} data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageRange.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 rounded-md text-xs font-medium transition-colors ${
                    page === currentPage
                      ? "bg-[#1b365d] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman selanjutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={isEditMode ? "Edit Data Penduduk" : "Tambah Penduduk Baru"}
        >
          <div
            ref={modalRef}
            className="w-full max-w-xl bg-white rounded-xl shadow-lg relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditMode ? "Edit Data Penduduk" : "Tambah Penduduk Baru"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEditMode
                    ? "Perbarui informasi penduduk di bawah ini."
                    : "Isi formulir berikut untuk menambahkan data penduduk."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Section: Identitas */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
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
                      required
                    />
                  </div>
                </div>
              </fieldset>

              {/* Section: Status */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
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

              {/* Section: Pekerjaan & Alamat */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Pekerjaan & Domisili
                </legend>
                <div className="space-y-1.5">
                  <Label htmlFor="occupation" className="text-xs">Pekerjaan</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => updateField("occupation", e.target.value)}
                    placeholder="Contoh: Petani, Wiraswasta, Guru, Karyawan Swasta"
                    required
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
                    required
                  />
                </div>
              </fieldset>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#1b365d] hover:bg-[#152a48]"
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

function SummaryCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "navy" | "sky" | "rose" | "amber";
  loading: boolean;
}) {
  const colorMap = {
    navy: {
      bg: "bg-[#1b365d]/5",
      icon: "text-[#1b365d]",
      iconBg: "bg-[#1b365d]/10",
    },
    sky: {
      bg: "bg-sky-50",
      icon: "text-sky-600",
      iconBg: "bg-sky-100",
    },
    rose: {
      bg: "bg-rose-50",
      icon: "text-rose-600",
      iconBg: "bg-rose-100",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-700",
      iconBg: "bg-amber-100",
    },
  };

  const c = colorMap[color];

  return (
    <div className={`rounded-xl p-4 ${c.bg} border border-slate-100`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          {loading ? (
            <div className="h-7 w-12 bg-slate-200/60 rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 mt-0.5 tabular-nums">
              {value.toLocaleString("id-ID")}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${c.iconBg} ${c.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

function NativeSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d] focus-visible:ring-offset-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function LoadingState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
      <p className="text-sm text-slate-500 mt-4">Memuat data kependudukan...</p>
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
    <div className="px-6 py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Users className="h-6 w-6 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}
