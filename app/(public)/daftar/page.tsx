"use client";

/**
 * [HALAMAN USER / WARGA] Pendaftaran Akun Warga Baru
 * Formulir registrasi split-screen: data kependudukan lengkap di kiri, foto Jembatan Bogeg di kanan. Responsive mobile.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowRight, Eye, EyeOff, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCitizen } from "@/contexts/CitizenContext";

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];
const STATUS_KELUARGA_OPTIONS = ["Kepala Keluarga", "Istri", "Anak", "Orang Tua/Mertua", "Famili Lain"];
const STATUS_PENDUDUK_OPTIONS = ["Tetap", "Kontrak", "Pindah"];
const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
const EDUCATION_OPTIONS = [
  "Tidak/Belum Sekolah", "SD/Sederajat", "SMP/Sederajat", "SMA/SMK/Sederajat",
  "Diploma (D1-D3)", "Sarjana (S1)", "Magister (S2)", "Doktor (S3)",
];
const OCCUPATION_OPTIONS = [
  "Belum/Tidak Bekerja", "Pelajar/Mahasiswa", "PNS/ASN", "TNI/Polri",
  "Karyawan Swasta", "Wiraswasta/UMKM", "Petani/Pekebun", "Nelayan",
  "Buruh Harian Lepas", "Pedagang", "Guru/Pendidik", "Tenaga Kesehatan",
  "Ibu Rumah Tangga", "Pensiunan", "Pekerja Lepas/Freelance", "Sopir/Ojek",
  "Tukang/Pekerja Bangunan", "Lainnya",
];

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-600 mb-1">
      {children}
    </label>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/30 focus:border-[#1b365d] transition-all"
    />
  );
}

function FieldSelect({
  id, value, onChange, options, required = false,
}: {
  id: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/30 focus:border-[#1b365d] transition-all appearance-none"
    >
      <option value="">— Pilih —</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function SectionHeading({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pt-2">
      <div className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {step}
      </div>
      <h3 className="text-sm font-bold text-[#1b365d]">{label}</h3>
      <div className="flex-1 h-px bg-[#1b365d]/10" />
    </div>
  );
}

export default function DaftarPage() {
  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [agama, setAgama] = useState("");
  const [education, setEducation] = useState("");
  const [statusKeluarga, setStatusKeluarga] = useState("");
  const [statusPenduduk, setStatusPenduduk] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { setCitizen } = useCitizen();
  const { error: showError, success: showSuccess } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{16}$/.test(nik)) {
      showError("NIK harus terdiri dari 16 digit angka.");
      return;
    }
    if (!nama.trim()) {
      showError("Nama lengkap wajib diisi.");
      return;
    }
    if (!phone.trim()) {
      showError("Nomor HP wajib diisi.");
      return;
    }
    if (password.length < 6) {
      showError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/citizen-auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          nik,
          nama: nama.trim(),
          gender,
          birthDate,
          agama,
          education,
          statusKeluarga,
          statusPenduduk,
          address: address.trim(),
          occupation,
          phone: phone.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Pendaftaran gagal.");
      setCitizen(data.citizen);
      showSuccess("Akun berhasil dibuat! Selamat datang.");
      router.push("/layanan");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      <div className="flex-1 flex items-start justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="mb-7 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1b365d] shadow-lg flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1b365d] leading-tight">Buat Akun Baru</h1>
              <p className="text-xs text-slate-500 mt-0.5">Isi data lengkap sesuai KTP / Kartu Keluarga Anda</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-1">
            <SectionHeading step={1} label="Identitas Pribadi" />
            <div className="grid grid-cols-1 gap-4 mb-5">
              <div>
                <FieldLabel htmlFor="nik">NIK (Nomor Induk Kependudukan)</FieldLabel>
                <FieldInput
                  id="nik"
                  type="text"
                  inputMode="numeric"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="16 digit sesuai KTP"
                  maxLength={16}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">{nik.length}/16 digit</p>
              </div>
              <div>
                <FieldLabel htmlFor="nama">Nama Lengkap</FieldLabel>
                <FieldInput id="nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Sesuai KTP" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="gender">Jenis Kelamin</FieldLabel>
                  <FieldSelect id="gender" value={gender} onChange={setGender} options={GENDER_OPTIONS} required />
                </div>
                <div>
                  <FieldLabel htmlFor="birthDate">Tanggal Lahir</FieldLabel>
                  <FieldInput id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="agama">Agama</FieldLabel>
                  <FieldSelect id="agama" value={agama} onChange={setAgama} options={AGAMA_OPTIONS} required />
                </div>
                <div>
                  <FieldLabel htmlFor="education">Pendidikan Terakhir</FieldLabel>
                  <FieldSelect id="education" value={education} onChange={setEducation} options={EDUCATION_OPTIONS} required />
                </div>
              </div>
            </div>

            <SectionHeading step={2} label="Status Kependudukan" />
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <FieldLabel htmlFor="statusKeluarga">Status dalam Keluarga</FieldLabel>
                <FieldSelect id="statusKeluarga" value={statusKeluarga} onChange={setStatusKeluarga} options={STATUS_KELUARGA_OPTIONS} required />
              </div>
              <div>
                <FieldLabel htmlFor="statusPenduduk">Status Penduduk</FieldLabel>
                <FieldSelect id="statusPenduduk" value={statusPenduduk} onChange={setStatusPenduduk} options={STATUS_PENDUDUK_OPTIONS} required />
              </div>
            </div>

            <SectionHeading step={3} label="Domisili & Pekerjaan" />
            <div className="space-y-3 mb-5">
              <div>
                <FieldLabel htmlFor="address">Alamat Lengkap (RT/RW)</FieldLabel>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. ..., RT 00/RW 00, Kel. Banjar Agung"
                  rows={2}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/30 focus:border-[#1b365d] transition-all resize-none"
                />
              </div>
              <div>
                <FieldLabel htmlFor="occupation">Pekerjaan</FieldLabel>
                <FieldSelect id="occupation" value={occupation} onChange={setOccupation} options={OCCUPATION_OPTIONS} required />
              </div>
            </div>

            <SectionHeading step={4} label="Akun Login" />
            <div className="space-y-3 mb-6">
              <div>
                <FieldLabel htmlFor="phone">Nomor HP / WhatsApp Aktif</FieldLabel>
                <FieldInput id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" required />
              </div>
              <div>
                <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
                <div className="relative">
                  <FieldInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="confirmPassword">Konfirmasi Kata Sandi</FieldLabel>
                <div className="relative">
                  <FieldInput
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    required
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-5">
              <ShieldCheck className="w-4 h-4 text-[#1b365d]/60 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Data Anda dienkripsi dan hanya digunakan untuk keperluan administrasi resmi Kelurahan Banjar Agung. NIK disimpan aman menggunakan enkripsi satu arah.
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 h-auto text-sm font-bold rounded-xl bg-[#1b365d] hover:bg-[#152a48] text-white shadow-md shadow-[#1b365d]/20 transition-all"
            >
              {submitting ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              Sudah punya akun?{" "}
              <Link href="/masuk" className="font-bold text-[#1b365d] hover:text-amber-600 transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex relative w-[420px] shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/banner-beranda-bogeg.jpg"
          alt="Jembatan Aria Wangsakara, Landmark Banjar Agung"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b365d]/85 via-[#1b365d]/50 to-[#1b365d]/80" />
        <div className="relative z-10 flex flex-col h-full px-8 py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold w-fit mb-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            PORTAL LAYANAN WARGA
          </div>

          <div className="space-y-4">
            {[
              { title: "Ajukan Surat Mandiri", desc: "SKTM, SKU, Domisili, dan 10+ jenis surat keterangan lainnya secara online." },
              { title: "Pantau Status Real-Time", desc: "Lacak progres berkas kapan saja tanpa perlu datang ke kantor kelurahan." },
              { title: "Riwayat Pengajuan Lengkap", desc: "Semua pengajuan dan laporan Anda tersimpan rapi dalam dashboard pribadi." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-white/65 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/15">
            <p className="text-xs text-white/60 leading-relaxed">
              Kelurahan Banjar Agung · Kec. Cipocok Jaya, Kota Serang, Banten. Layanan administrasi kependudukan digital 24 jam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
