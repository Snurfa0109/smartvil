"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Mail, Shield } from "lucide-react";
import { setToken } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Email atau kata sandi tidak sesuai. Silakan coba lagi.");
        setLoading(false);
        return;
      }
      setToken(body.token);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Email atau kata sandi tidak sesuai. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1b2a] via-[#1b365d] to-[#0d1b2a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-kota-serang.png"
            alt="Lambang Kota Serang"
            className="h-16 w-auto object-contain mx-auto mb-4"
          />
          <h1 className="text-white text-xl font-bold">Kelurahan Banjar Agung</h1>
          <p className="text-blue-200 text-xs mt-1">Kecamatan Cipocok Jaya, Kota Serang</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-[#1b365d] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Akses Admin</h2>
                <p className="text-blue-200 text-xs">Panel Manajemen CMS Kelurahan</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Admin</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@banjaragung.go.id"
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:border-[#1b365d] transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:border-[#1b365d] transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#1b365d] hover:bg-[#152a48] disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk ke Dashboard"
                )}
              </button>
            </form>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 text-center">
            <p className="text-[11px] text-slate-500">
              Akses terbatas untuk perangkat Kelurahan Banjar Agung yang berwenang.
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200/50 text-[11px] mt-6">
          © {new Date().getFullYear()} Pemerintah Kelurahan Banjar Agung
        </p>
      </div>
    </div>
  );
}
