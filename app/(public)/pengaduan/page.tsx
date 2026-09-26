"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Phone, Mail, MapPin, Upload, X, CheckCircle, Clock, Search, ArrowRight, History, MessageSquare, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
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

interface StoredPhone {
  phone: string;
  name: string;
  lastDate: string;
}

export default function ComplaintsPage() {
  const [activeTab, setActiveTab] = useState<"form" | "track">("form");

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    phone: "",
    category: complaintCategories[0],
    judul: "",
    isi: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<{
    nama: string;
    phone: string;
    judul: string;
    category: string;
  } | null>(null);

  const [trackPhone, setTrackPhone] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedComplaints, setTrackedComplaints] = useState<any[] | null>(null);
  const [recentPhones, setRecentPhones] = useState<StoredPhone[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("banjaragung_saved_phones");
      if (stored) {
        setRecentPhones(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading saved phones:", e);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.phone.trim()) {
      alert("Nama lengkap dan nomor telepon wajib diisi.");
      return;
    }

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

      // Clean phone representation
      const rawPhone = formData.phone.trim();

      const payload = {
        ticketCode,
        nama: formData.nama.trim(),
        email: formData.email.trim(),
        phone: rawPhone,
        category: formData.category,
        title: formData.judul.trim(),
        judul: formData.judul.trim(),
        message: formData.isi.trim(),
        isi: formData.isi.trim(),
        photoUrl,
        status: "pending",
        adminResponse: "",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "complaints"), payload);

      setSubmittedInfo({
        nama: formData.nama.trim(),
        phone: rawPhone,
        judul: formData.judul.trim(),
        category: formData.category,
      });

      // Save phone to localStorage for easy return
      try {
        const stored = localStorage.getItem("banjaragung_saved_phones");
        const prevList: StoredPhone[] = stored ? JSON.parse(stored) : [];
        const updated = [
          {
            phone: rawPhone,
            name: formData.nama.trim(),
            lastDate: new Date().toISOString(),
          },
          ...prevList.filter((item) => item.phone !== rawPhone),
        ].slice(0, 5);
        localStorage.setItem("banjaragung_saved_phones", JSON.stringify(updated));
        setRecentPhones(updated);
      } catch (err) {
        console.error("Error saving phone to localStorage:", err);
      }

      setFormData({
        nama: "",
        email: "",
        phone: "",
        category: complaintCategories[0],
        judul: "",
        isi: "",
      });
      removeFile();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Gagal mengirim laporan. Silakan periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackWithPhone = async (phoneNumber?: string) => {
    const rawSearch = (phoneNumber || trackPhone).trim();
    if (!rawSearch) return;

    setTrackingLoading(true);
    try {
      const digitsOnly = rawSearch.replace(/\D/g, "");

      // Generate phone variations (08xxx, 628xxx, +628xxx)
      const phoneCandidates = [rawSearch];
      if (digitsOnly.length >= 8) {
        phoneCandidates.push(digitsOnly);
        if (digitsOnly.startsWith("0")) {
          phoneCandidates.push("62" + digitsOnly.slice(1));
          phoneCandidates.push("+62" + digitsOnly.slice(1));
        } else if (digitsOnly.startsWith("62")) {
          phoneCandidates.push("0" + digitsOnly.slice(2));
          phoneCandidates.push("+" + digitsOnly);
        }
      }

      // Also support legacy search by exact ticketCode if user happens to enter one
      const qByTicket = query(collection(db, "complaints"), where("ticketCode", "==", rawSearch));
      const snapTicket = await getDocs(qByTicket);
      const results: any[] = snapTicket.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Query by phone variants
      for (const phoneVal of Array.from(new Set(phoneCandidates))) {
        const qByPhone = query(collection(db, "complaints"), where("phone", "==", phoneVal));
        const snapPhone = await getDocs(qByPhone);
        snapPhone.docs.forEach((d) => {
          if (!results.some((r) => r.id === d.id)) {
            results.push({ id: d.id, ...d.data() });
          }
        });
      }

      // Sort newest first
      results.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setTrackedComplaints(results);
    } catch (err) {
      console.error("Error tracking complaint by phone:", err);
      alert("Gagal memuat status pengaduan. Coba beberapa saat lagi.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleTrackWithPhone();
  };

  // Status statistics for tracked phone
  const stats = trackedComplaints
    ? {
        total: trackedComplaints.length,
        pending: trackedComplaints.filter((c) => c.status === "pending").length,
        processed: trackedComplaints.filter((c) => c.status === "processed").length,
        completed: trackedComplaints.filter((c) => c.status === "completed" || c.status === "resolved").length,
      }
    : null;

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          Kanal Aspirasi & Pengaduan Resmi
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Layanan Pengaduan Masyarakat
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Sampaikan keluhan fasilitas lingkungan, pelayanan publik, atau aspirasi warga. Semua laporan diverifikasi secara transparan melalui nomor telepon Anda.
        </p>

        {/* Navigation Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 mt-2">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "form" ? "bg-white text-[#1b365d] shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Formulir Pengaduan Baru
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("track")}
            className={`px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "track" ? "bg-white text-[#1b365d] shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cek Riwayat via No. Telepon
          </button>
        </div>
      </div>

      {/* Success Notification after submission */}
      {submittedInfo && (
        <div className="max-w-2xl mx-auto bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-950 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900">Pengaduan Anda Berhasil Terkirim</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Laporan tercatat atas nama <strong>{submittedInfo.nama}</strong> ({submittedInfo.phone}).
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-4 border border-emerald-200/80 text-xs space-y-1.5 text-slate-700">
            <p><strong>Judul Laporan:</strong> {submittedInfo.judul}</p>
            <p><strong>Kategori:</strong> {submittedInfo.category}</p>
            <p className="text-emerald-800 pt-1">
              Petugas kelurahan akan menindaklanjuti laporan ini. Anda dapat mengecek status dan riwayat pengaduan kapan saja cukup dengan nomor telepon Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              className="bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-semibold"
              onClick={() => {
                setTrackPhone(submittedInfo.phone);
                setActiveTab("track");
                handleTrackWithPhone(submittedInfo.phone);
                setSubmittedInfo(null);
              }}
            >
              Lihat Riwayat Laporan Saya <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => setSubmittedInfo(null)}
            >
              Tutup Notifikasi
            </Button>
          </div>
        </div>
      )}

      {activeTab === "form" ? (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Side Info */}
          <div className="space-y-6">
            <Card className="border-slate-200/90 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Kontak Resmi Kelurahan</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">Alamat Kantor</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Jl. Syech Nawawi Albantani No. 16, Kel. Banjar Agung, Kec. Cipocok Jaya, Kota Serang 42122
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">Telepon / WhatsApp</p>
                    <p className="text-xs text-slate-500 mt-0.5">+62 813-1505-3901</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">Email Pelayanan</p>
                    <p className="text-xs text-slate-500 mt-0.5">pengaduan@kel.banjaragung.serang.go.id</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/90 shadow-xs bg-slate-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Petunjuk Pelaporan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-2">
                <p>1. Masukkan nama lengkap dan nomor telepon aktif Anda agar petugas dapat melakukan verifikasi.</p>
                <p>2. Jelaskan pokok permasalahan lokasi kejadian dengan detail dan objektif.</p>
                <p>3. Sertakan lampiran foto kondisi riil di lapangan jika memungkinkan.</p>
                <p>4. Semua riwayat pengaduan otomatis terhubung ke nomor telepon Anda tanpa perlu kode rahasia.</p>
              </CardContent>
            </Card>
          </div>

          {/* Form Pengaduan */}
          <div className="md:col-span-2">
            <Card className="border-slate-200/90 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-bold text-slate-900">
                  Formulir Pengaduan Warga
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Isi data di bawah ini secara jelas. Data identitas digunakan untuk koordinasi tindak lanjut petugas lapangan.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="nama" className="text-xs font-semibold text-slate-800">
                        Nama Lengkap Pelapor <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="nama"
                        type="text"
                        required
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d]"
                        placeholder="Contoh: Budi Santoso"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-xs font-semibold text-slate-800">
                        Nomor WhatsApp / HP Aktif <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d]"
                        placeholder="Contoh: 081234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="category" className="text-xs font-semibold text-slate-800">
                        Kategori Pengaduan <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d]"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {complaintCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-semibold text-slate-800">
                        Alamat Email (Opsional)
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d]"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="judul" className="text-xs font-semibold text-slate-800">
                      Pokok / Judul Laporan <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="judul"
                      type="text"
                      required
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d]"
                      placeholder="Contoh: Saluran Drainase Tersumbat di RT 03 RW 05"
                      value={formData.judul}
                      onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="isi" className="text-xs font-semibold text-slate-800">
                      Uraian Detail Laporan & Lokasi Kejadian <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="isi"
                      required
                      rows={4}
                      className="flex w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d]"
                      placeholder="Jelaskan secara lengkap lokasi, waktu, dan situasi masalah yang Anda laporkan..."
                      value={formData.isi}
                      onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                    />
                  </div>

                  {/* Foto Bukti */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-800 block">
                      Lampiran Foto Pendukung (Opsional)
                    </label>
                    {!filePreview ? (
                      <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <Upload className="h-6 w-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-600 font-medium">Unggah Foto Lokasi / Bukti</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">Format JPG atau PNG (Maks 5 MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    ) : (
                      <div className="relative inline-block border rounded-xl overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={filePreview} alt="Bukti pengaduan" className="h-40 w-auto object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={removeFile}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                          title="Hapus foto"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold text-sm py-2.5 rounded-xl shadow-xs"
                    disabled={loading}
                  >
                    {loading ? (
                      "Mengirim Laporan..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Kirim Pengaduan Warga
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Tracking Tab via Phone Number */
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="border-slate-200/90 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900">
                Lacak Riwayat Pengaduan Berdasarkan Nomor Telepon
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Masukkan nomor telepon atau WhatsApp yang Anda gunakan saat mengajukan laporan untuk melihat status dan berapa kali Anda telah melapor.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Masukkan Nomor Telepon / WhatsApp (contoh: 081234567890)..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d]"
                    value={trackPhone}
                    onChange={(e) => setTrackPhone(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={trackingLoading}
                  className="bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-semibold px-5 rounded-xl"
                >
                  {trackingLoading ? "Mencari..." : "Cek Laporan"}
                </Button>
              </form>

              {/* Laporan Terakhir Tersimpan di Perangkat Ini */}
              {recentPhones.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-slate-400" />
                    Nomor Terakhir Anda di Perangkat Ini:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentPhones.map((p) => (
                      <button
                        key={p.phone}
                        type="button"
                        onClick={() => {
                          setTrackPhone(p.phone);
                          handleTrackWithPhone(p.phone);
                        }}
                        className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="font-semibold">{p.phone}</span>
                        <span className="text-slate-400">({p.name})</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {trackedComplaints !== null && (
            <div className="space-y-4">
              {trackedComplaints.length === 0 ? (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6 text-slate-500 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Tidak Ditemukan Pengaduan</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tidak ada laporan pengaduan yang tercatat dengan nomor telepon <strong>{trackPhone}</strong>. Pastikan nomor yang dimasukkan sama dengan saat mengisi formulir.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Card for Phone Number */}
                  <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Riwayat Pelapor
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {trackedComplaints[0]?.nama || "Warga"} ({trackPhone})
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Tercatat telah mengajukan total <strong>{stats?.total} kali pengaduan</strong> ke Kelurahan Banjar Agung.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-center px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                        <div className="text-sm font-bold text-amber-300">{stats?.pending}</div>
                        <div className="text-[10px] text-slate-300">Menunggu</div>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                        <div className="text-sm font-bold text-blue-300">{stats?.processed}</div>
                        <div className="text-[10px] text-slate-300">Diproses</div>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                        <div className="text-sm font-bold text-emerald-300">{stats?.completed}</div>
                        <div className="text-[10px] text-slate-300">Selesai</div>
                      </div>
                    </div>
                  </div>

                  {/* List of Complaints */}
                  <div className="space-y-4">
                    {trackedComplaints.map((item, idx) => (
                      <Card key={item.id} className="border-slate-200/90 shadow-xs overflow-hidden">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">
                              Laporan #{trackedComplaints.length - idx}
                            </span>
                            <span className="text-xs text-slate-500">
                              Kategori: <strong>{item.category || "Umum"}</strong>
                            </span>
                          </div>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                            item.status === "completed" || item.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "processed"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {item.status === "completed" || item.status === "resolved"
                              ? "Selesai Ditindaklanjuti"
                              : item.status === "processed"
                              ? "Sedang Ditindaklanjuti"
                              : "Menunggu Verifikasi"}
                          </span>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">{item.title || item.judul}</h4>
                            <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                              {item.message || item.isi}
                            </p>
                          </div>

                          {item.photoUrl && (
                            <div>
                              <p className="text-[11px] font-semibold text-slate-500 mb-1">Bukti Foto Terlampir:</p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.photoUrl}
                                alt="Bukti Pengaduan"
                                className="h-40 rounded-xl border border-slate-200 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(item.photoUrl, "_blank")}
                              />
                            </div>
                          )}

                          {/* Tanggapan Resmi Kelurahan */}
                          {item.adminResponse ? (
                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-1">
                              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                Tindak Lanjut & Tanggapan Resmi Kelurahan:
                              </p>
                              <p className="text-xs text-emerald-950 whitespace-pre-line leading-relaxed">
                                {item.adminResponse}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>Laporan Anda telah masuk antrean sistem dan sedang dalam proses verifikasi petugas kelurahan.</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
