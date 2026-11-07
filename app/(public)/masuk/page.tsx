"use client";

/**
 * [HALAMAN USER / WARGA] Masuk Akun Warga
 * Formulir login warga dengan nomor HP dan kata sandi untuk mengakses layanan kelurahan.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Phone, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "@/components/layout/page-banner";
import { useCitizen } from "@/contexts/CitizenContext";

export default function MasukPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
    <>
      <PageBanner
        pageKey="layanan"
        overrideTitle="Masuk Akun Warga"
        overrideSubtitle="Login untuk mengakses layanan permohonan surat dan pengaduan online."
        overrideBadge="PORTAL LAYANAN WARGA"
      />

      <section className="py-12 md:py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1b365d] to-[#2a4a7f] px-6 py-5">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Masuk Akun</h2>
                  <p className="text-sm text-white/80">Gunakan nomor HP dan kata sandi Anda</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nomor HP / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1b365d] hover:bg-[#2a4a7f] text-white h-11 text-base font-semibold rounded-xl"
              >
                {submitting ? "Memproses..." : "Masuk"}
                {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-slate-500">
                Belum punya akun?{" "}
                <Link href="/daftar" className="text-[#1b365d] font-semibold hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
