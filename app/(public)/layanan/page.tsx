"use client";

/**
 * @layer Frontend (Public / Warga)
 * @role Layanan Surat Online
 * @access Public / Warga
 * @description Menyediakan formulir pengajuan surat administrasi desa online dan fitur pelacakan status permohonan.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  Search,
  AlertCircle,
  PhoneCall,
  Copy,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  FileCheck,
  History,
  MessageSquare,
  User,
  CreditCard,
  Phone,
  PenLine,
  ClipboardList,
  ChevronRight,
  Scroll,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { apiInsert } from "@/lib/api";
import { LetterType, getLetterTypes } from "@/lib/letters";
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/site-config";
import { PageBanner } from "@/components/layout/page-banner";

interface StoredTicket {
  ticketCode: string;
  letterName: string;
  nama: string;
  phone: string;
  date: string;
}
interface TrackedRequestItem {
  ticketCode: string;
  typeName: string;
  nama: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}


export default function ServicesPage() {
  const { error: showError, warning } = useToast();
  const [activeTab, setActiveTab] = useState<"apply" | "track">("apply");
  const [letterTypesList, setLetterTypesList] = useState<LetterType[]>([]);
  const [letterSearch, setLetterSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nik: "",
    nama: "",
    keperluan: "",
    phone: "",
  });
  const [customFormData, setCustomFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketCode: string;
    letterName: string;
    nama: string;
    phone: string;
    keperluan: string;
  } | null>(null);

  const [trackInput, setTrackInput] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackedRequests, setTrackedRequests] = useState<TrackedRequestItem[] | null>(null);
  const [recentTickets, setRecentTickets] = useState<StoredTicket[]>([]);
  const [copied, setCopied] = useState(false);
  const [villagePhone, setVillagePhone] = useState(DEFAULT_SITE_SETTINGS.villagePhone);

  const toWaNumber = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, "");
    return digits.startsWith("0") ? "62" + digits.slice(1) : digits;
  };

  useEffect(() => {
    getSiteSettings().then((s) => setVillagePhone(s.villagePhone)).catch(() => undefined);
  }, []);
  // Set page title
  useEffect(() => {
    document.title = "Layanan Surat | Kelurahan";
  }, []);


  useEffect(() => {
    try {
      const stored = localStorage.getItem("banjaragung_saved_tickets");
      if (stored) {
        setRecentTickets(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading saved tickets:", e);
    }
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const fromDb = await getLetterTypes();
        const activeOnly = fromDb.filter((item) => item.active !== false);
        if (activeOnly.length > 0) {
          setLetterTypesList(activeOnly);
        }
      } catch (err) {
        console.error("Error fetching letter types, using defaults:", err);
      }
    };
    fetchTypes();
  }, []);

  const filteredLetterTypes = letterTypesList.filter((l) =>
    l.name.toLowerCase().includes(letterSearch.toLowerCase()) ||
    l.desc.toLowerCase().includes(letterSearch.toLowerCase())
  );

  const activeLetterObj = letterTypesList.find(
    (l) => (l.id || l.code) === selectedLetter || l.code === selectedLetter
  );

  const saveTicketToStorage = (ticket: StoredTicket) => {
    try {
      const existing: StoredTicket[] = JSON.parse(
        localStorage.getItem("banjaragung_saved_tickets") || "[]"
      );
      const filtered = existing.filter((t) => t.ticketCode !== ticket.ticketCode);
      const updated = [ticket, ...filtered].slice(0, 5);
      localStorage.setItem("banjaragung_saved_tickets", JSON.stringify(updated));
      setRecentTickets(updated);
    } catch (e) {
      console.error("Failed to store ticket locally:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;
    const WARGA_HIDDEN_KEYS = new Set([
      "nomor_surat", "no_surat", "tanggal_surat", "tanggal",
      "nama_pejabat", "jabatan_pejabat", "nip_pejabat",
      "keperluan", "kebutuhan", "tujuan", "keterangan",
      "dipergunakan_untuk", "digunakan_untuk",
      "guna_keperluan", "untuk_keperluan", "maksud_dan_tujuan",
      "bermaksud_untuk", "dimaksudkan_untuk",
      "surat_keterangan_ini_dipergunakan_untuk",
      "surat_ini_dipergunakan_untuk", "surat_ini_digunakan_untuk",
    ]);
    const requiredMissing = (activeLetterObj?.customFields || []).filter(
      (f) => !WARGA_HIDDEN_KEYS.has(f.key.toLowerCase()) && !f.key.toLowerCase().startsWith("paragraf_") && f.required && !(customFormData[f.key] || "").trim()
    );
    if (requiredMissing.length > 0) {
      warning(`Lengkapi data wajib: ${requiredMissing.map((f) => f.label).join(", ")}`);
      return;
    }
    if (!/^\d{16}$/.test(formData.nik)) {
      warning("NIK harus 16 digit angka");
      return;
    }
    setLoading(true);

    try {
      const randomSuffix = crypto.randomUUID().slice(0, 8).toUpperCase();
      const ticketCode = `SRT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${randomSuffix}`;
      const letterObj = activeLetterObj;
      const letterName = letterObj?.name || "Surat Keterangan";

      await apiInsert("requests", {
        nik: formData.nik,
        nama: formData.nama,
        phone: formData.phone,
        keperluan: formData.keperluan,
        form_data: customFormData,
        ticket_code: ticketCode,
        type: letterObj?.code || selectedLetter,
        type_name: letterName,
        template_narrative: letterObj?.templateNarrative || "",
        status: "pending",
        admin_notes: "",
      });

      const submittedData = {
        ticketCode,
        letterName,
        nama: formData.nama,
        phone: formData.phone,
        keperluan: formData.keperluan,
      };

      setSubmittedTicket(submittedData);

      // Simpan ke memori HP warga agar tidak hilang
      saveTicketToStorage({
        ticketCode,
        letterName,
        nama: formData.nama,
        phone: formData.phone,
        date: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      });

      setFormData({ nik: "", nama: "", keperluan: "", phone: "" });
      setCustomFormData({});
      setSelectedLetter(null);
    } catch (error) {
      console.error("Error submitting request:", error);
      showError("Gagal mengirim permohonan surat. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSearch = async (queryParam?: string) => {
    const rawSearch = (queryParam || trackInput).trim();
    if (!rawSearch) return;

    setTrackLoading(true);
    try {
      const res = await fetch(`/api/track/requests?q=${encodeURIComponent(rawSearch)}`);
      const body: Record<string, unknown> = await res.json().catch(() => ({}));
      const rows = (Array.isArray(body.data) ? body.data : []) as Record<string, unknown>[];
      const results: TrackedRequestItem[] = rows.map((row) => ({
        ticketCode: String(row.ticket_code || ""),
        typeName: String(row.type_name || ""),
        nama: String(row.nama || ""),
        status: String(row.status || ""),
        adminNotes: row.admin_notes as string | undefined,
        createdAt: String(row.created_at || ""),
      }));
      setTrackedRequests(results);
    } catch (err) {
      console.error("Error tracking request:", err);
      showError("Gagal memuat status surat. Coba beberapa saat lagi.");
    } finally {
      setTrackLoading(false);
    }
  };

  const handleCopyTicket = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateWhatsAppUrl = (ticket: {
    ticketCode: string;
    letterName: string;
    nama: string;
    keperluan?: string;
  }) => {
    const text = encodeURIComponent(
      `*BUKTI PERMOHONAN SURAT - KELURAHAN BANJAR AGUNG*\n\n` +
      `Halo Petugas Pelayanan Kelurahan Banjar Agung,\n` +
      `Saya telah mengajukan surat administrasi online dengan rincian berikut:\n\n` +
      `• *Nomor Tiket:* ${ticket.ticketCode}\n` +
      `• *Nama Pemohon:* ${ticket.nama}\n` +
      `• *Jenis Surat:* ${ticket.letterName}\n` +
      (ticket.keperluan ? `• *Keperluan:* ${ticket.keperluan}\n` : "") +
      `• *Tanggal:* ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
      `Mohon informasinya jika dokumen saya sudah selesai diverifikasi dan siap diambil di loket kelurahan. Terima kasih.`
    );
    return `https://wa.me/${toWaNumber(villagePhone)}?text=${text}`;
  };

  return (
    <div className="space-y-10 pb-16">
      <PageBanner pageKey="layanan">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("apply")}
            className={`px-6 py-3 rounded-lg text-sm inline-flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              activeTab === "apply"
                ? "bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold shadow-amber-500/20"
                : "border border-slate-700 hover:border-slate-500 bg-[#0F2236]/90 hover:bg-[#142d47] text-white font-medium"
            }`}
          >
            <span>Buat Surat Mandiri</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("track")}
            className={`px-6 py-3 rounded-lg text-sm transition-all cursor-pointer backdrop-blur-sm ${
              activeTab === "track"
                ? "bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "border border-slate-700 hover:border-slate-500 bg-[#0F2236]/90 hover:bg-[#142d47] text-white font-medium"
            }`}
          >
            Lacak Permohonan
          </button>
        </div>
      </PageBanner>

      <div className="container mx-auto px-6 md:px-12 space-y-10">

      <section id="alur" className="scroll-mt-24">
        <div className="rounded-2xl bg-gradient-to-br from-[#1b365d]/5 to-blue-50 border border-[#1b365d]/10 p-6 md:p-8 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#1b365d]">Alur Permohonan Surat Keterangan</h2>
            <p className="text-sm text-slate-600">Prosedur dan tahapan permohonan surat administrasi kependudukan secara daring maupun melalui loket pelayanan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                title: "Pilih Jenis Surat",
                desc: "Pilih jenis surat keterangan yang dibutuhkan serta persiapkan dokumen persyaratan yang ditentukan.",
                color: "bg-[#1b365d]",
              },
              {
                step: "2",
                title: "Isi Formulir Permohonan",
                desc: "Lengkapi data pemohon dan keperluan pada formulir pengajuan sesuai dokumen kependudukan yang sah.",
                color: "bg-blue-600",
              },
              {
                step: "3",
                title: "Simpan Nomor Tiket",
                desc: "Catat nomor tiket registrasi yang diterbitkan untuk memantau proses verifikasi berkas oleh petugas.",
                color: "bg-amber-600",
              },
              {
                step: "4",
                title: "Pengambilan Dokumen",
                desc: "Setelah diverifikasi (1-2 hari kerja), ambil dokumen fisik di loket pelayanan kelurahan dengan membawa berkas asli.",
                color: "bg-emerald-600",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-full ${item.color} text-white font-extrabold text-base flex items-center justify-center shrink-0`}>
                  {item.step}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("apply")}
              className="inline-flex items-center gap-2 bg-[#1b365d] hover:bg-[#152a48] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Ajukan Permohonan Surat <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs text-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#1b365d] flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Jam Pelayanan Loket</div>
            <div className="font-bold text-slate-800 text-xs md:text-sm">Senin - Jumat (08:00 - 15:30)</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Biaya Administrasi</div>
            <div className="font-bold text-emerald-700 text-xs md:text-sm">Rp 0,- (100% GRATIS)</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1b365d] flex items-center justify-center shrink-0 border border-blue-100">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Standar Waktu Proses</div>
            <div className="font-bold text-[#1b365d] text-xs md:text-sm">1 - 2 Hari Kerja Selesai</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">WhatsApp Layanan</div>
            <div className="font-bold text-amber-800 text-xs md:text-sm">{villagePhone}</div>
          </div>
        </div>
      </div>

      {/* Jaring pengaman: success box dengan simpan otomatis ke WhatsApp */}
      {submittedTicket && (
        <div className="max-w-2xl mx-auto bg-emerald-50/80 border border-emerald-300 rounded-2xl p-6 text-emerald-950 text-center space-y-4 shadow-sm animate-in fade-in">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-900">Permohonan Surat Berhasil Terkirim!</h2>
            <p className="text-xs sm:text-sm text-emerald-800 mt-1">
              Dokumen <strong>{submittedTicket.letterName}</strong> atas nama <strong>{submittedTicket.nama}</strong> telah masuk ke antrean verifikasi loket kelurahan.
            </p>
          </div>

          <div className="bg-white border border-emerald-300 rounded-xl p-3 inline-flex flex-wrap items-center justify-center gap-3 shadow-2xs">
            <span className="text-xs font-semibold text-slate-600">NOMOR TIKET PELACAKAN:</span>
            <span className="font-mono text-lg font-bold text-[#1b365d] tracking-wider">
              {submittedTicket.ticketCode}
            </span>
            <button
              onClick={() => handleCopyTicket(submittedTicket.ticketCode)}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200"
              title="Salin Kode"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? "Tersalin!" : "Salin"}</span>
            </button>
          </div>

          <div className="bg-emerald-100/60 border border-emerald-300/80 rounded-xl p-3 text-xs text-emerald-950 text-left space-y-1 max-w-lg mx-auto">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-950">
              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              Standar Waktu Verifikasi &amp; Cetak Berkas:
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Permohonan diproses dalam <strong>1–2 hari kerja (Senin–Jumat, 08:00–15:30)</strong>. Anda dapat memantau status secara berkala melalui menu <strong>Lacak Permohonan</strong> atau konfirmasi melalui WhatsApp loket kelurahan.
            </p>
          </div>

          <div className="pt-2 space-y-2 max-w-md mx-auto">
            <a
              href={generateWhatsAppUrl(submittedTicket)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <MessageSquare className="h-5 w-5 shrink-0" />
              <span>Simpan Bukti ke WhatsApp Saya</span>
            </a>
            <p className="text-[11px] text-emerald-700 leading-tight">
              💡 <em>Tidak perlu menghafal kode! Klik tombol hijau di atas untuk menyimpan rincian tiket ini langsung di chat WhatsApp Anda.</em>
            </p>
          </div>

          <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-center gap-4 text-xs">
            <button
              onClick={() => {
                setTrackInput(submittedTicket.ticketCode);
                setActiveTab("track");
                handleTrackSearch(submittedTicket.ticketCode);
                setSubmittedTicket(null);
              }}
              className="font-semibold text-[#1b365d] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Langsung Cek Status Surat di Tab Pelacakan <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {activeTab === "apply" ? (
        <div className="grid md:grid-cols-12 gap-6">
          {/* ===== PANEL KIRI: Pilih Jenis Surat ===== */}
          <div className="md:col-span-5 space-y-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
              {/* Header Panel */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                      <Scroll className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-[13px] font-bold text-slate-800">Pilih Jenis Surat</h2>
                      <p className="text-[10px] text-slate-400">{filteredLetterTypes.length} jenis tersedia</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari jenis surat..."
                    value={letterSearch}
                    onChange={(e) => setLetterSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Letter List */}
              <div className="max-h-[520px] overflow-y-auto">
                <div className="p-2.5 space-y-2">
                  {filteredLetterTypes.map((letter) => {
                    const letterKey = letter.id || letter.code;
                    const isSelected = selectedLetter === letterKey || selectedLetter === letter.code;
                    const noneSelected = !selectedLetter;
                    return (
                      <button
                        type="button"
                        key={letterKey}
                        onClick={() => { setSelectedLetter(letterKey); setCustomFormData({}); }}
                        className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer group border ${
                          isSelected
                            ? "bg-[#1b365d] text-white shadow-md shadow-[#1b365d]/20 border-[#1b365d]"
                            : noneSelected
                              ? "border-slate-200/80 bg-white hover:border-[#1b365d]/30 hover:bg-[#1b365d]/[0.02] hover:shadow-sm"
                              : "border-transparent hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? "bg-white/20"
                              : noneSelected
                                ? "bg-gradient-to-br from-[#1b365d]/[0.08] to-[#1b365d]/[0.03] group-hover:from-[#1b365d]/[0.12] group-hover:to-[#1b365d]/[0.06]"
                                : "bg-[#1b365d]/[0.06] group-hover:bg-[#1b365d]/10"
                          }`}>
                            <FileText className={`h-4 w-4 transition-colors ${isSelected ? "text-white" : "text-[#1b365d]"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-[12px] leading-tight truncate ${
                              isSelected ? "text-white" : "text-slate-800"
                            }`}>
                              {letter.name}
                            </h3>
                            <p className={`text-[10px] mt-0.5 line-clamp-1 ${
                              isSelected ? "text-white/70" : "text-slate-400"
                            }`}>
                              {letter.desc}
                            </p>
                          </div>
                          <ChevronRight className={`h-4 w-4 shrink-0 transition-all ${
                            isSelected
                              ? "text-white/60 translate-x-0"
                              : noneSelected
                                ? "text-slate-300 group-hover:text-[#1b365d]/40 group-hover:translate-x-0.5"
                                : "text-slate-300 -translate-x-1 group-hover:translate-x-0 group-hover:text-slate-400"
                          }`} />
                        </div>
                        {isSelected && Array.isArray(letter.requirements) && letter.requirements.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-1.5 text-[10px] text-white/80 font-medium">
                            <ClipboardList className="h-3 w-3" /> {letter.requirements.length} dokumen syarat pengambilan
                          </div>
                        )}
                        {!isSelected && noneSelected && Array.isArray(letter.requirements) && letter.requirements.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                            <ClipboardList className="h-3 w-3" /> {letter.requirements.length} dokumen syarat
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {filteredLetterTypes.length === 0 && (
                    <div className="text-center py-10 px-4 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                        <Search className="h-4 w-4 text-slate-300" />
                      </div>
                      <p className="text-[11px] text-slate-400">Tidak ditemukan jenis surat</p>
                      <button
                        type="button"
                        onClick={() => setLetterSearch("")}
                        className="text-[10px] text-[#1b365d] font-bold hover:underline cursor-pointer"
                      >
                        Reset pencarian
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm sticky top-6">
              {/* Form Header */}
              <div className="relative overflow-hidden">
                <div className="bg-gradient-to-r from-[#1b365d] via-[#1f3d6a] to-[#264478] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                      {activeLetterObj
                        ? <FileCheck className="h-5 w-5 text-white" />
                        : <PenLine className="h-5 w-5 text-white/40" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-white leading-tight truncate">
                        {activeLetterObj ? activeLetterObj.name : "Formulir Permohonan"}
                      </h3>
                      <p className="text-[11px] text-slate-300/90 mt-0.5 line-clamp-1">
                        {activeLetterObj ? activeLetterObj.desc : "Pilih jenis surat di panel kiri"}
                      </p>
                    </div>
                    {activeLetterObj && (
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-[10px] text-white/80 font-bold shrink-0 border border-white/10">
                        <Clock className="h-3 w-3" /> 1-2 Hari Kerja
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5">
                {activeLetterObj ? (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Syarat Berkas */}
                    {Array.isArray(activeLetterObj.requirements) && activeLetterObj.requirements.length > 0 && (
                      <div className="rounded-xl overflow-hidden border border-amber-200/60">
                        <div className="bg-amber-50 px-4 py-2.5 flex items-center gap-2 border-b border-amber-200/60">
                          <ClipboardList className="h-3.5 w-3.5 text-amber-700" />
                          <span className="text-[11px] font-bold text-amber-800">Syarat Berkas Pengambilan</span>
                        </div>
                        <div className="p-3 bg-amber-50/30 space-y-1.5">
                          {activeLetterObj.requirements.map((req, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 text-[11px] text-amber-900/80">
                              <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-bold text-amber-700">{idx + 1}</span>
                              </div>
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Identitas Pemohon */}
                    <fieldset className="space-y-3.5">
                      <legend className="text-[10px] font-bold uppercase tracking-widest text-[#1b365d]/70 flex items-center gap-2 pb-1.5 border-b border-slate-100 w-full">
                        <User className="h-3.5 w-3.5" /> Identitas Pemohon
                      </legend>

                      <div className="space-y-1.5">
                        <label htmlFor="nik" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                          <CreditCard className="h-3 w-3 text-slate-400" />
                          NIK <span className="text-[10px] text-slate-400 font-normal">(16 Digit)</span> <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="nik"
                          type="text"
                          required
                          maxLength={16}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] focus:bg-white transition-all"
                          placeholder="367305xxxxxxxxxx"
                          value={formData.nik}
                          onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, "") })}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label htmlFor="nama" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                            <User className="h-3 w-3 text-slate-400" />
                            Nama Lengkap <span className="text-red-400">*</span>
                          </label>
                          <input
                            id="nama"
                            type="text"
                            required
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] focus:bg-white transition-all"
                            placeholder="Sesuai KTP"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="phone" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            No. WhatsApp <span className="text-red-400">*</span>
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            required
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] focus:bg-white transition-all"
                            placeholder="0813xxxxxxxx"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </fieldset>

                    {/* Keperluan */}
                    <fieldset className="space-y-3">
                      <legend className="text-[10px] font-bold uppercase tracking-widest text-[#1b365d]/70 flex items-center gap-2 pb-1.5 border-b border-slate-100 w-full">
                        <PenLine className="h-3.5 w-3.5" /> Keperluan
                      </legend>
                      <div className="space-y-1.5">
                        <label htmlFor="keperluan" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-slate-400" />
                          Alasan / keperluan surat <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          id="keperluan"
                          required
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] focus:bg-white transition-all resize-none"
                          placeholder="Misal: syarat pendaftaran beasiswa, izin usaha warung..."
                          value={formData.keperluan}
                          onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                        />
                      </div>
                    </fieldset>

                    {/* Custom Fields */}
                    {activeLetterObj?.customFields && activeLetterObj.customFields.length > 0 && (() => {
                      const WARGA_HIDDEN = new Set([
                        "nomor_surat", "no_surat", "tanggal_surat", "tanggal",
                        "nama_pejabat", "jabatan_pejabat", "nip_pejabat",
                        "keperluan", "kebutuhan", "tujuan", "keterangan",
                        "dipergunakan_untuk", "digunakan_untuk",
                        "guna_keperluan", "untuk_keperluan", "maksud_dan_tujuan",
                        "bermaksud_untuk", "dimaksudkan_untuk",
                        "surat_keterangan_ini_dipergunakan_untuk",
                        "surat_ini_dipergunakan_untuk", "surat_ini_digunakan_untuk",
                      ]);
                      const visibleFields = activeLetterObj.customFields.filter(
                        (f) => !WARGA_HIDDEN.has(f.key.toLowerCase()) && !f.key.toLowerCase().startsWith("paragraf_")
                      );
                      return visibleFields.length > 0 ? (
                      <fieldset className="space-y-3">
                        <legend className="text-[10px] font-bold uppercase tracking-widest text-[#1b365d]/70 flex items-center gap-2 pb-1.5 border-b border-slate-100 w-full">
                          <ClipboardList className="h-3.5 w-3.5" /> Data Tambahan
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {visibleFields.map((f) => (
                            <div key={f.key} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                              <label htmlFor={`custom-${f.key}`} className="text-[11px] font-semibold text-slate-600">
                                {f.label} {f.required && <span className="text-red-400">*</span>}
                              </label>
                              {f.type === "select" && f.options && f.options.length > 0 ? (
                                <select
                                  id={`custom-${f.key}`}
                                  required={f.required}
                                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] focus:bg-white transition-colors"
                                  value={customFormData[f.key] || ""}
                                  onChange={(e) => setCustomFormData({ ...customFormData, [f.key]: e.target.value })}
                                >
                                  <option value="">Pilih {f.label.toLowerCase()}...</option>
                                  {f.options.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : f.type === "textarea" ? (
                                <textarea
                                  id={`custom-${f.key}`}
                                  required={f.required}
                                  rows={3}
                                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] focus:bg-white transition-colors"
                                  placeholder={`Isi ${f.label.toLowerCase()}...`}
                                  value={customFormData[f.key] || ""}
                                  onChange={(e) => setCustomFormData({ ...customFormData, [f.key]: e.target.value })}
                                />
                              ) : (
                                <input
                                  id={`custom-${f.key}`}
                                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                                  required={f.required}
                                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] focus:bg-white transition-colors"
                                  placeholder={`Isi ${f.label.toLowerCase()}...`}
                                  value={customFormData[f.key] || ""}
                                  onChange={(e) => setCustomFormData({ ...customFormData, [f.key]: e.target.value })}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </fieldset>
                    ) : null; })()}

                    {/* Ketentuan */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#1b365d]/[0.03] border border-[#1b365d]/[0.08]">
                      <Info className="h-4 w-4 text-[#1b365d]/50 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        Pengambilan dokumen di <strong className="text-slate-600">loket kelurahan pada jam kerja</strong>. Bawa KTP asli dan KK asli.
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#1b365d] to-[#264478] hover:from-[#152a48] hover:to-[#1b365d] text-white font-bold rounded-xl shadow-md shadow-[#1b365d]/15 h-12 text-sm cursor-pointer transition-all"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Mengirim Permohonan...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" /> Kirim Permohonan Surat
                        </span>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                    {/* Illustration */}
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1b365d]/[0.06] to-[#1b365d]/[0.02] flex items-center justify-center">
                        <Scroll className="h-10 w-10 text-[#1b365d]/20" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/60 flex items-center justify-center shadow-sm animate-bounce" style={{ animationDuration: "2s" }}>
                        <PenLine className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/60 flex items-center justify-center shadow-sm">
                        <FileCheck className="h-3 w-3 text-blue-500" />
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-800 text-[15px]">Mulai Permohonan Surat</h3>
                    <p className="text-[12px] text-slate-400 mt-2 max-w-[240px] leading-relaxed">
                      Pilih jenis surat yang dibutuhkan di panel sebelah kiri, lalu isi formulir permohonan.
                    </p>

                    {/* Steps hint */}
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1b365d]/[0.04] border border-[#1b365d]/[0.08]">
                        <div className="w-5 h-5 rounded-md bg-[#1b365d] text-white text-[10px] font-bold flex items-center justify-center">1</div>
                        <span className="text-[10px] font-semibold text-slate-500">Pilih Surat</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-400 text-[10px] font-bold flex items-center justify-center">2</div>
                        <span className="text-[10px] font-semibold text-slate-400">Isi Data</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-400 text-[10px] font-bold flex items-center justify-center">3</div>
                        <span className="text-[10px] font-semibold text-slate-400">Kirim</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-[#1b365d]" /> Lacak Status Surat Mandiri
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Warga dapat melacak status surat menggunakan <strong>Nomor Tiket</strong>, <strong>Nomor WhatsApp</strong>, atau <strong>16-Digit NIK</strong> pemohon.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTrackSearch();
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ketik Kode Tiket, Nomor WhatsApp, atau NIK..."
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b365d] focus:border-[#1b365d]"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={trackLoading}
                  className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold rounded-lg h-11 shrink-0"
                >
                  {trackLoading ? "Mencari Berkas..." : "Cari Status Surat"}
                </Button>
              </form>

              {/* Jaring pengaman: warga lupa tiket cukup pakai WA/NIK */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-[#1b365d] flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#1b365d]" />
                <div>
                  <span className="font-bold">Lupa Nomor Kode Tiket?</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Tidak perlu cemas. Cukup masukkan <strong>Nomor WhatsApp</strong> atau <strong>NIK</strong> yang didaftarkan saat mengajukan surat, sistem kelurahan akan otomatis menampilkan riwayat permohonan Anda.
                  </p>
                </div>
              </div>

              {/* Jaring pengaman: tiket terakhir tersimpan di perangkat ini */}
              {recentTickets.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                    <History className="h-3.5 w-3.5 text-slate-500" />
                    <span>Permohonan Terakhir di Perangkat HP Ini:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentTickets.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTrackInput(t.ticketCode);
                          handleTrackSearch(t.ticketCode);
                        }}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 text-left transition-colors flex items-center gap-1.5"
                      >
                        <span className="font-mono font-bold text-[#1b365d]">{t.ticketCode}</span>
                        <span className="text-slate-500">({t.letterName})</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {trackedRequests !== null && (
            <div className="space-y-4">
              {trackedRequests.length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-200 rounded-xl text-slate-500 space-y-3">
                  <FileText className="h-10 w-10 mx-auto text-slate-300" />
                  <div>
                    <p className="font-bold text-slate-800">Tidak Ditemukan Berkas Permohonan</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Pastikan nomor tiket, nomor WhatsApp, atau NIK yang Anda masukkan sudah sesuai.
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/${toWaNumber(villagePhone)}?text=Halo%20Admin%20Kelurahan%20Banjar%20Agung,%20saya%20ingin%20menanyakan%20status%20surat%20saya`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#1b365d] font-semibold bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <PhoneCall className="h-3.5 w-3.5" /> Butuh Bantuan? Tanya Loket via WhatsApp ({villagePhone})
                    </a>
                  </div>
                </div>
              ) : (
                trackedRequests.map((item) => {
                  const statusSteps = [
                    { id: "pending", label: "Menunggu" },
                    { id: "processed", label: "Diproses" },
                    { id: "ready", label: "Siap Diambil" },
                    { id: "completed", label: "Selesai" },
                  ];
                  const stepIndexMap = { pending: 0, processed: 1, ready: 2, completed: 3 };
                  const currentIdx = stepIndexMap[item.status as keyof typeof stepIndexMap] ?? 0;

                  return (
                    <Card key={item.ticketCode} className="overflow-hidden border-slate-200 shadow-2xs">
                      <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold bg-white border border-slate-300 px-2 py-0.5 rounded text-[#1b365d]">
                            {item.ticketCode || "Tiket Pelayanan"}
                          </span>
                          <span className="text-xs text-slate-600">
                            Pemohon: <strong>{item.nama}</strong>
                          </span>
                        </div>
                        <div
                          className={`self-start sm:self-auto px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            item.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "ready"
                              ? "bg-emerald-600 text-white"
                              : item.status === "processed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.status === "completed"
                            ? "Selesai Diterbitkan"
                            : item.status === "ready"
                            ? "Siap Diambil di Loket"
                            : item.status === "processed"
                            ? "Sedang Diverifikasi Petugas"
                            : "Menunggu Antrean Verifikasi"}
                        </div>
                      </CardHeader>

                      <CardContent className="p-5 space-y-5">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#1b365d]" /> {item.typeName}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Diajukan: <span className="text-slate-800 font-medium">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</span>
                          </p>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                          <p className="text-xs font-bold text-slate-700 mb-4">Progres Pelayanan Administrasi:</p>
                          <div className="relative flex items-center justify-between w-full">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0"></div>
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#1b365d] -z-0 transition-all duration-300"
                              style={{ width: `${(currentIdx / 3) * 100}%` }}
                            ></div>

                            {statusSteps.map((step, idx) => {
                              const isCompleted = currentIdx >= idx;
                              const isCurrent = currentIdx === idx;
                              return (
                                <div key={step.id} className="flex flex-col items-center bg-slate-50 px-1 z-10">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                                      isCompleted
                                        ? "bg-[#1b365d] border-[#1b365d] text-white"
                                        : "bg-white border-slate-300 text-slate-400"
                                    }`}
                                  >
                                    {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                                  </div>
                                  <span
                                    className={`text-[11px] mt-1 font-medium ${
                                      isCurrent ? "text-[#1b365d] font-bold" : "text-slate-500"
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {item.status === "ready" && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-950 text-xs sm:text-sm flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <p className="font-bold text-emerald-900">Dokumen Sudah Siap Diambil!</p>
                              <p className="text-xs text-emerald-800 leading-relaxed">
                                Surat Anda telah selesai ditandatangani dan siap diambil di loket Kantor Kelurahan Banjar Agung pada jam operasional (Senin - Jumat 08:00 - 15:30 WIB). Harap membawa KTP asli dan fotokopi Kartu Keluarga sebagai verifikasi fisik.
                              </p>
                            </div>
                          </div>
                        )}

                        {item.adminNotes && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                            <span className="font-bold flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-700" /> Catatan dari Petugas Loket:
                            </span>
                            <p className="text-slate-700 pl-5">{item.adminNotes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
}
