"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { apiInsert, apiUpdate, apiDelete, apiList, apiUpload } from "@/lib/api";
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
  PhoneCall,
  Search,
  ClipboardList,
  ListChecks,
  FileCheck2,
  FileWarning,
  Inbox,
  PackageCheck,
  Eye,
  Hourglass,
  Settings,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LetterType, LetterCustomFieldDef, getLetterTypes, invalidateLetterTypes } from "@/lib/letters";
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/site-config";
import {
  extractPlaceholdersFromDocx,
  stripPlaceholdersFromDocx,
  smartTemplateFromStaticDocx,
  placeholdersToCustomFields,
  blobToDataUrl,
  dataUrlToBuffer,
  BUILTIN_FIELDS,
} from "@/lib/letter-template";
import LetterSimulationPreview from "@/components/letter-simulation-preview";
import LetterPrintEditor from "@/components/letter-print-editor";
import { useToast } from "@/components/ui/toast";

export default function LayananDashboardPage() {
  const { success, error: showError, warning, confirm: showConfirm } = useToast();
  const [activeTab, setActiveTab] = useState<"requests" | "letter_types">("requests");

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reqSearch, setReqSearch] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState<"all" | "pending" | "processed" | "ready" | "completed">("all");

  const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typeSearch, setTypeSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "active" | "inactive" | "template">("all");
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

  const [printRequest, setPrintRequest] = useState<any | null>(null);
  const [printConfig, setPrintConfig] = useState({
    nomorSurat: "",
    pejabatNama: DEFAULT_SITE_SETTINGS.headName,
    pejabatJabatan: DEFAULT_SITE_SETTINGS.headTitle,
    pejabatNip: DEFAULT_SITE_SETTINGS.headNip,
    tanggalSurat: "",
  });
  const [signerDefaults, setSignerDefaults] = useState({
    pejabatNama: DEFAULT_SITE_SETTINGS.headName,
    pejabatJabatan: DEFAULT_SITE_SETTINGS.headTitle,
    pejabatNip: DEFAULT_SITE_SETTINGS.headNip,
  });

  const fetchRequests = async () => {
    try {
      const rows = await apiList("requests", { orderBy: "created_at", order: "desc" });
      setRequests(
        (rows || []).map((row) => ({
          id: String(row.id),
          nama: String(row.nama || ""),
          nik: String(row.nik || ""),
          phone: String(row.phone || ""),
          keperluan: String(row.keperluan || ""),
          ticketCode: String(row.ticket_code || ""),
          type: String(row.type || ""),
          typeName: String(row.type_name || ""),
          templateNarrative: String(row.template_narrative || ""),
          requirements: [],
          formData: typeof row.form_data === "string" ? JSON.parse(row.form_data || "{}") : row.form_data || {},
          status: String(row.status || ""),
          adminNotes: String(row.admin_notes || ""),
          createdAt: row.created_at,
        }))
      );
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
      setLetterTypes(types);
    } catch (err) {
      console.error("Error fetching letter types:", err);
      setLetterTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchLetterTypes();
    getSiteSettings()
      .then((s) =>
        setSignerDefaults({ pejabatNama: s.headName, pejabatJabatan: s.headTitle, pejabatNip: s.headNip })
      )
      .catch(() => undefined);
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await apiUpdate("requests", id, { status: newStatus });
      fetchRequests();
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showError("Gagal memperbarui status.");
    }
  };

  const handleDeleteRequest = async (id: string, name: string) => {
    if (await showConfirm({ title: "Hapus Permohonan", message: `Hapus permohonan surat atas nama "${name}"?`, variant: "danger", confirmLabel: "Hapus" })) {
      try {
        await apiDelete("requests", id);
        if (selectedRequest?.id === id) setSelectedRequest(null);
        fetchRequests();
      } catch (err) {
        console.error("Error deleting request:", err);
        showError("Gagal menghapus permohonan.");
      }
    }
  };

  const handleSendWhatsApp = (item: any) => {
    if (!item.phone) {
      warning("Warga tidak mencantumkan nomor telepon.");
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
      }
    } else if (item.templateData) {
      try {
        setTemplateBuffer(await dataUrlToBuffer(item.templateData));
      } catch {
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
      const rawBuffer = await file.arrayBuffer();
      const hasExisting = (await extractPlaceholdersFromDocx(rawBuffer)).length > 0;
      const cleanBuffer = hasExisting ? stripPlaceholdersFromDocx(rawBuffer) : rawBuffer;

      const smart = await smartTemplateFromStaticDocx(cleanBuffer);
      let placeholders: string[];
      let finalBuffer: ArrayBuffer;
      let uploadBlob: Blob;

      if (smart.placeholders.length > 0) {
        placeholders = smart.placeholders;
        finalBuffer = smart.buffer;
        uploadBlob = new Blob([smart.buffer], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      } else {
        placeholders = [];
        finalBuffer = cleanBuffer;
        uploadBlob = new Blob([cleanBuffer], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        setTemplateError(
          "Tidak ditemukan field isian di template. Pastikan surat memiliki baris seperti \"Nama :\" atau \"Alamat :\" yang diakhiri titik dua, atau tambahkan field secara manual di bawah."
        );
      }

      // Always start fresh: pass [] instead of typeForm.customFields
      // so old field labels/types from a previous template don't carry over
      const customFields = placeholdersToCustomFields(placeholders, [], smart.injected);
      setTypeForm((prev) => ({
        ...prev,
        templatePlaceholders: placeholders,
        customFields,
      }));
      setTemplateBuffer(finalBuffer.slice(0));
      setScanningTemplate(false);

      setUploadingTemplate(true);
      const safeCode = (typeForm.code || `srt_${Date.now()}`).trim().toLowerCase().replace(/\s+/g, "_");
      const storagePath = `${safeCode}_${Date.now()}.docx`;
      try {
        const uploadFile = uploadBlob instanceof File
          ? uploadBlob
          : new File([uploadBlob], storagePath, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const uploadedUrl = await apiUpload(uploadFile, "templates");
        setTypeForm((prev) => ({
          ...prev,
          templateFileUrl: uploadedUrl,
          templateStoragePath: storagePath,
          templateData: "",
        }));
        if (placeholders.length > 0) setTemplateError("");
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
          if (placeholders.length > 0) setTemplateError("");
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

  const handleAddCustomField = () => {
    const base = `field_${Date.now().toString().slice(-4)}`;
    setTypeForm((prev) => ({
      ...prev,
      templatePlaceholders: [...prev.templatePlaceholders, base],
      customFields: [
        ...prev.customFields,
        { key: base, label: "Field Baru", type: "text" as const, required: false },
      ],
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
        description: typeForm.desc.trim(),
        requirements: reqArray,
        template_narrative: typeForm.templateNarrative.trim(),
        active: typeForm.active ? 1 : 0,
        template_file_url: typeForm.templateFileUrl || "",
        template_data: typeForm.templateData || "",
        template_placeholders: typeForm.templatePlaceholders || [],
        custom_fields: typeForm.customFields || [],
      };

      if (editingTypeId) {
        await apiUpdate("letter_types", editingTypeId, payload);
        success("Jenis surat berhasil diperbarui!");
      } else {
        const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `lt_${Date.now()}`;
        await apiInsert("letter_types", { id: newId, ...payload, sort_order: letterTypes.length });
        success("Jenis surat baru berhasil ditambahkan!");
      }

      setIsTypeModalOpen(false);
      setTemplateBuffer(null);
      setTemplateFileName("");
      setTemplateError("");
      invalidateLetterTypes();
      fetchLetterTypes();
    } catch (err) {
      console.error("Error saving letter type:", err);
      const detail = err instanceof Error ? err.message : "";
      showError(`Gagal menyimpan jenis surat.${detail ? ` Detail: ${detail.slice(0, 200)}` : ""}`);
    }
  };

  const handleDeleteType = async (id: string, name: string) => {
    if (await showConfirm({ title: "Hapus Jenis Surat", message: `Apakah Anda yakin ingin menghapus jenis surat "${name}"?`, variant: "danger", confirmLabel: "Hapus" })) {
      try {
        await apiDelete("letter_types", id);
        invalidateLetterTypes();
        fetchLetterTypes();
      } catch (err) {
        console.error("Error deleting letter type:", err);
        showError("Gagal menghapus jenis surat.");
      }
    }
  };

  const handleToggleTypeActive = async (item: LetterType) => {
    if (!item.id) return;
    const next = item.active === false;
    setLetterTypes((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, active: next } : t))
    );
    try {
      await apiUpdate("letter_types", item.id, { active: next ? 1 : 0 });
      invalidateLetterTypes();
    } catch (err) {
      console.error("Error toggling letter type status:", err);
      setLetterTypes((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, active: !next } : t))
      );
      showError("Gagal mengubah status jenis surat.");
    }
  };

  const handleOpenPrint = (req: any) => {
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const currentMonthRoman = romanMonths[new Date().getMonth()];
    const randomNum = req.ticketCode ? req.ticketCode.split("-").pop() : "042";

    setPrintConfig({
      nomorSurat: `470 / ${randomNum} / PEM-SMV / ${currentMonthRoman} / ${new Date().getFullYear()}`,
      pejabatNama: signerDefaults.pejabatNama,
      pejabatJabatan: signerDefaults.pejabatJabatan,
      pejabatNip: signerDefaults.pejabatNip,
      tanggalSurat: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
    setPrintRequest(req);
  };

  const hasTemplate = (t: LetterType) => !!(t.templateFileUrl || t.templateData);

  // Pipeline stats from real data
  const reqStats = useMemo(() => {
    const pending = requests.filter((r) => r.status === "pending").length;
    const processed = requests.filter((r) => r.status === "processed").length;
    const ready = requests.filter((r) => r.status === "ready").length;
    const completed = requests.filter((r) => r.status === "completed").length;
    return { total: requests.length, pending, processed, ready, completed };
  }, [requests]);

  // Filtered requests by status + search
  const filteredRequests = useMemo(() => {
    let result = requests;
    if (reqStatusFilter !== "all") {
      result = result.filter((r) => r.status === reqStatusFilter);
    }
    if (reqSearch.trim()) {
      const q = reqSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.nama?.toLowerCase().includes(q) ||
          r.nik?.includes(reqSearch) ||
          r.typeName?.toLowerCase().includes(q) ||
          r.ticketCode?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [requests, reqStatusFilter, reqSearch]);
  const filteredTypes = letterTypes.filter((t) => {
    const q = typeSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q);
    const matchFilter =
      typeFilter === "all"
        ? true
        : typeFilter === "active"
        ? t.active !== false
        : typeFilter === "inactive"
        ? t.active === false
        : hasTemplate(t);
    return matchSearch && matchFilter;
  });
  const activeCount = letterTypes.filter((t) => t.active !== false).length;
  const templateCount = letterTypes.filter(hasTemplate).length;

  if (loading && loadingTypes) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 mt-4">Memuat data layanan surat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1b365d] to-[#2a4a7f] flex items-center justify-center text-white shrink-0">
              <FileText className="h-4 w-4" />
            </span>
            Pelayanan &amp; Administrasi Surat
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-10">
            Kelola permohonan surat masuk warga, kelola jenis surat, dan cetak dokumen resmi.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100/80 p-1 border border-slate-200 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "requests"
                ? "bg-white text-[#1b365d] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="h-4 w-4" /> Permohonan Masuk
            <span className={`tabular-nums px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === "requests" ? "bg-[#1b365d]/10 text-[#1b365d]" : "bg-slate-200/80 text-slate-500"
            }`}>{requests.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("letter_types")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "letter_types"
                ? "bg-white text-[#1b365d] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FolderCog className="h-4 w-4" /> Kelola Jenis Surat
            <span className={`tabular-nums px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === "letter_types" ? "bg-[#1b365d]/10 text-[#1b365d]" : "bg-slate-200/80 text-slate-500"
            }`}>{letterTypes.length}</span>
          </button>
        </div>
      </div>

      {activeTab === "requests" ? (
        /* Tab 1: Requests — pipeline dashboard */
        <div className="space-y-6">
          {/* Pipeline stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {([
              { key: "all" as const, label: "Total Masuk", value: reqStats.total, icon: <Layers className="h-5 w-5" />, gradient: "from-[#1b365d] to-[#264478]", iconBg: "bg-[#1b365d]/10", iconText: "text-[#1b365d]", numText: "text-[#1b365d]", borderHover: "hover:border-[#1b365d]/30" },
              { key: "pending" as const, label: "Menunggu", value: reqStats.pending, icon: <Hourglass className="h-5 w-5" />, gradient: "from-amber-500 to-orange-500", iconBg: "bg-amber-100", iconText: "text-amber-600", numText: "text-amber-700", borderHover: "hover:border-amber-300" },
              { key: "processed" as const, label: "Diproses", value: reqStats.processed, icon: <Settings className="h-5 w-5" />, gradient: "from-sky-500 to-blue-600", iconBg: "bg-sky-100", iconText: "text-sky-600", numText: "text-sky-700", borderHover: "hover:border-sky-300" },
              { key: "ready" as const, label: "Siap Diambil", value: reqStats.ready, icon: <PackageCheck className="h-5 w-5" />, gradient: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-100", iconText: "text-emerald-600", numText: "text-emerald-700", borderHover: "hover:border-emerald-300" },
              { key: "completed" as const, label: "Selesai", value: reqStats.completed, icon: <CheckCircle className="h-5 w-5" />, gradient: "from-slate-500 to-slate-700", iconBg: "bg-slate-100", iconText: "text-slate-500", numText: "text-slate-700", borderHover: "hover:border-slate-300" },
            ] as const).map((s, i) => {
              const isActive = reqStatusFilter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setReqStatusFilter(reqStatusFilter === s.key ? "all" : s.key)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={`layanan-stat-card group relative overflow-hidden rounded-2xl text-left transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${s.gradient} text-white shadow-lg shadow-slate-900/10 ring-2 ring-white/20 scale-[1.02]`
                      : `bg-white border border-slate-200 ${s.borderHover} hover:shadow-md`
                  }`}
                >
                  {/* Top accent bar */}
                  {!isActive && <div className={`h-1 ${s.iconBg}`} />}

                  <div className="p-4 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? "text-white/70" : "text-slate-400"}`}>
                          {s.label}
                        </p>
                        {loading ? (
                          <div className={`h-9 w-14 rounded-lg mt-2 ${isActive ? "bg-white/20" : "bg-slate-100"} animate-pulse`} />
                        ) : (
                          <p className={`text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight leading-none ${isActive ? "text-white" : s.numText}`}>
                            {s.value}
                          </p>
                        )}
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isActive ? "bg-white/15 text-white" : `${s.iconBg} ${s.iconText}`
                      }`}>
                        {s.icon}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/40 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar + active filter badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#1b365d] transition-colors" />
              <Input
                type="search"
                placeholder="Cari nama, NIK, tiket, atau jenis surat..."
                className="pl-9 h-10 border-slate-200 bg-white rounded-xl focus:border-[#1b365d] focus:ring-[#1b365d]/20 transition-shadow"
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
              />
            </div>
            {reqStatusFilter !== "all" && (
              <button
                onClick={() => setReqStatusFilter("all")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1b365d] bg-[#1b365d]/8 hover:bg-[#1b365d]/15 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Hapus filter
              </button>
            )}
          </div>

          {/* Requests table card */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Table header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                  <FileText className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Daftar Permohonan</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {reqStatusFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 text-[#1b365d] font-semibold mr-1">
                        {reqStatusFilter === "pending" ? "Menunggu" : reqStatusFilter === "processed" ? "Diproses" : reqStatusFilter === "ready" ? "Siap Diambil" : "Selesai"}
                        ·
                      </span>
                    )}
                    <span className="tabular-nums font-semibold text-slate-500">{filteredRequests.length}</span> permohonan
                  </p>
                </div>
              </div>
            </div>

            {/* Table body */}
            {loading ? (
              <div className="px-6 py-20 text-center">
                <div className="w-10 h-10 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 mt-4 font-medium">Memuat permohonan...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                  <Inbox className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-700">
                  {requests.length === 0
                    ? "Belum ada permohonan surat masuk"
                    : reqSearch.trim()
                    ? "Pencarian tidak menemukan hasil"
                    : "Tidak ada permohonan dengan status ini"}
                </p>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
                  {requests.length === 0
                    ? "Warga dapat mengajukan surat melalui portal publik /layanan."
                    : reqSearch.trim()
                    ? "Coba kata kunci lain atau hapus filter."
                    : "Pilih status lain atau lihat semua permohonan."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/60">
                      <th className="text-left font-bold text-slate-400 px-6 py-3 text-[10px] uppercase tracking-widest">
                        Pemohon
                      </th>
                      <th className="text-left font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-widest hidden md:table-cell">
                        Jenis Surat
                      </th>
                      <th className="text-left font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-widest hidden lg:table-cell">
                        Tanggal
                      </th>
                      <th className="text-left font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-widest">
                        Status
                      </th>
                      <th className="text-center font-bold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-widest w-36">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {filteredRequests.map((item, idx) => {
                      const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
                        pending: { label: "Menunggu", bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
                        processed: { label: "Diproses", bg: "bg-sky-50 border-sky-200/60", text: "text-sky-700", dot: "bg-sky-500" },
                        ready: { label: "Siap Diambil", bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500" },
                        completed: { label: "Selesai", bg: "bg-slate-50 border-slate-200/60", text: "text-slate-500", dot: "bg-slate-400" },
                      };
                      const sc = statusConfig[item.status] || statusConfig.pending;
                      const nextAction = item.status === "pending"
                        ? { label: "Proses", next: "processed", cls: "bg-sky-500 hover:bg-sky-600 text-white" }
                        : item.status === "processed"
                        ? { label: "Siap Ambil", next: "ready", cls: "bg-emerald-500 hover:bg-emerald-600 text-white" }
                        : item.status === "ready"
                        ? { label: "Selesai", next: "completed", cls: "bg-[#1b365d] hover:bg-[#152a48] text-white" }
                        : null;
                      return (
                        <tr
                          key={item.id}
                          className="group hover:bg-[#1b365d]/[0.015] transition-colors duration-150 cursor-pointer"
                          onClick={() => setSelectedRequest(item)}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {(item.nama || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate text-[13px] group-hover:text-[#1b365d] transition-colors">{item.nama}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                  {item.ticketCode || item.nik}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-slate-600 truncate block max-w-[180px] text-xs">{item.typeName}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-[11px] text-slate-400">
                              {item.createdAt
                                ? new Date(
                                    typeof item.createdAt === "string" ? item.createdAt : item.createdAt.seconds * 1000
                                  ).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                                : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${item.status === "pending" ? "animate-pulse" : ""}`} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {nextAction ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, nextAction.next); }}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-200 ${nextAction.cls}`}
                                >
                                  {nextAction.label}
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 bg-slate-50">
                                  <CheckCircle className="h-3 w-3" /> Tuntas
                                </span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedRequest(item); }}
                                className="p-1.5 rounded-md text-slate-400 hover:text-[#1b365d] hover:bg-[#1b365d]/5 transition-all"
                                title="Lihat detail"
                              >
                                <Eye className="h-4 w-4" />
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
          </div>
        </div>
      ) : (
        /* Tab 2: Manage Letter Types */
        <div className="space-y-5">
          {/* Header: tujuan tab + aksi utama */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="absolute inset-y-0 left-0 w-1 bg-[#1b365d]" />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 pl-6">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#1b365d] flex items-center justify-center shrink-0">
                  <FolderCog className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Katalog Jenis Surat</h3>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                    Jenis surat yang aktif di sini langsung muncul di formulir permohonan warga pada portal publik.
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
                    <span className="text-xs text-slate-500">
                      <strong className="text-slate-800 font-semibold">{letterTypes.length}</strong> jenis surat
                    </span>
                    <span className="text-xs text-slate-500">
                      <strong className="text-emerald-700 font-semibold">{activeCount}</strong> aktif
                    </span>
                    <span className="text-xs text-slate-500">
                      <strong className="text-[#1b365d] font-semibold">{templateCount}</strong> ber-template DOCX
                    </span>
                  </div>
                </div>
              </div>
              <Button onClick={handleOpenAddType} className="bg-[#1b365d] hover:bg-[#152a48] h-10 shrink-0">
                <Plus className="mr-1.5 h-4 w-4" /> Tambah Jenis Surat
              </Button>
            </div>
          </div>

          {/* Toolbar: cari + filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                placeholder="Cari nama, kode, atau keterangan surat..."
                className="pl-9 h-10 border-slate-300"
              />
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start">
              {([
                ["all", "Semua"],
                ["active", "Aktif"],
                ["inactive", "Nonaktif"],
                ["template", "Ber-template"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTypeFilter(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    typeFilter === key
                      ? "bg-white text-[#1b365d] shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar kartu */}
          {filteredTypes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
              <Search className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-700">Tidak ada jenis surat yang cocok</p>
              <p className="text-xs text-slate-500 mt-1">
                Ubah kata kunci pencarian atau pilih filter lain.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTypes.map((type, i) => (
                <div
                  key={type.id || type.code}
                  style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                  className="lt-card group relative flex flex-col rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-[#1b365d]/40 hover:shadow-[0_8px_28px_-14px_rgba(27,54,93,0.35)] focus-within:border-[#1b365d]/50"
                >
                  {/* Aksen atas: status aktif ditandai garis emas, nonaktif abu */}
                  <div className={`h-1 rounded-t-2xl transition-colors ${type.active !== false ? "bg-[#c9971c]" : "bg-slate-200"}`} />

                  <div className="flex flex-col flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <code className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          {type.code}
                        </code>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug mt-1.5 line-clamp-2">
                          {type.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={type.active !== false}
                        aria-label={`${type.active !== false ? "Nonaktifkan" : "Aktifkan"} ${type.name}`}
                        onClick={() => handleToggleTypeActive(type)}
                        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d]/40 focus-visible:ring-offset-2 ${
                          type.active !== false ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                        title={type.active !== false ? "Aktif di formulir publik" : "Tidak tampil di formulir publik"}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            type.active !== false ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mt-2 line-clamp-2 min-h-[2rem]">
                      {type.desc || "Belum ada keterangan."}
                    </p>

                    {/* Meta ringkas: persyaratan + field + template */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                        <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                        {type.requirements?.length || 0} syarat
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                        <ListChecks className="h-3.5 w-3.5 text-slate-400" />
                        {type.customFields?.length || 0} field
                      </span>
                      {hasTemplate(type) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1b365d] bg-[#1b365d]/8 border border-[#1b365d]/20 rounded-md px-2 py-1">
                          <FileCheck2 className="h-3.5 w-3.5" />
                          DOCX
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                          <FileWarning className="h-3.5 w-3.5" />
                          Tanpa template
                        </span>
                      )}
                    </div>

                    {/* Aksi */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 border-slate-300 text-slate-700 hover:border-[#1b365d]/40 hover:text-[#1b365d] hover:bg-[#1b365d]/5"
                        onClick={() => handleOpenEditType(type)}
                      >
                        <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit & Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => type.id && handleDeleteType(type.id, type.name)}
                        title="Hapus jenis surat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isTypeModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsTypeModalOpen(false)}
        >
          <Card className="w-full max-w-7xl bg-white relative max-h-[94vh] overflow-hidden border shadow-2xl rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-8 py-6 border-b border-white/10">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                    <Layers className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      {editingTypeId ? "Edit Jenis Surat" : "Tambah Jenis Surat Baru"}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">Upload template Word asli, sistem otomatis deteksi field isian</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsTypeModalOpen(false)} className="text-white hover:bg-white/10 rounded-xl">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(94vh - 100px)' }}>
            <CardContent className="p-8">
              <form onSubmit={handleSaveType} className="space-y-6">
                <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center">1</div>
                    <div className="flex-1">
                      <Label className="font-bold text-base text-slate-900 block">Upload Template DOCX</Label>
                      <p className="text-xs text-slate-600 mt-0.5">Upload file Word surat asli. Sistem otomatis mendeteksi field isian seperti &quot;Nama :&quot;, &quot;Alamat :&quot; dari template</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">Wajib</span>
                  </div>
                  
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
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-slate-900 bg-slate-50 scale-[1.02]" : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50"}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-colors ${dragOver ? "bg-slate-900" : "bg-slate-100"}`}>
                      <Upload className={`h-8 w-8 transition-colors ${dragOver ? "text-white" : "text-slate-600"}`} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      {templateFileName || "Seret file .docx ke sini atau klik untuk memilih"}
                    </p>
                    <p className="text-xs text-slate-500">Format DOCX, maksimal 5MB</p>
                    <Input id="letter-template-input" type="file" accept=".docx" onChange={handleTemplateUpload} disabled={scanningTemplate || uploadingTemplate} className="hidden" />
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    {(scanningTemplate || uploadingTemplate) && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">
                            {scanningTemplate ? "Membaca template..." : "Mengunggah ke storage..."}
                          </p>
                          <p className="text-xs text-blue-700 mt-0.5">
                            {scanningTemplate ? "Mencari placeholder {{...}} di dalam dokumen" : "Menyimpan file template"}
                          </p>
                        </div>
                      </div>
                    )}
                    {templateError && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900">Terjadi kesalahan</p>
                          <p className="text-xs text-red-700 mt-1 leading-relaxed">{templateError}</p>
                        </div>
                      </div>
                    )}
                    {typeForm.templateFileUrl && !templateError && (
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-emerald-900">Template berhasil dipasang</p>
                          <p className="text-xs text-emerald-700 mt-1">
                            {typeForm.templatePlaceholders.length} field terdeteksi • <a href={typeForm.templateFileUrl} target="_blank" rel="noreferrer" className="underline font-medium">Lihat file asli</a>
                          </p>
                        </div>
                      </div>
                    )}
                    {typeForm.templateData && !typeForm.templateFileUrl && !templateError && (
                      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">Template tersimpan (database)</p>
                          <p className="text-xs text-blue-700 mt-1">{typeForm.templatePlaceholders.length} field terdeteksi • Cetak & unduh tetap berfungsi penuh</p>
                        </div>
                      </div>
                    )}
                    {typeForm.templatePlaceholders.length > 0 && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Field Terdeteksi:</p>
                        <div className="flex flex-wrap gap-2">
                          {[...typeForm.templatePlaceholders].sort().map((p) => (
                            <span key={p} className={`text-xs font-mono px-2.5 py-1 rounded-lg border font-medium ${BUILTIN_FIELDS.has(p.toLowerCase()) ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                              {"{{"}{p}{"}}"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center">2</div>
                        <div className="flex-1">
                          <Label className="font-bold text-base text-slate-900 block">Informasi Surat</Label>
                          <p className="text-xs text-slate-600 mt-0.5">Nama dan deskripsi jenis surat</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="type-name" className="text-sm font-medium text-slate-700">Nama Surat Lengkap</Label>
                          <Input
                            id="type-name"
                            required
                            placeholder="Contoh: Surat Keterangan Suami Istri"
                            value={typeForm.name}
                            onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                            className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type-code" className="text-sm font-medium text-slate-700">Kode Singkat (huruf kecil, tanpa spasi)</Label>
                          <Input
                            id="type-code"
                            required
                            placeholder="Contoh: suami_istri"
                            value={typeForm.code}
                            onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                            className="h-11 font-mono border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type-desc" className="text-sm font-medium text-slate-700">Deskripsi & Peruntukan</Label>
                          <Input
                            id="type-desc"
                            required
                            placeholder="Contoh: Untuk persyaratan nikah di KUA..."
                            value={typeForm.desc}
                            onChange={(e) => setTypeForm({ ...typeForm, desc: e.target.value })}
                            className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center">3</div>
                        <div className="flex-1">
                          <Label className="font-bold text-base text-slate-900 block">Persyaratan Dokumen</Label>
                          <p className="text-xs text-slate-600 mt-0.5">Dokumen yang perlu disiapkan warga</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="type-reqs" className="text-sm font-medium text-slate-700">Daftar Persyaratan (satu per baris)</Label>
                          <Textarea
                            id="type-reqs"
                            rows={5}
                            placeholder="Fotokopi KTP Pemohon&#10;Fotokopi Kartu Keluarga (KK)&#10;Surat Pengantar RT/RW"
                            value={typeForm.requirements}
                            onChange={(e) => setTypeForm({ ...typeForm, requirements: e.target.value })}
                            className="border-slate-300 focus:border-slate-900 focus:ring-slate-900 resize-none"
                          />
                          <p className="text-xs text-slate-500">
                            Panduan dokumen yang ditampilkan ke warga saat mengajukan surat
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type-narrative" className="text-sm font-medium text-slate-700">Template Narasi (cadangan)</Label>
                          <Textarea
                            id="type-narrative"
                            rows={3}
                            placeholder="Menerangkan bahwa yang bersangkutan..."
                            value={typeForm.templateNarrative}
                            onChange={(e) => setTypeForm({ ...typeForm, templateNarrative: e.target.value })}
                            className="border-slate-300 focus:border-slate-900 focus:ring-slate-900 resize-none"
                          />
                          <p className="text-xs text-slate-500">
                            Dipakai jika template DOCX belum tersedia
                          </p>
                        </div>

                        <label htmlFor="type-active" className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 cursor-pointer text-sm font-medium hover:border-slate-300 transition-colors">
                          <input
                            id="type-active"
                            type="checkbox"
                            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            checked={typeForm.active}
                            onChange={(e) => setTypeForm({ ...typeForm, active: e.target.checked })}
                          />
                          <div className="flex-1">
                            <span className="text-slate-900 font-semibold">Aktifkan di formulir publik</span>
                            <p className="text-xs text-slate-500 mt-0.5">Surat akan tampil di pilihan warga</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center">4</div>
                        <div className="flex-1">
                          <Label className="font-bold text-base text-slate-900 block">Field Isian Warga</Label>
                          <p className="text-xs text-slate-600 mt-0.5">Otomatis terdeteksi dari baris &quot;Label :&quot; di template Word</p>
                        </div>
                      </div>
                      {typeForm.templatePlaceholders.length > 0 ? (
                        <div className="space-y-3">
                          {typeForm.customFields.length === 0 && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                              <p className="text-xs text-blue-900 font-medium">Semua field terdeteksi sebagai data bawaan</p>
                              <p className="text-xs text-blue-700 mt-1">Data seperti nama, NIK, nomor surat, dan tanggal akan diisi otomatis oleh sistem</p>
                            </div>
                          )}
                          {typeForm.customFields.map((f, idx) => (
                            <div key={f.key} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <code className="text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 break-all font-medium text-slate-700">{"{{"}{f.key}{"}}"}</code>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveCustomField(idx)} 
                                  className="w-9 h-9 shrink-0 rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors border border-transparent hover:border-red-200" 
                                  title="Hapus field"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2.5">
                                <Input 
                                  className="flex-1 h-10 text-sm bg-white border-slate-300" 
                                  value={f.label} 
                                  onChange={(e) => handleCustomFieldChange(idx, { label: e.target.value })} 
                                  placeholder="Label form" 
                                />
                                <select 
                                  className="h-10 text-sm border border-slate-300 rounded-lg bg-white px-3 sm:w-32 font-medium" 
                                  value={f.type} 
                                  onChange={(e) => handleCustomFieldChange(idx, { type: e.target.value as LetterCustomFieldDef["type"] })}
                                >
                                  <option value="text">Teks</option>
                                  <option value="number">Angka</option>
                                  <option value="date">Tanggal</option>
                                  <option value="textarea">Paragraf</option>
                                  <option value="select">Dropdown Pilihan</option>
                                </select>
                                <label className="text-sm flex items-center gap-2 text-slate-700 whitespace-nowrap px-2 font-medium">
                                  <input 
                                    type="checkbox" 
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900" 
                                    checked={f.required} 
                                    onChange={(e) => handleCustomFieldChange(idx, { required: e.target.checked })} 
                                  /> Wajib
                                </label>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddCustomField}
                            className="w-full h-10 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-[#1b365d] hover:text-[#1b365d] hover:bg-[#1b365d]/5 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="h-4 w-4" /> Tambah Field Manual
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                          <FileText className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 font-medium">Upload template DOCX di langkah 1</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm mx-auto">
                            Sistem akan otomatis mendeteksi field isian dari baris yang diakhiri titik dua (:) atau titik-titik (......) di template Word.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="lg:sticky lg:top-6">
                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <LetterSimulationPreview
                        templateBuffer={templateBuffer}
                        placeholders={typeForm.templatePlaceholders}
                        customFields={typeForm.customFields}
                        fileName={templateFileName || undefined}
                      />
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-8 px-8 py-5 bg-white/95 backdrop-blur-sm border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    {typeForm.templatePlaceholders.length > 0 ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <span className="font-medium text-slate-700">{typeForm.templatePlaceholders.length} field</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          <span className="font-medium text-slate-700">{typeForm.customFields.length} form user</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">Upload template agar field terdeteksi otomatis</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsTypeModalOpen(false)} className="h-11 px-6 border-slate-300 hover:bg-slate-50">
                      Batal
                    </Button>
                    <Button type="submit" disabled={scanningTemplate || uploadingTemplate} className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white">
                      {scanningTemplate ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memindai...
                        </>
                      ) : uploadingTemplate ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Simpan Jenis Surat
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
            </div>
          </Card>
        </div>
      )}

      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRequest(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Detail Permohonan Surat"
        >
          <div
            className="layanan-modal w-full max-w-xl bg-white rounded-2xl shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="relative bg-gradient-to-r from-[#1b365d] to-[#264478] px-6 py-6 text-white overflow-hidden shrink-0">
              <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/[0.04] -translate-y-1/2 translate-x-1/4" />
              <div className="absolute left-0 bottom-0 w-24 h-24 rounded-full bg-white/[0.04] translate-y-1/2 -translate-x-1/3" />

              <div className="relative flex justify-between items-start gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-xl font-extrabold shrink-0 border border-white/10 shadow-inner shadow-white/5">
                    {(selectedRequest.nama || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight truncate">{selectedRequest.nama}</h2>
                    <p className="text-[13px] text-white/50 mt-1 font-mono">{selectedRequest.ticketCode || selectedRequest.nik}</p>
                    <div className="mt-2.5">
                      {(() => {
                        const scMap: Record<string, { label: string; cls: string; dot: string }> = {
                          pending: { label: "Menunggu Verifikasi", cls: "bg-amber-400/20 text-amber-200 border-amber-400/25", dot: "bg-amber-400 animate-pulse" },
                          processed: { label: "Sedang Diproses", cls: "bg-sky-400/20 text-sky-200 border-sky-400/25", dot: "bg-sky-400" },
                          ready: { label: "Siap Diambil", cls: "bg-emerald-400/20 text-emerald-200 border-emerald-400/25", dot: "bg-emerald-400" },
                          completed: { label: "Selesai Diserahkan", cls: "bg-white/10 text-white/60 border-white/15", dot: "bg-white/40" },
                        };
                        const s = scMap[selectedRequest.status] || scMap.pending;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  title="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 rounded-xl bg-[#1b365d]/[0.04] border border-[#1b365d]/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-[#1b365d]/50" />
                    <span className="text-[10px] font-bold text-[#1b365d]/50 uppercase tracking-wider">Jenis Surat</span>
                  </div>
                  <p className="text-[15px] font-bold text-[#1b365d]">{selectedRequest.typeName}</p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIK</span>
                  <p className="text-[13px] font-bold text-slate-800 font-mono tracking-wide mt-1">{selectedRequest.nik}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. HP / WA</span>
                  <p className="text-[13px] font-bold text-slate-800 mt-1">{selectedRequest.phone || "-"}</p>
                </div>

                <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Pengajuan</span>
                  </div>
                  <p className="text-[13px] font-semibold text-slate-700">
                    {selectedRequest.createdAt
                      ? new Date(typeof selectedRequest.createdAt === "string" ? selectedRequest.createdAt : selectedRequest.createdAt.seconds * 1000).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Keperluan */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Keperluan Pengajuan</p>
                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80 leading-relaxed">
                  {selectedRequest.keperluan || "-"}
                </div>
              </div>

              {/* Form data */}
              {selectedRequest.formData && Object.keys(selectedRequest.formData).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Data Formulir · {Object.keys(selectedRequest.formData).length} field
                  </p>
                  <div className="rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
                    {Object.entries(selectedRequest.formData as Record<string, string>).map(([k, v]) => {
                      const def = (letterTypes.find((lt) => lt.code === selectedRequest.type)?.customFields || []).find((f) => f.key === k);
                      return (
                        <div key={k} className="flex items-baseline justify-between gap-4 px-4 py-2.5 hover:bg-slate-50/80 transition-colors">
                          <span className="text-xs text-slate-500 shrink-0">{def?.label || k}</span>
                          <span className="text-sm font-semibold text-slate-800 text-right">{String(v) || "-"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Workflow stepper ── */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Alur Pelayanan</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { key: "pending", label: "Menunggu", icon: <Hourglass className="h-4 w-4" />, color: "amber" },
                    { key: "processed", label: "Diproses", icon: <Settings className="h-4 w-4" />, color: "sky" },
                    { key: "ready", label: "Siap Ambil", icon: <PackageCheck className="h-4 w-4" />, color: "emerald" },
                    { key: "completed", label: "Selesai", icon: <CheckCircle className="h-4 w-4" />, color: "slate" },
                  ] as const).map((s) => {
                    const steps = ["pending", "processed", "ready", "completed"];
                    const currentIdx = steps.indexOf(selectedRequest.status);
                    const stepIdx = steps.indexOf(s.key);
                    const isDone = stepIdx < currentIdx;
                    const isCurrent = stepIdx === currentIdx;
                    const isFuture = stepIdx > currentIdx;
                    return (
                      <button
                        key={s.key}
                        onClick={() => handleStatusUpdate(selectedRequest.id, s.key)}
                        className={`relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all duration-300 ${
                          isCurrent
                            ? "bg-gradient-to-b from-[#1b365d] to-[#264478] text-white shadow-lg shadow-[#1b365d]/20"
                            : isDone
                            ? "bg-[#1b365d]/8 text-[#1b365d] hover:bg-[#1b365d]/12"
                            : "bg-slate-100/80 text-slate-400 hover:bg-slate-200/80 hover:text-slate-500"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isCurrent ? "bg-white/20" : isDone ? "bg-[#1b365d]/10" : "bg-slate-200/60"
                        }`}>
                          {isDone ? <CheckCircle className="h-4 w-4" /> : s.icon}
                        </div>
                        <span className="text-[10px] font-bold leading-tight text-center">{s.label}</span>
                        {isCurrent && (
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-1 bg-[#c9971c] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Progress bar */}
                <div className="mt-3 flex gap-1">
                  {["pending", "processed", "ready", "completed"].map((step, i) => {
                    const steps = ["pending", "processed", "ready", "completed"];
                    const currentIdx = steps.indexOf(selectedRequest.status);
                    return (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          i <= currentIdx ? "bg-[#1b365d]" : "bg-slate-200"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Footer actions ── */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/80 flex flex-wrap items-center gap-2.5 shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleOpenPrint(selectedRequest)} className="h-9 rounded-xl border-slate-200 hover:border-[#1b365d]/30 hover:text-[#1b365d] hover:bg-[#1b365d]/5">
                <Printer className="mr-1.5 h-4 w-4" /> Cetak Surat
              </Button>
              {selectedRequest.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-xl text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                  onClick={() => handleSendWhatsApp(selectedRequest)}
                >
                  <Send className="mr-1.5 h-4 w-4" /> WA Warga
                </Button>
              )}
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                className="h-9 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => { handleDeleteRequest(selectedRequest.id, selectedRequest.nama); }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

      {printRequest && (
        <LetterPrintEditor
          request={printRequest}
          letterTypes={letterTypes}
          printConfig={printConfig}
          onPrintConfigChange={setPrintConfig}
          onClose={() => setPrintRequest(null)}
        />
      )}
    </div>
  );
}
