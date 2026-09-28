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
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Upload,
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
import { LetterType, LetterCustomFieldDef, DEFAULT_LETTER_TYPES, getLetterTypes, invalidateLetterTypes } from "@/lib/letters";
import {
  extractPlaceholdersFromDocx,
  smartTemplateFromStaticDocx,
  placeholdersToCustomFields,
  buildTemplateData,
  generateFilledDocx,
  downloadBlob,
  blobToDataUrl,
  dataUrlToBuffer,
  BUILTIN_FIELDS,
} from "@/lib/letter-template";
import LetterSimulationPreview from "@/components/letter-simulation-preview";
import LetterPrintDocument from "@/components/letter-print-document";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export default function LayananDashboardPage() {
  const [activeTab, setActiveTab] = useState<"requests" | "letter_types">("requests");

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

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
    templateFileUrl: "",
    templateStoragePath: "",
    templateData: "",
    templatePlaceholders: [] as string[],
    customFields: [] as LetterCustomFieldDef[],
  });
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [scanningTemplate, setScanningTemplate] = useState(false);
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [templateFileName, setTemplateFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [downloadingDocx, setDownloadingDocx] = useState(false);

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
      const types = await getLetterTypes();
      if (types.length === 0) {
        const initialList: LetterType[] = [];
        for (const item of DEFAULT_LETTER_TYPES) {
          const docRef = await addDoc(collection(db, "letter_types"), {
            ...item,
            createdAt: serverTimestamp(),
          });
          initialList.push({ ...item, id: docRef.id });
        }
        invalidateLetterTypes();
        setLetterTypes(initialList);
      } else {
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

  const handleOpenAddType = () => {
    setEditingTypeId(null);
    setTypeForm({
      code: `srt_${Date.now().toString().slice(-4)}`,
      name: "",
      desc: "",
      requirements: "Fotokopi KTP\nFotokopi Kartu Keluarga (KK)\nSurat Pengantar RT / RW",
      templateNarrative: "Menerangkan bahwa nama tersebut di atas adalah benar warga yang berdomisili di Kelurahan Banjar Agung dan tidak sedang dalam perselisihan perdata atau perkara hukum apapun.",
      active: true,
      templateFileUrl: "",
      templateStoragePath: "",
      templateData: "",
      templatePlaceholders: [],
      customFields: [],
    });
    setTemplateBuffer(null);
    setTemplateFileName("");
    setTemplateError("");
    setIsTypeModalOpen(true);
  };

  const handleOpenEditType = async (item: LetterType) => {
    setEditingTypeId(item.id || null);
    setTypeForm({
      code: item.code,
      name: item.name,
      desc: item.desc,
      requirements: Array.isArray(item.requirements) ? item.requirements.join("\n") : "",
      templateNarrative: item.templateNarrative || "",
      active: item.active !== false,
      templateFileUrl: item.templateFileUrl || "",
      templateStoragePath: item.templateStoragePath || "",
      templateData: item.templateData || "",
      templatePlaceholders: item.templatePlaceholders || [],
      customFields: item.customFields || [],
    });
    setTemplateBuffer(null);
    setTemplateFileName(
      item.templateStoragePath ? item.templateStoragePath.split("/").pop() || "" : ""
    );
    setTemplateError("");
    setIsTypeModalOpen(true);
    // Ambil template lama untuk simulasi kanan (header/logo ikut tampil)
    if (item.templateFileUrl) {
      try {
        const res = await fetch(item.templateFileUrl);
        if (res.ok) setTemplateBuffer(await res.arrayBuffer());
      } catch {
        // simulasi opsional
      }
    } else if (item.templateData) {
      try {
        setTemplateBuffer(await dataUrlToBuffer(item.templateData));
      } catch {
        // simulasi opsional
      }
    }
  };

  const processTemplateFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setTemplateError("File harus berformat .docx (Word).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setTemplateError("Ukuran file maksimal 5MB.");
      return;
    }
    setScanningTemplate(true);
    setUploadingTemplate(false);
    setTemplateError("");
    setTemplateFileName(file.name);
    try {
      let placeholders = await extractPlaceholdersFromDocx(file);
      let finalBuffer: ArrayBuffer;
      let uploadBlob: Blob;

      if (placeholders.length === 0) {
        const smart = await smartTemplateFromStaticDocx(file);
        if (smart.placeholders.length === 0) {
          setTemplateError("Tidak terdeteksi field. Pastikan template berisi baris 'Label : ' (contoh 'Nama Suami : ') atau placeholder {{nama}}.");
          return;
        }
        placeholders = smart.placeholders;
        finalBuffer = smart.buffer;
        uploadBlob = new Blob([smart.buffer], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      } else {
        finalBuffer = await file.arrayBuffer();
        uploadBlob = file;
      }

      // Langsung tampilkan hasil scan + simulasi, JANGAN tunggu upload.
      const customFields = placeholdersToCustomFields(placeholders, typeForm.customFields);
      setTypeForm((prev) => ({
        ...prev,
        templatePlaceholders: placeholders,
        customFields,
      }));
      setTemplateBuffer(finalBuffer.slice(0));
      setScanningTemplate(false);

      setUploadingTemplate(true);
      try {
        const safeCode = (typeForm.code || `srt_${Date.now()}`).trim().toLowerCase().replace(/\s+/g, "_");
        const storagePath = `letter_templates/${safeCode}_${Date.now()}.docx`;
        const storageRef = ref(storage, storagePath);
        // Batasi maksimal 20 detik: Storage yang tidak terjangkau membuat SDK
        // retry sampai bermenit-menit. Lewat batas langsung pakai database.
        const UPLOAD_TIMEOUT_MS = 20_000;
        const url: string = await Promise.race([
          uploadBytes(storageRef, uploadBlob).then(() => getDownloadURL(storageRef)),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Koneksi ke Storage terlalu lama (timeout 20 detik).")), UPLOAD_TIMEOUT_MS)
          ),
        ]);
        setTypeForm((prev) => ({
          ...prev,
          templateFileUrl: url,
          templateStoragePath: storagePath,
          templateData: "",
        }));
      } catch (upErr) {
        console.warn("Upload Storage gagal, pakai penyimpanan database:", upErr);
        try {
          const dataUrl = await blobToDataUrl(uploadBlob);
          setTypeForm((prev) => ({
            ...prev,
            templateFileUrl: "",
            templateStoragePath: "",
            templateData: dataUrl,
          }));
          setTemplateError("");
        } catch {
          const msg = upErr instanceof Error ? upErr.message : String(upErr);
          setTemplateError(
            `Hasil scan OK (${placeholders.length} field tampil di bawah), tapi penyimpanan file gagal. Pilih ulang file untuk coba lagi. Detail: ${msg}`
          );
        }
      } finally {
        setUploadingTemplate(false);
      }
    } catch (err) {
      console.error("Scan template gagal:", err);
      setTemplateError("Gagal membaca file .docx. Pastikan file valid dan coba lagi.");
      setScanningTemplate(false);
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await processTemplateFile(file);
  };

  const handleCustomFieldChange = (idx: number, patch: Partial<LetterCustomFieldDef>) => {
    setTypeForm((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }));
  };

  const handleRemoveCustomField = (idx: number) => {
    setTypeForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;
    if (typeForm.templatePlaceholders.length > 0 && !typeForm.templateFileUrl && !typeForm.templateData) {
      setTemplateError("File template belum selesai diproses. Tunggu hingga tulisan 'Mengunggah...' hilang, atau pilih ulang file bila ada pesan gagal.");
      return;
    }

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
        templateFileUrl: typeForm.templateFileUrl || "",
        templateStoragePath: typeForm.templateStoragePath || "",
        templateData: typeForm.templateData || "",
        templatePlaceholders: typeForm.templatePlaceholders || [],
        customFields: typeForm.customFields || [],
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
      setTemplateBuffer(null);
      setTemplateFileName("");
      setTemplateError("");
      invalidateLetterTypes();
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
        invalidateLetterTypes();
        fetchLetterTypes();
      } catch (err) {
        console.error("Error deleting letter type:", err);
        alert("Gagal menghapus jenis surat.");
      }
    }
  };

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

  const handleDownloadFilledDocx = async () => {
    if (!printRequest) return;
    const letterType = letterTypes.find((lt) => lt.code === printRequest.type);
    const templateSource = letterType?.templateFileUrl || letterType?.templateData;
    if (!templateSource) {
      alert("Jenis surat ini belum memiliki template .docx. Upload template dulu di tab Kelola Jenis Surat.");
      return;
    }
    setDownloadingDocx(true);
    try {
      const res = await fetch(templateSource);
      if (!res.ok) throw new Error("Gagal mengunduh template");
      const buf = await res.arrayBuffer();
      const data = buildTemplateData(printRequest, printConfig);
      const blob = await generateFilledDocx(buf, data);
      downloadBlob(blob, `${printRequest.typeName || "surat"}-${printRequest.ticketCode || printRequest.id}.docx`);
    } catch (err) {
      console.error("Gagal generate DOCX:", err);
      alert("Gagal membuat file DOCX. Coba lagi.");
    } finally {
      setDownloadingDocx(false);
    }
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

      {isTypeModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsTypeModalOpen(false)}
        >
          <Card className="w-full max-w-6xl bg-slate-50 relative max-h-[92vh] overflow-y-auto border-0 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#1b365d] to-[#274b7a] text-white px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">
                      {editingTypeId ? "Edit Jenis Surat" : "Tambah Jenis Surat Baru"}
                    </h2>
                    <p className="text-[11px] text-blue-100 mt-0.5">Upload template Word → auto-scan field → cek live preview → simpan</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {["Upload template", "Info surat", "Field & preview"].map((s, i) => {
                        const done = i === 0 ? typeForm.templatePlaceholders.length > 0 : i === 1 ? !!typeForm.name.trim() : typeForm.templatePlaceholders.length > 0 && !!typeForm.name.trim();
                        return (
                          <span key={s} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${done ? "bg-emerald-400/90 border-emerald-300 text-emerald-950" : "bg-white/10 border-white/25 text-blue-100"}`}>
                            {i + 1}. {s}{done ? " ✓" : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsTypeModalOpen(false)} className="text-white hover:bg-white/15 hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardContent className="pt-5 px-5 md:px-6 pb-0">
              <form onSubmit={handleSaveType} className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                    <Label className="font-bold text-sm text-slate-900">Upload template DOCX</Label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Wajib</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3 ml-8">
                    Seret file Word asli ke kotak di bawah (atau klik untuk memilih). Sistem otomatis memindai baris <code className="bg-slate-100 px-1 rounded border border-slate-200">Nama Suami :</code>, nomor <code className="bg-slate-100 px-1 rounded border">470/</code>, tanggal, dll menjadi field isian user. Hasil cetak mengikuti layout template 100% (kop + logo ikut).
                  </p>
                  <div
                    onDragOver={(ev) => { ev.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(ev) => {
                      ev.preventDefault();
                      setDragOver(false);
                      const f = ev.dataTransfer.files?.[0];
                      if (f) processTemplateFile(f);
                    }}
                    onClick={() => document.getElementById("letter-template-input")?.click()}
                    className={`ml-0 md:ml-8 border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors ${dragOver ? "border-[#1b365d] bg-blue-50" : "border-slate-300 bg-slate-50/60 hover:border-[#1b365d]/60 hover:bg-blue-50/50"}`}
                  >
                    <Upload className="h-8 w-8 mx-auto text-[#1b365d]/70" />
                    <p className="text-xs font-semibold text-slate-800 mt-2">
                      {templateFileName || "Seret & letakkan file .docx di sini, atau klik untuk memilih"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Format .docx Word, maksimal 5MB</p>
                    <Input id="letter-template-input" type="file" accept=".docx" onChange={handleTemplateUpload} disabled={scanningTemplate || uploadingTemplate} className="hidden" />
                  </div>
                  <div className="ml-0 md:ml-8 mt-2.5 space-y-2">
                    {(scanningTemplate || uploadingTemplate) && (
                      <p className="text-xs text-blue-700 flex items-center gap-1.5 font-medium">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {scanningTemplate ? "Memindai template & mendeteksi field..." : "Mengunggah file template ke Storage..."}
                      </p>
                    )}
                    {templateError && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 leading-relaxed flex items-start gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{templateError}</span>
                      </p>
                    )}
                    {typeForm.templateFileUrl && !templateError && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Template terpasang • {typeForm.templatePlaceholders.length} field terdeteksi • <a href={typeForm.templateFileUrl} target="_blank" rel="noreferrer" className="underline">Lihat file</a></span>
                      </p>
                    )}
                    {typeForm.templateData && !typeForm.templateFileUrl && !templateError && (
                      <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Template tersimpan di database ({typeForm.templatePlaceholders.length} field) — Storage tidak terjangkau, tapi cetak & unduh tetap berfungsi penuh.</span>
                      </p>
                    )}
                    {typeForm.templatePlaceholders.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {[...typeForm.templatePlaceholders].sort().map((p) => (
                          <span key={p} className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${BUILTIN_FIELDS.has(p.toLowerCase()) ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                            {"{{"}{p}{"}}"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-[11px] font-bold flex items-center justify-center">2</span>
                        <p className="font-bold text-sm text-slate-900">Informasi surat</p>
                      </div>
                      <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="type-name">Nama Surat Lengkap</Label>
                  <Input
                    id="type-name"
                    required
                    placeholder="Contoh: Surat Keterangan Suami Istri"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type-code">Kode Singkat (Huruf Kecil / Tanpa Spasi)</Label>
                  <Input
                    id="type-code"
                    required
                    placeholder="Contoh: suami_istri"
                    value={typeForm.code}
                    onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type-desc">Deskripsi & Peruntukan Surat</Label>
                  <Input
                    id="type-desc"
                    required
                    placeholder="Contoh: Untuk persyaratan nikah di KUA..."
                    value={typeForm.desc}
                    onChange={(e) => setTypeForm({ ...typeForm, desc: e.target.value })}
                  />
                </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-[11px] font-bold flex items-center justify-center">3</span>
                        <p className="font-bold text-sm text-slate-900">Persyaratan & narasi cadangan</p>
                      </div>
                      <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="type-reqs">Persyaratan Dokumen (Satu per baris)</Label>
                  <Textarea
                    id="type-reqs"
                    rows={4}
                    placeholder="Fotokopi KTP Pemohon&#10;Fotokopi Kartu Keluarga (KK)&#10;Surat Pengantar RT/RW"
                    value={typeForm.requirements}
                    onChange={(e) => setTypeForm({ ...typeForm, requirements: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Daftar berkas ini tampil sebagai panduan bagi warga saat mengajukan surat.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type-narrative">Template Narasi Keterangan Resmi</Label>
                  <Textarea
                    id="type-narrative"
                    rows={3}
                    placeholder="Dipakai bila surat tidak punya template DOCX..."
                    value={typeForm.templateNarrative}
                    onChange={(e) => setTypeForm({ ...typeForm, templateNarrative: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Cadangan bila surat belum punya template DOCX.
                  </p>
                </div>

                <label htmlFor="type-active" className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer text-sm font-medium">
                  <input
                    id="type-active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                    checked={typeForm.active}
                    onChange={(e) => setTypeForm({ ...typeForm, active: e.target.checked })}
                  />
                  Aktifkan di formulir publik
                </label>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-[11px] font-bold flex items-center justify-center">4</span>
                        <p className="font-bold text-sm text-slate-900">Field form user (hasil scan)</p>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">Otomatis dari template. Ubah label/tipe, tandai wajib, atau hapus yang tidak perlu ditanyakan.</p>
                  {typeForm.templatePlaceholders.length > 0 ? (
                    <div className="space-y-2">
                      {typeForm.customFields.length === 0 && (
                        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                          Semua field terdeteksi sebagai data bawaan (nama/NIK/WA/nomor/tanggal) — user otomatis mengisinya, tidak ada field tambahan.
                        </p>
                      )}
                      {typeForm.customFields.map((f, idx) => (
                            <div key={f.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-[11px] font-mono bg-white border border-slate-200 rounded px-1.5 py-1 break-all">{"{{"}{f.key}{"}}"}</code>
                                <button type="button" onClick={() => handleRemoveCustomField(idx)} className="w-7 h-7 shrink-0 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center" title="Hapus field dari form user">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-1.5">
                                <Input className="flex-1 h-8 text-xs bg-white" value={f.label} onChange={(e) => handleCustomFieldChange(idx, { label: e.target.value })} placeholder="Label form" />
                                <select className="h-8 text-xs border border-slate-300 rounded-md bg-white px-1.5 sm:w-28" value={f.type} onChange={(e) => handleCustomFieldChange(idx, { type: e.target.value as LetterCustomFieldDef["type"] })}>
                                  <option value="text">Teks</option>
                                  <option value="number">Angka</option>
                                  <option value="date">Tanggal</option>
                                  <option value="textarea">Paragraf</option>
                                </select>
                                <label className="text-[11px] flex items-center gap-1.5 text-slate-600 whitespace-nowrap px-1">
                                  <input type="checkbox" checked={f.required} onChange={(e) => handleCustomFieldChange(idx, { required: e.target.checked })} /> Wajib
                                </label>
                              </div>
                            </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">Belum ada template. Upload dulu di langkah 1.</p>
                  )}
                    </div>
                  </div>
                  <div className="lg:sticky lg:top-2">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <LetterSimulationPreview
                      templateBuffer={templateBuffer}
                      placeholders={typeForm.templatePlaceholders}
                      customFields={typeForm.customFields}
                      fileName={templateFileName || undefined}
                    />
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-5 md:-mx-6 px-5 md:px-6 py-3 bg-slate-50/95 backdrop-blur border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <p className="text-[11px] text-slate-500">
                    {typeForm.templatePlaceholders.length > 0
                      ? `${typeForm.templatePlaceholders.length} field • ${typeForm.customFields.length} form user • cek preview kanan sebelum simpan`
                      : "Upload template dulu agar field terisi otomatis"}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsTypeModalOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={scanningTemplate || uploadingTemplate} className="bg-[#1b365d] hover:bg-[#152a48]">
                      {scanningTemplate ? "Memindai..." : uploadingTemplate ? "Mengunggah..." : "Simpan Jenis Surat"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

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

              {selectedRequest.formData && Object.keys(selectedRequest.formData).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Data tambahan dari template ({Object.keys(selectedRequest.formData).length} field)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(selectedRequest.formData as Record<string, string>).map(([k, v]) => {
                      const def = (letterTypes.find((lt) => lt.code === selectedRequest.type)?.customFields || []).find((f) => f.key === k);
                      return (
                        <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                          <p className="text-[11px] text-muted-foreground">{def?.label || k}</p>
                          <p className="text-sm font-semibold">{String(v) || "-"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                <Button size="sm" variant="outline" onClick={handleDownloadFilledDocx} disabled={downloadingDocx}>
                  {downloadingDocx ? "Membuat DOCX..." : "Download DOCX Presisi"}
                </Button>
                <Button size="sm" onClick={triggerBrowserPrint} className="bg-primary hover:bg-primary/90">
                  <Printer className="mr-1.5 h-4 w-4" /> Cetak Sekarang (PDF / Printer)
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPrintRequest(null)}>
                  ?
                </Button>
              </div>
            </CardHeader>

            <div className="p-6 overflow-y-auto space-y-6">
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

              <div className="max-w-[760px] mx-auto bg-white p-12 shadow-2xl border border-gray-300 rounded-sm font-serif text-[11pt] leading-relaxed text-black">
                <LetterPrintDocument request={printRequest} letterTypes={letterTypes} printConfig={printConfig} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Print-only copy, styled by globals.css @media print */}
      {printRequest && (
        <div
          id="printable-letter-container"
          style={{ display: "none" }}
        >
          <LetterPrintDocument request={printRequest} letterTypes={letterTypes} printConfig={printConfig} />
        </div>
      )}
    </div>
  );
}
