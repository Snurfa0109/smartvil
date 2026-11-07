"use client";

/**
 * [HALAMAN USER / WARGA] Masuk Akun Warga
 * Halaman login warga split-screen: form di kiri, foto Jembatan Bogeg di kanan. Responsive mobile.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCitizen } from "@/contexts/CitizenContext";

export default function MasukPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { setCitizen } = useCitizen();
  const { error: showError } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !password) {
      showError("Nomor HP dan kata sandi wajib diisi.");
      return;
    }
    if (password.length < 6) {
      showError("Kata sandi minimal 6 karakter.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/citizen-auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", phone: phone.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login gagal.");
      setCitizen(data.citizen);
      router.push("/layanan");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1b365d] shadow-lg mb-4">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1b365d] leading-tight">Masuk Akun</h1>
            <p className="text-sm text-slate-500 mt-1.5">Gunakan nomor HP dan kata sandi Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nomor HP / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/30 focus:border-[#1b365d] transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/30 focus:border-[#1b365d] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 h-auto text-sm font-bold rounded-xl bg-[#1b365d] hover:bg-[#152a48] text-white shadow-md shadow-[#1b365d]/20 transition-all"
            >
              {submitting ? "Memverifikasi..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Belum punya akun?{" "}
              <Link href="/daftar" className="font-bold text-[#1b365d] hover:text-amber-600 transition-colors">
                Daftar di sini
              </Link>
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <ShieldCheck className="w-5 h-5 text-[#1b365d]/60 shrink-0" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Data Anda dienkripsi dan hanya digunakan untuk keperluan administrasi resmi Kelurahan Banjar Agung.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex relative flex-1 max-w-[55%] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/banner-beranda-bogeg.jpg"
          alt="Jembatan Aria Wangsakara, Landmark Banjar Agung"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1b365d]/90 via-[#1b365d]/60 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-10 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold w-fit mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            PORTAL LAYANAN WARGA
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Layanan Kelurahan<br />Kini di Genggaman Anda
          </h2>
          <p className="text-sm text-white/75 leading-relaxed max-w-sm">
            Ajukan surat keterangan, laporkan aspirasi, dan pantau progress berkas Anda kapan saja dan di mana saja secara digital.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-white/80 font-semibold">
            <span>Belum punya akun?</span>
            <Link href="/daftar" className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors">
              Daftar Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
