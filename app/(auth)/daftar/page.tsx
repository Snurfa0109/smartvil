"use client";

/**
 * [HALAMAN USER / WARGA] Pendaftaran Akun Warga Baru
 * Split-screen: foto Jembatan Bogeg di kiri, form registrasi di kanan (scrollable inner). Satu layar penuh.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff, ShieldCheck, ChevronRight } from "lucide-react";
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

function FL({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
      {children}
    </label>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/30 focus:border-[#1b365d] transition-all";

function FI(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

function FS({ id, value, onChange, options, required = false }: {
  id: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required}
      className={`${inputCls} appearance-none`}>
      <option value="">— Pilih —</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SH({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <div className="w-5 h-5 rounded-full bg-[#1b365d] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{step}</div>
      <span className="text-xs font-bold text-[#1b365d] uppercase tracking-wide">{label}</span>
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
    if (!/^\d{16}$/.test(nik)) { showError("NIK harus terdiri dari 16 digit angka."); return; }
    if (!nama.trim()) { showError("Nama lengkap wajib diisi."); return; }
    if (!phone.trim()) { showError("Nomor HP wajib diisi."); return; }
    if (password.length < 6) { showError("Kata sandi minimal 6 karakter."); return; }
    if (password !== confirmPassword) { showError("Konfirmasi kata sandi tidak cocok."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/citizen-auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register", nik, nama: nama.trim(), gender, birthDate,
          agama, education, statusKeluarga, statusPenduduk,
          address: address.trim(), occupation, phone: phone.trim(), password,
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
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      <div className="hidden lg:flex relative w-[380px] shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/banner-beranda-bogeg.jpg"
          alt="Jembatan Aria Wangsakara, Landmark Banjar Agung"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b365d]/85 via-[#1b365d]/50 to-[#1b365d]/80" />
        <div className="relative z-10 flex flex-col h-full px-7 py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold w-fit mb-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            PORTAL LAYANAN WARGA
          </div>
          <div className="space-y-4">
            {[
              { title: "Ajukan Surat Mandiri", desc: "SKTM, SKU, Domisili, dan 10+ jenis surat secara online." },
              { title: "Pantau Status Real-Time", desc: "Lacak progres berkas kapan saja tanpa ke kantor." },
              { title: "Riwayat Pengajuan Lengkap", desc: "Semua pengajuan tersimpan rapi di dashboard pribadi." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2.5">
                <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-white/65 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-white/15">
            <p className="text-[11px] text-white/50 leading-relaxed">
              Kelurahan Banjar Agung · Kec. Cipocok Jaya, Kota Serang, Banten.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex items-center gap-3 px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#1b365d] flex items-center justify-center shrink-0">
            <UserPlus className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1b365d] leading-tight">Buat Akun Baru</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Isi data lengkap sesuai KTP / Kartu Keluarga Anda</p>
          </div>
          <div className="ml-auto text-[11px] text-slate-400">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-bold text-[#1b365d] hover:text-amber-600 transition-colors">Masuk</Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-5">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0">
              <div className="col-span-2">
                <SH step={1} label="Identitas Pribadi" />
              </div>

              <div className="col-span-2 mb-3">
                <FL id="nik">NIK (16 digit sesuai KTP)</FL>
                <FI id="nik" type="text" inputMode="numeric" value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="Nomor Induk Kependudukan" maxLength={16} required />
                <span className="text-[10px] text-slate-400">{nik.length}/16</span>
              </div>

              <div className="col-span-2 mb-3">
                <FL id="nama">Nama Lengkap</FL>
                <FI id="nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Sesuai KTP" required />
              </div>

              <div className="mb-3">
                <FL id="gender">Jenis Kelamin</FL>
                <FS id="gender" value={gender} onChange={setGender} options={GENDER_OPTIONS} required />
              </div>

              <div className="mb-3">
                <FL id="birthDate">Tanggal Lahir</FL>
                <FI id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
              </div>

              <div className="mb-3">
                <FL id="agama">Agama</FL>
                <FS id="agama" value={agama} onChange={setAgama} options={AGAMA_OPTIONS} required />
              </div>

              <div className="mb-3">
                <FL id="education">Pendidikan Terakhir</FL>
                <FS id="education" value={education} onChange={setEducation} options={EDUCATION_OPTIONS} required />
              </div>

              <div className="col-span-2">
                <SH step={2} label="Status Kependudukan" />
              </div>

              <div className="mb-3">
                <FL id="statusKeluarga">Status dalam Keluarga</FL>
                <FS id="statusKeluarga" value={statusKeluarga} onChange={setStatusKeluarga} options={STATUS_KELUARGA_OPTIONS} required />
              </div>

              <div className="mb-3">
                <FL id="statusPenduduk">Status Penduduk</FL>
                <FS id="statusPenduduk" value={statusPenduduk} onChange={setStatusPenduduk} options={STATUS_PENDUDUK_OPTIONS} required />
              </div>

              <div className="col-span-2">
                <SH step={3} label="Domisili & Pekerjaan" />
              </div>

              <div className="col-span-2 mb-3">
                <FL id="address">Alamat Lengkap (RT/RW)</FL>
                <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. ..., RT 00/RW 00, Kel. Banjar Agung" rows={2} required
                  className={`${inputCls} resize-none`} />
              </div>

              <div className="col-span-2 mb-3">
                <FL id="occupation">Pekerjaan</FL>
                <FS id="occupation" value={occupation} onChange={setOccupation} options={OCCUPATION_OPTIONS} required />
              </div>

              <div className="col-span-2">
                <SH step={4} label="Akun Login" />
              </div>

              <div className="col-span-2 mb-3">
                <FL id="phone">Nomor HP / WhatsApp Aktif</FL>
                <FI id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" required />
              </div>

              <div className="mb-3">
                <FL id="password">Kata Sandi</FL>
                <div className="relative">
                  <FI id="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter"
                    required minLength={6} className="pr-9" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <FL id="confirmPassword">Konfirmasi Kata Sandi</FL>
                <div className="relative">
                  <FI id="confirmPassword" type={showConfirm ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ketik ulang"
                    required className="pr-9" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100 mt-1 mb-4">
              <ShieldCheck className="w-4 h-4 text-[#1b365d]/50 shrink-0" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Data dienkripsi dan hanya digunakan untuk administrasi resmi Kelurahan Banjar Agung.
              </p>
            </div>

            <Button type="submit" disabled={submitting}
              className="w-full py-2.5 h-auto text-sm font-bold rounded-lg bg-[#1b365d] hover:bg-[#152a48] text-white shadow-md shadow-[#1b365d]/20 transition-all">
              {submitting ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
