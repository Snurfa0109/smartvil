"use client";

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
  CheckSquare,
  HelpCircle,
  FileCheck,
  History,
  MessageSquare,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_LETTER_TYPES, LetterType } from "@/lib/letters";

interface StoredTicket {
  ticketCode: string;
  letterName: string;
  nama: string;
  phone: string;
  date: string;
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<"apply" | "track">("apply");
  const [letterTypesList, setLetterTypesList] = useState<LetterType[]>(DEFAULT_LETTER_TYPES);
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
  const [trackedRequests, setTrackedRequests] = useState<any[] | null>(null);
  const [recentTickets, setRecentTickets] = useState<StoredTicket[]>([]);
  const [copied, setCopied] = useState(false);

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
        const snap = await getDocs(collection(db, "letter_types"));
        if (!snap.empty) {
          const fromDb: LetterType[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          const activeOnly = fromDb.filter((item) => item.active !== false);
          if (activeOnly.length > 0) {
            setLetterTypesList(activeOnly);
          }
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
    const requiredMissing = (activeLetterObj?.customFields || []).filter(
      (f) => f.required && !(customFormData[f.key] || "").trim()
    );
    if (requiredMissing.length > 0) {
      alert(`Lengkapi data wajib: ${requiredMissing.map((f) => f.label).join(", ")}`);
      return;
    }
    setLoading(true);

    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `SRT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${randomSuffix}`;
      const letterObj = activeLetterObj;
      const letterName = letterObj?.name || "Surat Keterangan";

      await addDoc(collection(db, "requests"), {
        ...formData,
        formData: customFormData,
        ticketCode,
        type: letterObj?.code || selectedLetter,
        typeName: letterName,
        templateNarrative: letterObj?.templateNarrative || "",
        requirements: letterObj?.requirements || [],
        createdAt: serverTimestamp(),
        status: "pending",
        adminNotes: "",
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
      alert("Gagal mengirim permohonan surat. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSearch = async (queryParam?: string) => {
    const rawSearch = (queryParam || trackInput).trim();
    if (!rawSearch) return;

    setTrackLoading(true);
    try {
      let results: any[] = [];
      const isDigitsOnly = /^\d+$/.test(rawSearch.replace(/\D/g, ""));
      const cleanedDigits = rawSearch.replace(/\D/g, "");

      const qByCode = query(collection(db, "requests"), where("ticketCode", "==", rawSearch));
      const snapCode = await getDocs(qByCode);
      snapCode.docs.forEach((d) => results.push({ id: d.id, ...d.data() }));

      if (isDigitsOnly && cleanedDigits.length >= 15) {
        const qByNik = query(collection(db, "requests"), where("nik", "==", cleanedDigits));
        const snapNik = await getDocs(qByNik);
        snapNik.docs.forEach((d) => {
          if (!results.some((r) => r.id === d.id)) {
            results.push({ id: d.id, ...d.data() });
          }
        });
      }

      if (isDigitsOnly && cleanedDigits.length >= 8 && cleanedDigits.length <= 14) {
        // Coba variasi 08xx dan 628xx
        let phoneVariations = [cleanedDigits];
        if (cleanedDigits.startsWith("0")) {
          phoneVariations.push("62" + cleanedDigits.substring(1));
          phoneVariations.push("+62" + cleanedDigits.substring(1));
        } else if (cleanedDigits.startsWith("62")) {
          phoneVariations.push("0" + cleanedDigits.substring(2));
        }

        for (const phoneVal of phoneVariations) {
          const qByPhone = query(collection(db, "requests"), where("phone", "==", phoneVal));
          const snapPhone = await getDocs(qByPhone);
          snapPhone.docs.forEach((d) => {
            if (!results.some((r) => r.id === d.id)) {
              results.push({ id: d.id, ...d.data() });
            }
          });
        }
      }

      setTrackedRequests(results);
    } catch (err) {
      console.error("Error tracking request:", err);
      alert("Gagal memuat status surat. Coba beberapa saat lagi.");
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
    // WhatsApp Resmi Kelurahan Banjar Agung: 0813-1505-3901
    return `https://wa.me/6281315053901?text=${text}`;
  };

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#1b365d]/10 text-[#1b365d] border border-[#1b365d]/20">
          <FileCheck className="h-3.5 w-3.5" /> Pelayanan Administrasi Terpadu Kelurahan (PATEN)
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Layanan Administrasi Surat Kelurahan
        </h1>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          Pengajuan surat pengantar dan keterangan resmi Kelurahan Banjar Agung, Kecamatan Cipocok Jaya, Kota Serang. Cepat, transparan, dan 100% bebas biaya retribusi (Gratis).
        </p>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 mt-4 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("apply")}
            className={`px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "apply"
                ? "bg-white text-[#1b365d] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Buat Permohonan Surat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("track")}
            className={`px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "track"
                ? "bg-white text-[#1b365d] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Lacak Status Permohonan
          </button>
        </div>
      </div>

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
            <div className="font-bold text-amber-800 text-xs md:text-sm">0813-1505-3901</div>
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
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-xs flex items-center justify-center font-bold">1</span>
                Pilih Jenis Surat
              </h2>
              <span className="text-xs text-slate-500">{filteredLetterTypes.length} Jenis Tersedia</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari surat (misal: domisili, usaha, sktm)..."
                value={letterSearch}
                onChange={(e) => setLetterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b365d] focus:border-[#1b365d]"
              />
            </div>

            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredLetterTypes.map((letter) => {
                const letterKey = letter.id || letter.code;
                const isSelected = selectedLetter === letterKey || selectedLetter === letter.code;
                return (
                  <div
                    key={letterKey}
                    onClick={() => { setSelectedLetter(letterKey); setCustomFormData({}); }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#1b365d] bg-blue-50/50 ring-1 ring-[#1b365d] shadow-2xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${isSelected ? "bg-[#1b365d] text-white" : "bg-slate-100 text-[#1b365d]"}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-sm ${isSelected ? "text-[#1b365d]" : "text-slate-900"}`}>
                          {letter.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{letter.desc}</p>
                        {Array.isArray(letter.requirements) && letter.requirements.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#1b365d] font-semibold">
                            <CheckSquare className="h-3 w-3" /> {letter.requirements.length} Dokumen Syarat
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredLetterTypes.length === 0 && (
                <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-200 p-4 text-xs">
                  Tidak ditemukan jenis surat dengan kata kunci tersebut.
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <Card className="border-slate-200 shadow-2xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-xs flex items-center justify-center font-bold">2</span>
                  {activeLetterObj ? activeLetterObj.name : "Formulir Permohonan Surat"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {activeLetterObj ? activeLetterObj.desc : "Silakan pilih salah satu jenis surat di sebelah kiri."}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-5">
                {activeLetterObj ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {Array.isArray(activeLetterObj.requirements) && activeLetterObj.requirements.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5 text-[#1b365d]" /> Syarat Berkas yang Wajib Dibawa saat Pengambilan:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                          {activeLetterObj.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="nik" className="text-xs font-semibold text-slate-700">
                        NIK (Nomor Induk Kependudukan - 16 Digit) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="nik"
                        type="text"
                        required
                        maxLength={16}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1b365d] focus:border-[#1b365d]"
                        placeholder="Contoh: 367305xxxxxxxxxx"
                        value={formData.nik}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, "") })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="nama" className="text-xs font-semibold text-slate-700">
                        Nama Lengkap (Sesuai KTP) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="nama"
                        type="text"
                        required
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1b365d] focus:border-[#1b365d]"
                        placeholder="Nama lengkap pemohon sesuai KTP"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                        Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1b365d] focus:border-[#1b365d]"
                        placeholder="Contoh: 0813xxxxxxxx (untuk kemudahan pelacakan & notifikasi)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="keperluan" className="text-xs font-semibold text-slate-700">
                        Keperluan Pembuatan Surat <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="keperluan"
                        required
                        rows={3}
                        className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1b365d] focus:border-[#1b365d]"
                        placeholder="Jelaskan keperluan pembuatan surat secara jelas (misal: syarat pendaftaran beasiswa, izin usaha warung sembako BAP)..."
                        value={formData.keperluan}
                        onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                      />
                    </div>

                    {activeLetterObj?.customFields && activeLetterObj.customFields.length > 0 && (
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-xs font-bold text-slate-800">Data tambahan sesuai template surat ini:</p>
                        {activeLetterObj.customFields.map((f) => (
                          <div key={f.key} className="space-y-1.5">
                            <label htmlFor={`custom-${f.key}`} className="text-xs font-semibold text-slate-700">
                              {f.label} {f.required && <span className="text-red-500">*</span>}
                            </label>
                            {f.type === "textarea" ? (
                              <textarea
                                id={`custom-${f.key}`}
                                required={f.required}
                                rows={3}
                                className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                placeholder={`Isi ${f.label.toLowerCase()}...`}
                                value={customFormData[f.key] || ""}
                                onChange={(e) => setCustomFormData({ ...customFormData, [f.key]: e.target.value })}
                              />
                            ) : (
                              <input
                                id={`custom-${f.key}`}
                                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                                required={f.required}
                                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                placeholder={`Isi ${f.label.toLowerCase()}...`}
                                value={customFormData[f.key] || ""}
                                onChange={(e) => setCustomFormData({ ...customFormData, [f.key]: e.target.value })}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-xs text-slate-600 space-y-1">
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-[#1b365d]" /> Ketentuan Pengambilan Berkas:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        <li>Pengambilan dokumen dilakukan di loket kelurahan pada jam kerja resmi.</li>
                        <li>Harap membawa KTP asli dan Kartu Keluarga asli saat pengambilan fisik surat.</li>
                      </ul>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={loading}
                        className="w-full sm:w-auto bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold rounded-lg"
                      >
                        {loading ? "Mengirim Permohonan..." : (
                          <>
                            <Send className="mr-2 h-4 w-4" /> Kirim Permohonan Surat Sekarang
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-[#1b365d] flex items-center justify-center">
                      <FileText size={28} />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">Pilih Jenis Surat Terlebih Dahulu</p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Silakan klik salah satu jenis surat di panel kiri untuk membuka formulir permohonan resmi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      href="https://wa.me/6281315053901?text=Halo%20Admin%20Kelurahan%20Banjar%20Agung,%20saya%20ingin%20menanyakan%20status%20surat%20saya"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#1b365d] font-semibold bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <PhoneCall className="h-3.5 w-3.5" /> Butuh Bantuan? Tanya Loket via WhatsApp (0813-1505-3901)
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
                    <Card key={item.id} className="overflow-hidden border-slate-200 shadow-2xs">
                      <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold bg-white border border-slate-300 px-2 py-0.5 rounded text-[#1b365d]">
                            {item.ticketCode || "Tiket Pelayanan"}
                          </span>
                          <span className="text-xs text-slate-600">
                            Pemohon: <strong>{item.nama}</strong> ({item.nik ? item.nik.slice(0, 6) + "******" + item.nik.slice(-4) : "-"})
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
                            Tujuan / Keperluan: <span className="text-slate-800 font-medium">{item.keperluan}</span>
                          </p>
                          {item.phone && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              No. WhatsApp: <span className="font-mono text-slate-700">{item.phone}</span>
                            </p>
                          )}
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
  );
}
