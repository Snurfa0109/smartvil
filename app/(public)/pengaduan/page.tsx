"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Phone, Mail, MapPin, Upload, Image as ImageIcon, X, CheckCircle, Clock, Search, ShieldCheck, Copy, Check, ExternalLink, MessageCircle, ArrowRight, History } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToStorage } from "@/lib/uploadImage";

const complaintCategories = [
  "Infrastruktur & Jalan",
  "Pelayanan & Administrasi",
  "Kebersihan & Lingkungan",
  "Keamanan & Ketertiban",
  "Sosial & Bantuan Warga",
  "Lainnya",
];

interface StoredComplaint {
  ticketCode: string;
  judul: string;
  category: string;
  date: string;
}

export default function ComplaintsPage() {
  const [activeTab, setActiveTab] = useState<"form" | "track">("form");

  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    phone: "",
    category: complaintCategories[0],
    judul: "",
    isi: "",
    isAnonim: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedComplaintInfo, setSubmittedComplaintInfo] = useState<{
    ticketCode: string;
    judul: string;
    nama: string;
    category: string;
    phone: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Tracking State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedComplaints, setTrackedComplaints] = useState<any[] | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<StoredComplaint[]>([]);

  // Load recent complaints from device storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("banjaragung_saved_complaints");
      if (stored) {
        setRecentComplaints(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading saved complaints:", e);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  const handleCopyTicket = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kirim ke nomor WA warga sendiri — sebagai catatan/reminder simpan tiket
  const generateWhatsAppSelfReminderUrl = (ticket: {
    ticketCode: string;
    judul: string;
    nama: string;
    category: string;
    phone: string;
  }) => {
    const text = encodeURIComponent(
      `📋 *CATATAN TIKET PENGADUAN SAYA*\n` +
      `Kelurahan Banjar Agung — ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
      `• *Nomor Tiket:* ${ticket.ticketCode}\n` +
      `• *Kategori:* ${ticket.category}\n` +
      `• *Judul Laporan:* ${ticket.judul}\n` +
      (ticket.nama !== "Anonim (Dirahasiakan)" ? `• *Nama Pelapor:* ${ticket.nama}\n` : `• Dilaporkan secara Anonim\n`) +
      `\n🔍 Lacak status pengaduan di:\n` +
      `https://banjaragung.go.id/pengaduan → Tab "Lacak Status"\nMasukkan kode tiket di atas.\n\n` +
      `💡 Simpan pesan ini agar tidak kehilangan nomor tiket.`
    );
    // Format nomor WA warga: hapus karakter bukan digit, normalize ke format 62xxx
    let cleanPhone = ticket.phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = "";
      if (selectedFile) {
        try {
          photoUrl = await uploadImageToStorage(selectedFile, "complaints");
        } catch (uploadErr) {
          console.warn("Storage upload failed, proceeding without photo:", uploadErr);
        }
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `PGD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${randomSuffix}`;
      const pelaporNama = formData.isAnonim ? "Anonim (Dirahasiakan)" : formData.nama || "Warga";

      const payload = {
        ticketCode,
        nama: pelaporNama,
        email: formData.email || "",
        phone: formData.phone || "",
        category: formData.category,
        title: formData.judul,
        judul: formData.judul,
        message: formData.isi,
        isi: formData.isi,
        photoUrl,
        status: "pending",
        adminResponse: "",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "complaints"), payload);

      const newInfo = {
        ticketCode,
        judul: formData.judul,
        nama: pelaporNama,
        category: formData.category,
        phone: formData.phone,
      };

      setSubmittedComplaintInfo(newInfo);

      // Simpan ke localStorage agar warga tidak kehilangan tiket
      try {
        const stored = localStorage.getItem("banjaragung_saved_complaints");
        const prevList: StoredComplaint[] = stored ? JSON.parse(stored) : [];
        const updated = [
          {
            ticketCode,
            judul: formData.judul,
            category: formData.category,
            date: new Date().toISOString(),
          },
          ...prevList.filter((item) => item.ticketCode !== ticketCode),
        ].slice(0, 5);
        localStorage.setItem("banjaragung_saved_complaints", JSON.stringify(updated));
        setRecentComplaints(updated);
      } catch (err) {
        console.error("Error saving complaint to localStorage:", err);
      }

      setFormData({
        nama: "",
        email: "",
        phone: "",
        category: complaintCategories[0],
        judul: "",
        isi: "",
        isAnonim: false,
      });
      removeFile();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Gagal mengirim laporan. Silakan periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackWithQuery = async (queryParam?: string) => {
    const rawSearch = (queryParam || trackQuery).trim();
    if (!rawSearch) return;

    setTrackingLoading(true);
    try {
      const cleaned = rawSearch.trim();
      const digitsOnly = cleaned.replace(/\D/g, "");

      // 1. Exact ticketCode match
      const qByTicket = query(collection(db, "complaints"), where("ticketCode", "==", cleaned));
      const snapTicket = await getDocs(qByTicket);

      let results: any[] = snapTicket.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2. Search by phone number variations
      if (results.length === 0 && (digitsOnly.length >= 8 || cleaned.includes("+62"))) {
        const phoneCandidates = [cleaned];
        if (digitsOnly.startsWith("0")) {
          phoneCandidates.push(digitsOnly);
          phoneCandidates.push("62" + digitsOnly.slice(1));
          phoneCandidates.push("+62" + digitsOnly.slice(1));
        } else if (digitsOnly.startsWith("62")) {
          phoneCandidates.push(digitsOnly);
          phoneCandidates.push("0" + digitsOnly.slice(2));
          phoneCandidates.push("+" + digitsOnly);
        }

        for (const phoneVal of Array.from(new Set(phoneCandidates))) {
          const qByPhone = query(collection(db, "complaints"), where("phone", "==", phoneVal));
          const snapPhone = await getDocs(qByPhone);
          snapPhone.docs.forEach((d) => {
            if (!results.some((r) => r.id === d.id)) {
              results.push({ id: d.id, ...d.data() });
            }
          });
        }
      }

      setTrackedComplaints(results);
    } catch (err) {
      console.error("Error tracking complaint:", err);
      alert("Gagal memuat status pengaduan. Coba beberapa saat lagi.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleTrackWithQuery();
  };

  return (
    <div className="container mx-auto px-6 md:px-12 py-12">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#1b365d]/10 text-[#1b365d] border border-[#1b365d]/20">
          Kanal Aspirasi Resmi Warga
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Layanan Pengaduan &amp; Aspirasi</h1>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          Sampaikan aspirasi, keluhan fasilitas publik, atau saran untuk kemajuan Kelurahan Banjar Agung.
        </p>

        {/* Navigation Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 mt-4 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "form" ? "bg-white text-[#1b365d] shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kirim Pengaduan Baru
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("track")}
            className={`px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "track" ? "bg-white text-[#1b365d] shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Lacak Status Pengaduan
          </button>
        </div>
      </div>

      {/* === ALUR PENGADUAN === */}
      <section id="alur" className="scroll-mt-24 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-[#1b365d]/5 to-slate-50 border border-[#1b365d]/10 p-6 md:p-8 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#1b365d]">Alur Pengaduan Masyarakat</h2>
            <p className="text-sm text-slate-600">Prosedur dan tata kelola penyampaian aspirasi serta pengaduan warga kepada Pemerintah Kelurahan Banjar Agung</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                title: "Klasifikasi Laporan",
                desc: "Pilih kategori pengaduan: infrastruktur, pelayanan publik, ketertiban umum, kebersihan, atau sosial kemasyarakatan.",
                color: "bg-[#1b365d]",
              },
              {
                step: "2",
                title: "Pengisian Laporan",
                desc: "Uraikan substansi laporan secara objektif dan sertakan bukti pendukung jika ada. Laporan dapat dikirim secara anonim.",
                color: "bg-blue-600",
              },
              {
                step: "3",
                title: "Registrasi & Nomor Tiket",
                desc: "Sistem menerbitkan nomor tiket registrasi resmi sebagai bukti penerimaan pengaduan untuk pemantauan tindak lanjut.",
                color: "bg-amber-600",
              },
              {
                step: "4",
                title: "Tindak Lanjut & Verifikasi",
                desc: "Petugas kelurahan memproses laporan. Perkembangan penanganan dapat dipantau melalui menu Lacak Status Pengaduan.",
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
              onClick={() => setActiveTab("form")}
              className="inline-flex items-center gap-2 bg-[#1b365d] hover:bg-[#152a48] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Sampaikan Pengaduan Masyarakat <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {submittedComplaintInfo && (
        <div className="max-w-2xl mx-auto mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-900 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Laporan Pengaduan Berhasil Terkirim!</h3>
            <p className="text-sm text-emerald-800">
              Laporan Anda sudah otomatis diterima oleh Kelurahan. Simpan <strong>Nomor Tiket</strong> di bawah ke WhatsApp Anda sendiri agar bisa digunakan untuk lacak status kapan saja:
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="bg-white border-2 border-emerald-400 px-5 py-2.5 rounded-lg font-mono text-xl font-extrabold text-emerald-800 tracking-wider shadow-inner">
              {submittedComplaintInfo.ticketCode}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopyTicket(submittedComplaintInfo.ticketCode)}
              className="bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold gap-1.5 h-10"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Salin Tiket
                </>
              )}
            </Button>
          </div>

          {/* Tombol Simpan Catatan Tiket ke WhatsApp Sendiri */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            {submittedComplaintInfo.phone ? (
              <a
                href={generateWhatsAppSelfReminderUrl(submittedComplaintInfo)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-colors"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                Simpan Tiket ke WhatsApp Saya
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="text-xs text-emerald-700 italic">
                Anda melapor secara anonim — salin kode tiket di atas untuk disimpan.
              </p>
            )}

            <Button
              variant="outline"
              className="w-full sm:w-auto text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              onClick={() => {
                setTrackQuery(submittedComplaintInfo.ticketCode);
                setActiveTab("track");
                handleTrackWithQuery(submittedComplaintInfo.ticketCode);
                setSubmittedComplaintInfo(null);
              }}
            >
              Lacak Pengaduan <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {activeTab === "form" ? (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Kontak Resmi Kelurahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1b365d]/10 text-[#1b365d] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">Alamat Kantor</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Jl. Syech Nawawi Albantani No. 16, Kel. Banjar Agung, Kec. Cipocok Jaya, Kota Serang 42122</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1b365d]/10 text-[#1b365d] flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">Telepon / WhatsApp</p>
                    <p className="text-xs text-slate-500 mt-0.5">+62 813-1505-3901</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1b365d]/10 text-[#1b365d] flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">Email Pelayanan</p>
                    <p className="text-xs text-slate-500 mt-0.5">pengaduan@kel.banjaragung.serang.go.id</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-amber-800 flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-amber-600" /> Jaminan Kerahasiaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-amber-900">
                <p className="text-xs">Identitas pelapor dilindungi dan dapat memilih opsi <strong>Anonim</strong> jika diinginkan.</p>
                <ol className="list-decimal list-inside space-y-1.5 pt-1 text-xs text-amber-800">
                  <li>Tuliskan pokok keluhan secara jelas.</li>
                  <li>Sertakan bukti foto kondisi lapangan.</li>
                  <li>Petugas akan memverifikasi dalam 1x24 jam kerja.</li>
                  <li>Pantau tindak lanjut berkala lewat nomor tiket.</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-bold">Formulir Pengaduan Online</CardTitle>
                <CardDescription className="text-xs">
                  Isi formulir di bawah ini dengan lengkap dan objektif untuk ditindaklanjuti perangkat kelurahan.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Laporkan sebagai Anonim?</p>
                      <p className="text-xs text-muted-foreground">Nama Anda tidak akan dipublikasikan ke umum.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isAnonim}
                        onChange={(e) => setFormData({ ...formData, isAnonim: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {!formData.isAnonim && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="nama" className="text-sm font-medium">Nama Pelapor</label>
                        <input
                          id="nama"
                          type="text"
                          required={!formData.isAnonim}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          placeholder="Nama lengkap Anda"
                          value={formData.nama}
                          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email (Opsional)</label>
                        <input
                          id="email"
                          type="email"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          placeholder="email@contoh.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="category" className="text-sm font-medium">Kategori Pengaduan</label>
                      <select
                        id="category"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {complaintCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">Nomor WhatsApp / HP Aktif</label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Contoh: 08123456789"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="judul" className="text-sm font-medium">Judul Laporan</label>
                    <input
                      id="judul"
                      type="text"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="Contoh: Lampu Penerangan Jalan RT 03 Padam"
                      value={formData.judul}
                      onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="isi" className="text-sm font-medium">Isi & Kronologi Laporan</label>
                    <textarea
                      id="isi"
                      required
                      className="flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="Jelaskan detail lokasi, waktu kejadian, dan dampak yang dialami..."
                      value={formData.isi}
                      onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                    />
                  </div>

                  {/* Upload Foto Bukti */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lampiran Foto Bukti (Opsional)</label>
                    {!filePreview ? (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium text-primary">Klik untuk memilih foto</span>
                        <span className="text-xs text-muted-foreground mt-1">Format JPG, PNG (Maks 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    ) : (
                      <div className="relative inline-block border rounded-lg overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={filePreview} alt="Bukti pengaduan" className="h-44 w-auto object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={removeFile}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading} size="lg">
                    {loading ? (
                      "Mengirim Laporan..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Kirim Pengaduan Sekarang
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Tracking Tab */
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cek Status Pengaduan Warga</CardTitle>
              <CardDescription>
                Masukkan <strong>Kode Tiket</strong> (contoh: <code>PGD-202609-1234</code>) atau <strong>Nomor WhatsApp</strong> yang digunakan saat melapor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleTrack} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan Kode Tiket atau Nomor HP..."
                    className="w-full h-11 pl-10 pr-4 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" disabled={trackingLoading}>
                  {trackingLoading ? "Mencari..." : "Lacak"}
                </Button>
              </form>

              {/* Riwayat Pengaduan di Perangkat Ini */}
              {recentComplaints.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-primary" />
                    Laporan Terakhir Anda di Perangkat Ini:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentComplaints.map((c) => (
                      <button
                        key={c.ticketCode}
                        type="button"
                        onClick={() => {
                          setTrackQuery(c.ticketCode);
                          handleTrackWithQuery(c.ticketCode);
                        }}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-md px-2.5 py-1 text-left transition-colors flex items-center gap-1.5"
                      >
                        <span className="font-mono font-bold text-primary">{c.ticketCode}</span>
                        <span className="text-slate-500 max-w-[140px] truncate">({c.judul})</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {trackedComplaints !== null && (
            <div className="space-y-4">
              {trackedComplaints.length === 0 ? (
                <div className="text-center py-10 bg-white border rounded-xl text-muted-foreground">
                  <p className="font-medium text-foreground">Tidak ditemukan laporan pengaduan.</p>
                  <p className="text-sm mt-1">Pastikan kode tiket atau nomor HP yang Anda masukkan sudah sesuai.</p>
                </div>
              ) : (
                trackedComplaints.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-3">
                      <div>
                        <span className="text-xs font-mono font-semibold bg-white border px-2 py-0.5 rounded text-primary">
                          {item.ticketCode || "Tiket Laporan"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-3">
                          Kategori: {item.category || "Umum"}
                        </span>
                      </div>
                      <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === "completed" || item.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : item.status === "processed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.status === "completed" || item.status === "resolved"
                          ? "Selesai Ditindaklanjuti"
                          : item.status === "processed"
                          ? "Sedang Diproses"
                          : "Menunggu Verifikasi"}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{item.title || item.judul}</h3>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                          {item.message || item.isi}
                        </p>
                      </div>

                      {item.photoUrl && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Bukti Foto Terlampir:</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.photoUrl}
                            alt="Bukti Pengaduan"
                            className="h-44 rounded-lg border object-cover cursor-pointer hover:opacity-95"
                            onClick={() => window.open(item.photoUrl, "_blank")}
                          />
                        </div>
                      )}

                      {/* Admin Response Box */}
                      {item.adminResponse ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-1">
                          <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600" /> Tanggapan & Tindak Lanjut Kelurahan:
                          </p>
                          <p className="text-sm text-emerald-950 whitespace-pre-line">{item.adminResponse}</p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Belum ada tanggapan tertulis dari petugas kelurahan. Laporan Anda sedang dalam antrean tindak lanjut.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
