"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Plus, Search, User, ChevronLeft, ChevronRight, Pencil, Trash2, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PendudukDashboardPage() {
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nik: "",
    nama: "",
    gender: "Laki-laki",
    address: "",
    occupation: "",
    birthDate: "",
    statusKeluarga: "Kepala Keluarga",
    statusPenduduk: "Tetap",
    agama: "Islam",
    education: "SMA"
  });

  const itemsPerPage = 10;

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "residents"), orderBy("nama", "asc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setResidents(data);
    } catch (error) {
      console.error("Error fetching residents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormData({
      nik: "",
      nama: "",
      gender: "Laki-laki",
      address: "",
      occupation: "",
      birthDate: "",
      statusKeluarga: "Kepala Keluarga",
      statusPenduduk: "Tetap",
      agama: "Islam",
      education: "SMA"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (resident: any) => {
    setIsEditMode(true);
    setSelectedId(resident.id);
    setFormData({
      nik: resident.nik || "",
      nama: resident.nama || "",
      gender: resident.gender || "Laki-laki",
      address: resident.address || "",
      occupation: resident.occupation || "",
      birthDate: resident.birthDate || "",
      statusKeluarga: resident.statusKeluarga || (resident.status === "Kepala Keluarga" ? "Kepala Keluarga" : "Anggota Keluarga"),
      statusPenduduk: resident.statusPenduduk || (resident.status !== "Kepala Keluarga" ? resident.status : "Tetap") || "Tetap",
      agama: resident.agama || "Islam",
      education: resident.education || "SMA"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data penduduk "${nama}"? Data yang dihapus tidak dapat dikembalikan.`)) {
      try {
        await deleteDoc(doc(db, "residents", id));
        alert("Data penduduk berhasil dihapus.");
        fetchResidents();
      } catch (error) {
        console.error("Error deleting resident:", error);
        alert("Gagal menghapus data penduduk.");
      }
    }
  };

  const handleExportCSV = () => {
    if (residents.length === 0) {
      alert("Tidak ada data penduduk untuk diekspor.");
      return;
    }

    const headers = ["NIK", "Nama Lengkap", "Jenis Kelamin", "Tanggal Lahir", "Agama", "Pendidikan", "Pekerjaan", "Status Keluarga", "Status Penduduk", "Alamat"];
    const rows = residents.map(r => [
      `"${r.nik || ""}"`,
      `"${r.nama || ""}"`,
      `"${r.gender || ""}"`,
      `"${r.birthDate || ""}"`,
      `"${r.agama || ""}"`,
      `"${r.education || ""}"`,
      `"${r.occupation || ""}"`,
      `"${r.statusKeluarga || (r.status === 'Kepala Keluarga' ? 'Kepala Keluarga' : 'Anggota')}"`,
      `"${r.statusPenduduk || (r.status !== 'Kepala Keluarga' ? r.status : 'Tetap') || 'Tetap'}"`,
      `"${(r.address || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `data-penduduk-banjaragung-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        status: formData.statusKeluarga === "Kepala Keluarga" ? "Kepala Keluarga" : formData.statusPenduduk,
        updatedAt: serverTimestamp()
      };

      if (isEditMode && selectedId) {
        await updateDoc(doc(db, "residents", selectedId), payload);
        alert("Data penduduk berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "residents"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        alert("Data penduduk berhasil ditambahkan!");
      }
      setIsModalOpen(false);
      fetchResidents();
    } catch (error) {
      console.error("Error saving resident:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredResidents = residents.filter(r =>
    r.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.nik?.includes(searchTerm) ||
    r.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredResidents.length / itemsPerPage);
  const paginatedResidents = filteredResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Data Penduduk</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola basis data kependudukan dan status demografi kelurahan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="text-xs border-slate-300">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={handleOpenAdd} className="text-xs bg-[#1b365d] hover:bg-[#152a48]">
            <Plus className="mr-2 h-4 w-4" /> Tambah Penduduk
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari nama, NIK, atau alamat..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Daftar Penduduk Desa</CardTitle>
          <span className="text-xs text-muted-foreground">Total: {filteredResidents.length} Jiwa</span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Memuat data kependudukan...</div>
          ) : filteredResidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Belum ada data penduduk.</p>
              {searchTerm && <p className="text-sm">Coba kata kunci pencarian yang lain.</p>}
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">NIK</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nama Lengkap</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">L/P</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status KK</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pendidikan</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pekerjaan</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Alamat</th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {paginatedResidents.map((resident) => {
                    const isKK = resident.statusKeluarga === "Kepala Keluarga" || resident.status === "Kepala Keluarga";
                    return (
                      <tr key={resident.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-mono text-xs">{resident.nik}</td>
                        <td className="p-4 align-middle font-medium text-foreground">{resident.nama}</td>
                        <td className="p-4 align-middle">{resident.gender === "Laki-laki" ? "L" : "P"}</td>
                        <td className="p-4 align-middle">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isKK ? "bg-emerald-100 text-emerald-800 font-semibold" : "bg-slate-100 text-slate-700"
                          }`}>
                            {resident.statusKeluarga || (isKK ? "Kepala Keluarga" : "Anggota")}
                          </span>
                        </td>
                        <td className="p-4 align-middle">{resident.education || "-"}</td>
                        <td className="p-4 align-middle">{resident.occupation || "-"}</td>
                        <td className="p-4 align-middle text-xs max-w-[200px] truncate">{resident.address}</td>
                        <td className="p-4 align-middle text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(resident)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(resident.id, resident.nama)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
        {filteredResidents.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages} ({filteredResidents.length} data)
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <Card
            className="w-full max-w-xl bg-white relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>{isEditMode ? "Edit Data Penduduk" : "Tambah Penduduk Baru"}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK (16 Digit)</Label>
                    <Input
                      id="nik"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      placeholder="Contoh: 320101..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Sesuai KTP"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <select
                      id="gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Tanggal Lahir</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusKeluarga">Status Hubungan Keluarga</Label>
                    <select
                      id="statusKeluarga"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={formData.statusKeluarga}
                      onChange={(e) => setFormData({ ...formData, statusKeluarga: e.target.value })}
                    >
                      <option value="Kepala Keluarga">Kepala Keluarga</option>
                      <option value="Istri">Istri</option>
                      <option value="Anak">Anak</option>
                      <option value="Orang Tua/Mertua">Orang Tua / Mertua</option>
                      <option value="Famili Lain">Famili Lain</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusPenduduk">Status Domisili</Label>
                    <select
                      id="statusPenduduk"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={formData.statusPenduduk}
                      onChange={(e) => setFormData({ ...formData, statusPenduduk: e.target.value })}
                    >
                      <option value="Tetap">Tetap</option>
                      <option value="Kontrak">Kontrak / Sementara</option>
                      <option value="Pindah">Pindah</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agama">Agama</Label>
                    <select
                      id="agama"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={formData.agama}
                      onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Pendidikan Terakhir</Label>
                    <select
                      id="education"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    >
                      <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                      <option value="SD/Sederajat">SD / Sederajat</option>
                      <option value="SMP/Sederajat">SMP / Sederajat</option>
                      <option value="SMA/SMK/Sederajat">SMA / SMK / Sederajat</option>
                      <option value="Diploma (D1-D3)">Diploma (D1-D3)</option>
                      <option value="Sarjana (S1)">Sarjana (S1)</option>
                      <option value="Magister (S2)">Magister (S2)</option>
                      <option value="Doktor (S3)">Doktor (S3)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Pekerjaan</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Contoh: Petani, Wiraswasta, Guru, Karyawan Swasta"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Domisili Lengkap (RT/RW)</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Contoh: Dusun Krajan RT 02 / RW 01"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan Data"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
