"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  FileText,
  Printer,
  Trash2,
  X,
  Plus,
  Edit2,
  FolderCog,
  Layers,
  Sparkles,
  ExternalLink,
  PhoneCall,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LetterType, DEFAULT_LETTER_TYPES } from "@/lib/letters";

export default function LayananDashboardPage() {
  const [activeTab, setActiveTab] = useState<"requests" | "letter_types">("requests");

  // Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Letter types state
  const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    desc: "",
    requirements: "Fotokopi KTP\nFotokopi Kartu Keluarga (KK)\nSurat Pengantar RT / RW",
    templateNarrative: "Menerangkan bahwa nama tersebut di atas adalah benar warga Kelurahan Banjar Agung...",
    active: true,
  });

  // Print modal state
  const [printRequest, setPrintRequest] = useState<any | null>(null);
  const [printConfig, setPrintConfig] = useState({
    nomorSurat: "",
    pejabatNama: "BUDI SANTOSO",
    pejabatJabatan: "Lurah Banjar Agung",
    pejabatNip: "19780512 200501 1 004",
    tanggalSurat: "",
  });

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLetterTypes = async () => {
    setLoadingTypes(true);
    try {
      const snap = await getDocs(collection(db, "letter_types"));
      if (snap.empty) {
        // Initialize with default letter types if empty
        const initialList: LetterType[] = [];
        for (const item of DEFAULT_LETTER_TYPES) {
          const docRef = await addDoc(collection(db, "letter_types"), {
            ...item,
            createdAt: serverTimestamp(),
          });
          initialList.push({ ...item, id: docRef.id });
        }
        setLetterTypes(initialList);
      } else {
        const types = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as LetterType),
        }));
        setLetterTypes(types);
      }
    } catch (err) {
      console.error("Error fetching letter types:", err);
      setLetterTypes(DEFAULT_LETTER_TYPES);
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchLetterTypes();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "requests", id), {
        status: newStatus,
      });
      fetchRequests();
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Gagal memperbarui status.");
    }
  };

  const handleDeleteRequest = async (id: string, name: string) => {
    if (confirm(`Hapus permohonan surat atas nama "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "requests", id));
        if (selectedRequest?.id === id) setSelectedRequest(null);
        fetchRequests();
      } catch (err) {
        console.error("Error deleting request:", err);
        alert("Gagal menghapus permohonan.");
      }
    }
  };

  const handleSendWhatsApp = (item: any) => {
    if (!item.phone) {
      alert("Warga tidak mencantumkan nomor telepon.");
      return;
    }
    let clean = item.phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.substring(1);

    let statusText = "sedang dalam antrean verifikasi berkas oleh petugas";
    if (item.status === "processed") {
      statusText = "sedang diproses dan divalidasi oleh pihak kelurahan";
    } else if (item.status === "ready") {
      statusText = "SUDAH SIAP DIAMBIL DI LOKET KANTOR KELURAHAN BANJAR AGUNG. Silakan datang pada jam kerja resmi (Senin - Jumat 08:00 - 15:30 WIB) dengan membawa KTP dan KK asli";
    } else if (item.status === "completed") {
      statusText = "telah selesai diproses dan diserahkan";
    }

    const message = encodeURIComponent(
      `*PEMBERITAHUAN PELAYANAN SURAT - KELURAHAN BANJAR AGUNG*\n\n` +
      `Yth. Bpk/Ibu *${item.nama}*,\n\n` +
      `Kami menginformasikan bahwa permohonan surat Anda:\n` +
      `• *Jenis Surat:* ${item.typeName || "Surat Keterangan"}\n` +
      `• *Nomor Tiket:* ${item.ticketCode || "-"}\n` +
      `• *Status:* ${statusText}.\n\n` +
      `Jika membutuhkan informasi lebih lanjut, silakan balas pesan ini.\n\n` +
      `_Pemerintah Kelurahan Banjar Agung, Kec. Cipocok Jaya, Kota Serang_`
    );
    window.open(`https://wa.me/${clean}?text=${message}`, "_blank");
  };

  // Type modal helpers
  const handleOpenAddType = () => {
    setEditingTypeId(null);
    setTypeForm({
      code: `srt_${Date.now().toString().slice(-4)}`,
      name: "",
      desc: "",
      requirements: "Fotokopi KTP\nFotokopi Kartu Keluarga (KK)\nSurat Pengantar RT / RW",
      templateNarrative: "Menerangkan bahwa nama tersebut di atas adalah benar warga yang berdomisili di Kelurahan Banjar Agung dan tidak sedang dalam perselisihan perdata atau perkara hukum apapun.",
      active: true,
    });
    setIsTypeModalOpen(true);
  };

  const handleOpenEditType = (item: LetterType) => {
    setEditingTypeId(item.id || null);
    setTypeForm({
      code: item.code,
      name: item.name,
      desc: item.desc,
      requirements: Array.isArray(item.requirements) ? item.requirements.join("\n") : "",
      templateNarrative: item.templateNarrative || "",
      active: item.active !== false,
    });
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;

    try {
      const reqArray = typeForm.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const payload = {
        code: typeForm.code.trim().toLowerCase().replace(/\s+/g, "_"),
        name: typeForm.name.trim(),
        desc: typeForm.desc.trim(),
        requirements: reqArray,
        templateNarrative: typeForm.templateNarrative.trim(),
        active: typeForm.active,
        updatedAt: serverTimestamp(),
      };

      if (editingTypeId) {
        await updateDoc(doc(db, "letter_types", editingTypeId), payload);
        alert("Jenis surat berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "letter_types"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        alert("Jenis surat baru berhasil ditambahkan!");
      }

      setIsTypeModalOpen(false);
      fetchLetterTypes();
    } catch (err) {
      console.error("Error saving letter type:", err);
      alert("Gagal menyimpan jenis surat.");
    }
  };

  const handleDeleteType = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jenis surat "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "letter_types", id));
        fetchLetterTypes();
      } catch (err) {
        console.error("Error deleting letter type:", err);
        alert("Gagal menghapus jenis surat.");
      }
    }
  };

  // Open printable dialog
  const handleOpenPrint = (req: any) => {
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const currentMonthRoman = romanMonths[new Date().getMonth()];
    const randomNum = req.ticketCode ? req.ticketCode.split("-").pop() : "042";

    setPrintConfig({
      nomorSurat: `470 / ${randomNum} / PEM-SMV / ${currentMonthRoman} / ${new Date().getFullYear()}`,
      pejabatNama: "BUDI SANTOSO",
      pejabatJabatan: "Lurah Banjar Agung",
      pejabatNip: "19780512 200501 1 004",
      tanggalSurat: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
    setPrintRequest(req);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  if (loading && loadingTypes) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data layanan surat...</div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pelayanan &amp; Administrasi Surat</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola permohonan surat masuk warga, tambahkan jenis surat baru, dan cetak dokumen resmi kelurahan.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "requests"
                ? "bg-white text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" /> Permohonan Masuk ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("letter_types")}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "letter_types"
                ? "bg-white text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderCog className="h-4 w-4" /> Kelola Jenis Surat ({letterTypes.length})
          </button>
        </div>
      </div>

      {activeTab === "requests" ? (
        /* Tab 1: Requests List */
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-foreground">Belum ada permohonan surat masuk dari warga.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Warga dapat mengajukan surat mandiri melalui portal publik <code>/layanan</code>.
                </p>
              </CardContent>
            </Card>
          ) : (
            requests.map((item) => (
              <Card key={item.id} className="hover:shadow-xs transition-shadow border-slate-200/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {item.typeName}
                    </CardTitle>
                    {item.ticketCode && (
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        {item.ticketCode}
                      </span>
                    )}
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : item.status === "ready"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "processed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status === "completed"
                      ? "Selesai Diserahkan"
                      : item.status === "ready"
                      ? "Siap Diambil di Loket"
                      : item.status === "processed"
                      ? "Sedang Diproses"
                      : "Menunggu Verifikasi"}
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">Pemohon</p>
                      <p className="font-bold text-foreground">{item.nama}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">NIK: {item.nik}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">No. WhatsApp / HP</p>
                      <p className="font-medium text-foreground">{item.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">Keperluan Surat</p>
                      <p className="font-medium text-foreground line-clamp-2">{item.keperluan}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t gap-2">
                    <span>
                      Diajukan:{" "}
                      {item.createdAt?.seconds
                        ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(item)}>
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary hover:text-primary font-semibold border-primary/30"
                        onClick={() => handleOpenPrint(item)}
                      >
                        <Printer className="mr-1.5 h-3.5 w-3.5" /> Cetak Surat Resmi
                      </Button>
                      {item.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item.id, "processed")}>
                          <Clock className="mr-1.5 h-3.5 w-3.5" /> Proses
                        </Button>
                      )}
                      {item.status === "processed" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleStatusUpdate(item.id, "ready")}
                        >
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Siap Diambil
                        </Button>
                      )}
                      {item.status === "ready" && (
                        <Button size="sm" onClick={() => handleStatusUpdate(item.id, "completed")}>
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Tandai Selesai
                        </Button>
                      )}
                      {item.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          onClick={() => handleSendWhatsApp(item)}
                          title="Kirim pesan status via WhatsApp ke warga"
                        >
                          <PhoneCall className="mr-1.5 h-3.5 w-3.5" /> WA Warga
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteRequest(item.id, item.nama)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Tab 2: Manage Letter Types */
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-base text-foreground">Daftar Jenis Surat Aktif</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Surat yang aktif di sini akan langsung tampil pada pilihan formulir permohonan warga di website publik.
              </p>
            </div>
            <Button onClick={handleOpenAddType}>
              <Plus className="mr-1.5 h-4 w-4" /> Tambah Jenis Surat
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {letterTypes.map((type) => (
              <Card key={type.id || type.code} className="border-slate-200 shadow-xs flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        CODE: {type.code}
                      </span>
                      <CardTitle className="text-base font-bold text-foreground mt-1">{type.name}</CardTitle>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        type.active !== false ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {type.active !== false ? "? Aktif" : "? Nonaktif"}
                    </span>
                  </div>
                  <CardDescription className="text-xs leading-relaxed pt-1">{type.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1 mb-3">
                    <p className="font-semibold text-muted-foreground">Persyaratan Dokumen:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {type.requirements?.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditType(type)}>
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => type.id && handleDeleteType(type.id, type.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Letter Type Modal */}
      {isTypeModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsTypeModalOpen(false)}
        >
          <Card className="w-full max-w-lg bg-white relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {editingTypeId ? "Edit Jenis Surat" : "Tambah Jenis Surat Baru"}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsTypeModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSaveType} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="type-name">Nama Surat Lengkap</Label>
                  <Input
                    id="type-name"
                    required
                    placeholder="Contoh: Surat Keterangan Belum Menikah"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type-code">Kode Singkat (Huruf Kecil / Tanpa Spasi)</Label>
                  <Input
                    id="type-code"
                    required
                    placeholder="Contoh: belum_menikah"
                    value={typeForm.code}
                    onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type-desc">Deskripsi & Peruntukan Surat</Label>
                  <Input
                    id="type-desc"
                    required
                    placeholder="Contoh: Untuk persyaratan pendaftaran KUA atau kelengkapan berkas CPNS..."
                    value={typeForm.desc}
                    onChange={(e) => setTypeForm({ ...typeForm, desc: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type-reqs">Persyaratan Dokumen (Satu per baris)</Label>
                  <Textarea
                    id="type-reqs"
                    rows={4}
                    placeholder="Fotokopi KTP Pemohon&#10;Fotokopi Kartu Keluarga (KK)&#10;Surat Pengantar RT/RW&#10;Surat Pernyataan Belum Pernah Menikah"
                    value={typeForm.requirements}
                    onChange={(e) => setTypeForm({ ...typeForm, requirements: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Daftar berkas ini akan tampil sebagai panduan bagi warga saat mengajukan surat.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type-narrative">Template Narasi Keterangan Resmi</Label>
                  <Textarea
                    id="type-narrative"
                    rows={3}
                    placeholder="Menerangkan bahwa nama tersebut di atas adalah benar warga Kelurahan Banjar Agung dan belum pernah tercatat melangsungkan perkawinan/menikah..."
                    value={typeForm.templateNarrative}
                    onChange={(e) => setTypeForm({ ...typeForm, templateNarrative: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Kalimat pernyataan pokok yang akan dicetak di dalam surat resmi desa.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="type-active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                    checked={typeForm.active}
                    onChange={(e) => setTypeForm({ ...typeForm, active: e.target.checked })}
                  />
                  <label htmlFor="type-active" className="text-sm font-medium cursor-pointer">
                    Aktifkan jenis surat ini di formulir publik
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsTypeModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Simpan Jenis Surat</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white relative">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Detail Permohonan Surat</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>?</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3.5 rounded-xl border">
                <div>
                  <p className="text-xs text-muted-foreground">Pemohon</p>
                  <p className="font-bold">{selectedRequest.nama}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NIK</p>
                  <p className="font-mono font-bold">{selectedRequest.nik}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jenis Surat</p>
                  <p className="font-semibold text-primary">{selectedRequest.typeName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">No. Telepon / WA</p>
                  <p className="font-semibold">{selectedRequest.phone || "-"}</p>
                </div>
                {selectedRequest.ticketCode && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Nomor Tiket Pelacakan</p>
                    <p className="font-mono font-bold text-primary">{selectedRequest.ticketCode}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Keperluan Pengajuan</p>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedRequest.keperluan}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Ubah Status Alur Pelayanan</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedRequest.status === "pending" ? "primary" : "outline"}
                    onClick={() => handleStatusUpdate(selectedRequest.id, "pending")}
                  >
                    Menunggu
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedRequest.status === "processed" ? "primary" : "outline"}
                    onClick={() => handleStatusUpdate(selectedRequest.id, "processed")}
                  >
                    Diproses
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedRequest.status === "ready" ? "primary" : "outline"}
                    className={selectedRequest.status === "ready" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    onClick={() => handleStatusUpdate(selectedRequest.id, "ready")}
                  >
                    Siap Diambil
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedRequest.status === "completed" ? "primary" : "outline"}
                    onClick={() => handleStatusUpdate(selectedRequest.id, "completed")}
                  >
                    Selesai
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={() => handleOpenPrint(selectedRequest)}>
                  <Printer className="mr-1.5 h-4 w-4" /> Cetak Surat Resmi
                </Button>
                <Button variant="ghost" onClick={() => setSelectedRequest(null)}>Tutup</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print Preview & Settings Modal */}
      {printRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl bg-white relative my-6 max-h-[95vh] flex flex-col">
            <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Printer className="h-5 w-5 text-primary" /> Cetak Dokumen Surat Resmi
                </CardTitle>
                <CardDescription className="text-xs">
                  Format dokumen standar administrasi desa untuk dicetak (A4) atau disimpan sebagai PDF.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={triggerBrowserPrint} className="bg-primary hover:bg-primary/90">
                  <Printer className="mr-1.5 h-4 w-4" /> Cetak Sekarang (PDF / Printer)
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPrintRequest(null)}>
                  ?
                </Button>
              </div>
            </CardHeader>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Print Metadata Customizer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <Label htmlFor="no-surat" className="text-xs">Nomor Registrasi Surat</Label>
                  <Input
                    id="no-surat"
                    className="h-8 text-xs font-mono"
                    value={printConfig.nomorSurat}
                    onChange={(e) => setPrintConfig({ ...printConfig, nomorSurat: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pj-nama" className="text-xs">Nama Pejabat Penandatangan</Label>
                  <Input
                    id="pj-nama"
                    className="h-8 text-xs"
                    value={printConfig.pejabatNama}
                    onChange={(e) => setPrintConfig({ ...printConfig, pejabatNama: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pj-nip" className="text-xs">NIP / Jabatan</Label>
                  <Input
                    id="pj-nip"
                    className="h-8 text-xs font-mono"
                    value={printConfig.pejabatNip}
                    onChange={(e) => setPrintConfig({ ...printConfig, pejabatNip: e.target.value })}
                  />
                </div>
              </div>

              {/* Realistic A4 Paper Preview */}
              <div className="max-w-[760px] mx-auto bg-white p-12 shadow-2xl border border-gray-300 rounded-sm font-serif text-[11pt] leading-relaxed text-black">
                {/* KOP SURAT */}
                <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
                  <h4 className="font-bold text-sm tracking-wider uppercase">PEMERINTAH KOTA SERANG</h4>
                  <h4 className="font-bold text-sm tracking-wider uppercase">KECAMATAN CIPOCOK JAYA</h4>
                  <h2 className="font-black text-xl tracking-widest uppercase">KANTOR KELURAHAN BANJAR AGUNG</h2>
                  <p className="text-[9pt] font-sans mt-0.5 text-gray-700">
                    Jl. Syech Nawawi Albantani No. 16, Kota Serang, Banten 42122 | Telp/WA: +62 813-1505-3901
                  </p>
                </div>

                {/* JUDUL SURAT */}
                <div className="text-center mb-6">
                  <h3 className="font-bold text-base underline uppercase tracking-wide">
                    {printRequest.typeName || "SURAT KETERANGAN DESA"}
                  </h3>
                  <p className="text-[10pt] font-sans mt-0.5 font-mono">
                    Nomor: {printConfig.nomorSurat}
                  </p>
                </div>

                {/* ISI SURAT */}
                <div className="space-y-3.5 text-justify">
                  <p>
                    Yang bertanda tangan di bawah ini, Lurah Banjar Agung, Kec. Cipocok Jaya, Kota Serang, Banten, dengan ini menerangkan bahwa:
                  </p>

                  <table className="w-full my-3 font-sans text-xs ml-4">
                    <tbody>
                      <tr>
                        <td className="w-44 py-1 text-gray-700">Nama Lengkap</td>
                        <td className="w-4">:</td>
                        <td className="font-bold uppercase text-black">{printRequest.nama}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">NIK (No. KTP)</td>
                        <td>:</td>
                        <td className="font-mono font-semibold">{printRequest.nik}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Nomor Telepon / WA</td>
                        <td>:</td>
                        <td>{printRequest.phone || "-"}</td>
                      </tr>
                      <tr>
                        <td className="py-1 align-top text-gray-700">Maksud / Keperluan</td>
                        <td className="align-top">:</td>
                        <td className="font-semibold text-black">{printRequest.keperluan}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p>
                    {printRequest.templateNarrative ||
                      letterTypes.find((lt) => lt.code === printRequest.type)?.templateNarrative ||
                      "Menerangkan bahwa orang tersebut di atas adalah benar warga yang berdomisili sah di Kelurahan Banjar Agung, berkarakter baik, dan tidak sedang terlibat dalam permasalahan hukum maupun sengketa perdata apapun di lingkungan desa."}
                  </p>

                  <p>
                    Demikian surat keterangan ini kami berikan dengan sebenarnya atas dasar keterangan pemohon dan data arsip yang ada, untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
                  </p>
                </div>

                {/* TANDA TANGAN */}
                <div className="mt-10 flex justify-end">
                  <div className="text-center w-64">
                    <p className="text-xs font-sans">Kelurahan Banjar Agung, {printConfig.tanggalSurat}</p>
                    <p className="font-bold text-xs mt-1 uppercase">{printConfig.pejabatJabatan}</p>

                    <div className="h-20 flex flex-col items-center justify-center my-2">
                      <div className="w-16 h-16 border border-dashed border-gray-400 rounded flex flex-col items-center justify-center text-[8pt] text-gray-400 font-sans">
                        <span>[ QR CODE ]</span>
                        <span className="text-[6pt]">VALIDASI RESMI</span>
                      </div>
                    </div>

                    <p className="font-bold underline uppercase text-xs">{printConfig.pejabatNama}</p>
                    <p className="text-[9pt] font-sans text-gray-600 font-mono">NIP. {printConfig.pejabatNip}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Hidden print container for pure A4 printing (styled via globals.css @media print) */}
      {printRequest && (
        <div
          id="printable-letter-container"
          style={{ display: "none" }}
        >

          {/* KOP SURAT */}
          <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
            <h4 className="font-bold text-sm tracking-wider uppercase">PEMERINTAH KOTA SERANG</h4>
            <h4 className="font-bold text-sm tracking-wider uppercase">KECAMATAN CIPOCOK JAYA</h4>
            <h2 className="font-black text-xl tracking-widest uppercase">KANTOR KELURAHAN BANJAR AGUNG</h2>
            <p className="text-[9pt] font-sans mt-0.5 text-gray-700">
              Jl. Syech Nawawi Albantani No. 16, Kota Serang, Banten 42122 | Telp/WA: +62 813-1505-3901
            </p>
          </div>

          {/* JUDUL */}
          <div className="text-center mb-6">
            <h3 className="font-bold text-base underline uppercase tracking-wide">
              {printRequest.typeName || "SURAT KETERANGAN DESA"}
            </h3>
            <p className="text-[10pt] font-sans mt-0.5 font-mono">
              Nomor: {printConfig.nomorSurat}
            </p>
          </div>

          {/* ISI */}
          <div className="space-y-4 text-justify">
            <p>
              Yang bertanda tangan di bawah ini, Lurah Banjar Agung, Kec. Cipocok Jaya, Kota Serang, Banten, dengan ini menerangkan bahwa:
            </p>

            <table className="w-full my-3 font-sans text-xs ml-4">
              <tbody>
                <tr>
                  <td className="w-44 py-1 text-gray-700">Nama Lengkap</td>
                  <td className="w-4">:</td>
                  <td className="font-bold uppercase text-black">{printRequest.nama}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">NIK (No. KTP)</td>
                  <td>:</td>
                  <td className="font-mono font-semibold">{printRequest.nik}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">Nomor Telepon / WA</td>
                  <td>:</td>
                  <td>{printRequest.phone || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 align-top text-gray-700">Maksud / Keperluan</td>
                  <td className="align-top">:</td>
                  <td className="font-semibold text-black">{printRequest.keperluan}</td>
                </tr>
              </tbody>
            </table>

            <p>
              {printRequest.templateNarrative ||
                letterTypes.find((lt) => lt.code === printRequest.type)?.templateNarrative ||
                "Menerangkan bahwa orang tersebut di atas adalah benar warga yang berdomisili sah di Kelurahan Banjar Agung, berkarakter baik, dan tidak sedang terlibat dalam permasalahan hukum maupun sengketa perdata apapun di lingkungan desa."}
            </p>

            <p>
              Demikian surat keterangan ini kami berikan dengan sebenarnya atas dasar keterangan pemohon dan data arsip yang ada, untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
            </p>
          </div>

          {/* TANDA TANGAN */}
          <div className="mt-12 flex justify-end">
            <div className="text-center w-64">
              <p className="text-xs font-sans">Kelurahan Banjar Agung, {printConfig.tanggalSurat}</p>
              <p className="font-bold text-xs mt-1 uppercase">{printConfig.pejabatJabatan}</p>

              <div className="h-20 flex flex-col items-center justify-center my-2">
                <div className="w-16 h-16 border border-dashed border-gray-400 rounded flex flex-col items-center justify-center text-[8pt] text-gray-400 font-sans">
                  <span>[ QR CODE ]</span>
                  <span className="text-[6pt]">VALIDASI RESMI</span>
                </div>
              </div>

              <p className="font-bold underline uppercase text-xs">{printConfig.pejabatNama}</p>
              <p className="text-[9pt] font-sans text-gray-600 font-mono">NIP. {printConfig.pejabatNip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
