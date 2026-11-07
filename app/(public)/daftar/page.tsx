"use client";

/**
 * [HALAMAN USER / WARGA] Pendaftaran Akun Warga Baru
 * Formulir registrasi lengkap data kependudukan dan akun login warga kelurahan.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "@/components/layout/page-banner";
import { useCitizen } from "@/contexts/CitizenContext";

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];

const STATUS_KELUARGA_OPTIONS = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Orang Tua/Mertua",
  "Famili Lain",
];

const STATUS_PENDUDUK_OPTIONS = ["Tetap", "Kontrak", "Pindah"];

const AGAMA_OPTIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya",
];

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

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">— Pilih —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
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
      showSuccess("Akun berhasil dibuat!");
      router.push("/layanan");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageBanner
        pageKey="layanan"
        overrideTitle="Daftar Akun Warga Baru"
        overrideSubtitle="Lengkapi data diri untuk membuat akun layanan kelurahan online."
        overrideBadge="REGISTRASI WARGA"
      />

      <section className="py-12 md:py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1b365d] to-[#2a4a7f] px-6 py-5">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Buat Akun Baru</h2>
                  <p className="text-sm text-white/80">Isi data lengkap sesuai KTP/KK Anda</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              <fieldset className="space-y-4">
                <legend className="text-base font-bold text-[#1b365d] border-b border-slate-200 pb-2 mb-2 w-full">
                  Identitas Pribadi
                </legend>

                <div>
                  <label htmlFor="nik" className="block text-sm font-medium text-slate-700 mb-1.5">
                    NIK (Nomor Induk Kependudukan)
                  </label>
                  <Input
                    id="nik"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{16}"
                    maxLength={16}
                    placeholder="16 digit NIK"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="nama" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <Input
                    id="nama"
                    type="text"
                    placeholder="Sesuai KTP"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    id="gender"
                    label="Jenis Kelamin"
                    value={gender}
                    onChange={setGender}
                    options={GENDER_OPTIONS}
                    required
                  />
                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Tanggal Lahir
                    </label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    id="agama"
                    label="Agama"
                    value={agama}
                    onChange={setAgama}
                    options={AGAMA_OPTIONS}
                    required
                  />
                  <SelectField
                    id="education"
                    label="Pendidikan Terakhir"
                    value={education}
                    onChange={setEducation}
                    options={EDUCATION_OPTIONS}
                    required
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-base font-bold text-[#1b365d] border-b border-slate-200 pb-2 mb-2 w-full">
                  Status Kependudukan
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    id="statusKeluarga"
                    label="Status Keluarga"
                    value={statusKeluarga}
                    onChange={setStatusKeluarga}
                    options={STATUS_KELUARGA_OPTIONS}
                    required
                  />
                  <SelectField
                    id="statusPenduduk"
                    label="Status Penduduk"
                    value={statusPenduduk}
                    onChange={setStatusPenduduk}
                    options={STATUS_PENDUDUK_OPTIONS}
                    required
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-base font-bold text-[#1b365d] border-b border-slate-200 pb-2 mb-2 w-full">
                  Domisili & Pekerjaan
                </legend>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Alamat Lengkap
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    placeholder="Alamat sesuai KTP / domisili saat ini"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                <SelectField
                  id="occupation"
                  label="Pekerjaan"
                  value={occupation}
                  onChange={setOccupation}
                  options={OCCUPATION_OPTIONS}
                  required
                />
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-base font-bold text-[#1b365d] border-b border-slate-200 pb-2 mb-2 w-full">
                  Akun Login
                </legend>

                <div>
                  <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nomor HP / WhatsApp
                  </label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Kata Sandi
                  </label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Konfirmasi Kata Sandi
                  </label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="Ulangi kata sandi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </fieldset>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  Data Anda diamankan dan hanya digunakan untuk keperluan administrasi kelurahan.
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1b365d] hover:bg-[#2a4a7f] text-white h-11 text-base font-semibold rounded-xl"
              >
                {submitting ? "Memproses..." : "Daftar Akun"}
                {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-slate-500">
                Sudah punya akun?{" "}
                <Link href="/masuk" className="text-[#1b365d] font-semibold hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
