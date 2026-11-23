"use client";

/**
 * [HALAMAN USER / WARGA] Profil Akun Warga & Pengaturan Data Mandiri
 * Warga dapat melihat dan mengedit data kependudukan (Tempat Lahir, Tanggal Lahir,
 * Alamat, Pekerjaan, dll.) serta nomor telepon dan kata sandi akun.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  CreditCard,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Lock,
  Save,
  ShieldCheck,
  History,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useCitizen } from "@/contexts/CitizenContext";
import { PageBanner } from "@/components/layout/page-banner";

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];
const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
const EDUCATION_OPTIONS = [
  "Tidak/Belum Sekolah",
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/SMK/Sederajat",
  "Diploma (D1-D3)",
  "Sarjana (S1)",
  "Magister (S2)",
  "Doktor (S3)",
];
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
];
const STATUS_KELUARGA_OPTIONS = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Orang Tua/Mertua",
  "Famili Lain",
];
const STATUS_PENDUDUK_OPTIONS = ["Tetap", "Kontrak", "Pindah"];

export default function CitizenAccountPage() {
  const { citizen, loading: authLoading, setCitizen } = useCitizen();
  const { success, error: showError } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    nama: "",
    phone: "",
    birthPlace: "",
    birthDate: "",
    gender: "",
    address: "",
    occupation: "",
    agama: "",
    statusKeluarga: "",
    statusPenduduk: "",
    education: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Profil Akun Warga | Kelurahan Banjar Agung";
  }, []);

  useEffect(() => {
    if (!authLoading && !citizen) {
      router.push("/masuk?redirect=/akun");
      return;
    }
    if (citizen) {
      setForm((prev) => ({
        ...prev,
        nama: citizen.nama || "",
        phone: citizen.phone || "",
        birthPlace: citizen.birthPlace || "",
        birthDate: citizen.birthDate || "",
        gender: citizen.gender || "",
        address: citizen.address || "",
        occupation: citizen.occupation || "",
        agama: citizen.agama || "",
        statusKeluarga: citizen.statusKeluarga || "",
        statusPenduduk: citizen.statusPenduduk || "",
        education: citizen.education || "",
      }));
    }
  }, [citizen, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      showError("Nama lengkap wajib diisi.");
      return;
    }
    if (!form.phone.trim()) {
      showError("Nomor WhatsApp/HP wajib diisi.");
      return;
    }
    if (form.newPassword) {
      if (form.newPassword.length < 6) {
        showError("Kata sandi baru minimal 6 karakter.");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        showError("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/citizen-auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Gagal memperbarui profil.");
      }

      if (body.citizen) {
        setCitizen(body.citizen);
      }
      success("Profil Anda berhasil diperbarui!");
      setForm((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
    } catch (err) {
      console.error("Error saving profile:", err);
      showError(err instanceof Error ? err.message : "Gagal memperbarui profil.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-[#1b365d] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Memuat data profil...</p>
        </div>
      </div>
    );
  }

  if (!citizen) return null;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <PageBanner
        pageKey="riwayat"
        overrideBadge="PORTAL WARGA"
        overrideTitle="Profil Akun Warga"
        overrideSubtitle="Kelola identitas kependudukan dan informasi akun Anda untuk kemudahan pelayanan surat otomatis."
      />

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#1b365d] to-[#2b4c7e] text-white flex items-center justify-center shadow-md shadow-[#1b365d]/20 text-xl font-bold">
                {citizen.nama ? citizen.nama[0].toUpperCase() : "W"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{citizen.nama}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <ShieldCheck className="w-3.5 h-3.5" /> NIK Terverifikasi
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{citizen.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link href="/riwayat" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 h-9 border-slate-300">
                  <History className="w-3.5 h-3.5 text-slate-500" /> Riwayat Permohonan
                </Button>
              </Link>
              <Link href="/layanan" className="w-full sm:w-auto">
                <Button size="sm" className="w-full text-xs font-semibold gap-1.5 h-9 bg-[#1b365d] hover:bg-[#152a48] text-white">
                  <FileText className="w-3.5 h-3.5" /> Buat Surat
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-2.5 text-xs text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Data Terisi Otomatis:</strong> Data yang Anda simpan di halaman ini akan otomatis muncul pada saat Anda mengajukan permohonan surat di menu Layanan Surat, termasuk Tempat & Tanggal Lahir (TTL), Pekerjaan, dan Alamat.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#1b365d]" />
              <h3 className="text-sm font-bold text-slate-800">Informasi Kependudukan & Pribadi</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                  <span>Nomor Induk Kependudukan (NIK)</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                    <Lock className="w-3 h-3" /> NIK tidak dapat diubah
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={citizen.nik || "Tidak tersedia"}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-100/70 text-slate-500 text-sm font-mono cursor-not-allowed select-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-[11px] font-semibold">
                    <ShieldCheck className="w-4 h-4" /> KTP Valid
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="nama" className="text-xs font-semibold text-slate-600">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nama"
                    type="text"
                    required
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all"
                    placeholder="Sesuai KTP"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="gender" className="text-xs font-semibold text-slate-600">
                    Jenis Kelamin
                  </label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all bg-white"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="birthPlace" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Tempat Lahir <span className="text-slate-400 font-normal">(Kota/Kabupaten)</span>
                  </label>
                  <input
                    id="birthPlace"
                    type="text"
                    value={form.birthPlace}
                    onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all"
                    placeholder="Contoh: Serang, Bandung, Jakarta"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="birthDate" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tanggal Lahir
                  </label>
                  <input
                    id="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="agama" className="text-xs font-semibold text-slate-600">
                    Agama
                  </label>
                  <select
                    id="agama"
                    value={form.agama}
                    onChange={(e) => setForm({ ...form, agama: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all bg-white"
                  >
                    <option value="">Pilih Agama</option>
                    {AGAMA_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="occupation" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Pekerjaan / Profesi
                  </label>
                  <select
                    id="occupation"
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all bg-white"
                  >
                    <option value="">Pilih Pekerjaan</option>
                    {OCCUPATION_OPTIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="statusKeluarga" className="text-xs font-semibold text-slate-600">
                    Status Hubungan Keluarga
                  </label>
                  <select
                    id="statusKeluarga"
                    value={form.statusKeluarga}
                    onChange={(e) => setForm({ ...form, statusKeluarga: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all bg-white"
                  >
                    <option value="">Pilih Status</option>
                    {STATUS_KELUARGA_OPTIONS.map((sk) => (
                      <option key={sk} value={sk}>
                        {sk}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="education" className="text-xs font-semibold text-slate-600">
                    Pendidikan Terakhir
                  </label>
                  <select
                    id="education"
                    value={form.education}
                    onChange={(e) => setForm({ ...form, education: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all bg-white"
                  >
                    <option value="">Pilih Pendidikan</option>
                    {EDUCATION_OPTIONS.map((edu) => (
                      <option key={edu} value={edu}>
                        {edu}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="address" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Alamat Lengkap Domisili <span className="text-slate-400 font-normal">(RT/RW, Jalan, Nomor Rumah)</span>
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all resize-none"
                  placeholder="Contoh: Jl. Kelapa Gading No. 12, RT 02 / RW 04, Kel. Banjar Agung"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#1b365d]" />
              <h3 className="text-sm font-bold text-slate-800">Kontak & Keamanan Akun</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-semibold text-slate-600">
                  Nomor WhatsApp / HP Aktif <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all"
                  placeholder="Contoh: 08123456789"
                />
                <p className="text-[11px] text-slate-400">
                  Nomor ini digunakan untuk verifikasi login dan menerima update WhatsApp status surat.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Ubah Kata Sandi <span className="text-[11px] text-slate-400 font-normal">(Kosongkan jika tidak ingin mengubah kata sandi)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="text-xs font-semibold text-slate-600">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={form.newPassword}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        className="w-full h-10 pl-3 pr-10 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all"
                        placeholder="Minimal 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20 focus:border-[#1b365d] transition-all"
                      placeholder="Ketik ulang kata sandi baru"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/layanan">
              <Button type="button" variant="outline" className="text-xs font-semibold h-11 px-5 border-slate-300">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-bold h-11 px-6 rounded-xl shadow-md shadow-[#1b365d]/20 gap-2 cursor-pointer transition-all"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Perubahan Profil
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
