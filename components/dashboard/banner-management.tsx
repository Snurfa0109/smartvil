"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Upload, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  Calendar, 
  Eye, 
  ArrowRight,
  UserCheck
} from "lucide-react";
import { 
  BannerPages, 
  PageBannerData, 
  DEFAULT_PAGE_BANNERS, 
  getAllBanners, 
  saveBanner 
} from "@/lib/banners-config";
import { uploadImageToStorage } from "@/lib/uploadImage";

const MENU_LABELS: Record<BannerPages, { title: string; path: string; icon: string }> = {
  beranda: { title: "Beranda", path: "/", icon: "🏠" },
  profil: { title: "Profil", path: "/profil", icon: "🏛️" },
  berita: { title: "Berita", path: "/berita", icon: "📰" },
  data: { title: "Informasi", path: "/data", icon: "📊" },
  layanan: { title: "Layanan Surat", path: "/layanan", icon: "📄" },
  pengaduan: { title: "Pengaduan", path: "/pengaduan", icon: "📣" },
};

// Preset foto formal pemerintahan resmi per menu
const PRESET_PHOTOS: Record<BannerPages, { label: string; url: string; meaning: string }[]> = {
  beranda: [
    {
      label: "Jembatan Aria Wangsakara (Bogeg) HD",
      url: "/images/banner-beranda-bogeg.jpg",
      meaning: "Landmark ikonik kebanggaan Kota Serang dan urat nadi wilayah Cipocok Jaya dengan ornamen batik Banten.",
    },
    {
      label: "Gedung Kantor Balai Pemerintahan",
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=1920&q=85",
      meaning: "Wibawa pusat pemerintahan kelurahan dan keterbukaan balai pelayanan publik.",
    },
  ],
  profil: [
    {
      label: "Panorama Wilayah Kelurahan Asri",
      url: "/images/banner-profil.jpg",
      meaning: "Bentang pemukiman asri, persawahan hijau, dan perbukitan wilayah Banten yang tenteram.",
    },
    {
      label: "Kawasan Pusat Pemerintahan & Wilayah",
      url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=85",
      meaning: "Posisi strategis wilayah Kelurahan Banjar Agung di Kecamatan Cipocok Jaya.",
    },
  ],
  berita: [
    {
      label: "Warta Media & Pers Resmi",
      url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1920&q=85",
      meaning: "Penyebaran informasi yang akurat, terpercaya, dan mencerdaskan masyarakat.",
    },
  ],
  data: [
    {
      label: "Background Tech & Digital Data Grid",
      url: "/images/banner-informasi.jpg",
      meaning: "Latar teknologi minimalis dengan visualisasi node data dan keterbukaan statistik publik.",
    },
  ],
  layanan: [
    {
      label: "Dokumen & Pena Administrasi",
      url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1920&q=85",
      meaning: "Keabsahan hukum surat keterangan, kecepatan verifikasi, dan tertib administrasi bebas calo.",
    },
  ],
  pengaduan: [
    {
      label: "Timbangan Keadilan (Kanan)",
      url: "/images/banner-pengaduan.jpg",
      meaning: "Timbangan keadilan emas di sisi kanan dengan ruang gelap minimalis di sisi kiri untuk kejelasan teks.",
    },
  ],
};

export function BannerManagement() {
  const [banners, setBanners] = useState<Record<BannerPages, PageBannerData>>(DEFAULT_PAGE_BANNERS);
  const [activeMenu, setActiveMenu] = useState<BannerPages>("beranda");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getAllBanners()
      .then((data) => setBanners(data))
      .catch((err) => console.error("Error loading banners in management:", err))
      .finally(() => setLoading(false));
  }, []);

  const currentBanner = banners[activeMenu] || DEFAULT_PAGE_BANNERS[activeMenu];

  const updateCurrent = (patch: Partial<PageBannerData>) => {
    setBanners((prev) => ({
      ...prev,
      [activeMenu]: {
        ...prev[activeMenu],
        ...patch,
      },
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: "imageUrl" | "leader1Photo" | "leader2Photo" = "imageUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMsg(null);
    try {
      const downloadUrl = await uploadImageToStorage(file, "banners");
      updateCurrent({ [targetField]: downloadUrl });
      setStatusMsg({ type: "success", text: "Foto berhasil diunggah! Jangan lupa klik 'Simpan Perubahan Banner' di bawah." });
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatusMsg({ type: "error", text: "Gagal mengunggah gambar. Pastikan ukuran file tidak melebihi 5MB." });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await saveBanner(activeMenu, currentBanner);
      setStatusMsg({
        type: "success",
        text: `Berhasil! Banner menu "${MENU_LABELS[activeMenu].title}" telah diperbarui dan otomatis tampil di website.`,
      });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err: any) {
      console.error("Save error:", err);
      setStatusMsg({ type: "error", text: err.message || "Gagal menyimpan konfigurasi banner." });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm(`Kembalikan banner menu "${MENU_LABELS[activeMenu].title}" ke setelan default resmi?`)) {
      updateCurrent(DEFAULT_PAGE_BANNERS[activeMenu]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Pengantar */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 space-y-3 shadow-lg border border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Pengaturan Visual Halaman &amp; Event</span>
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
          Kelola Banner Menu &amp; Event Kelurahan
        </h2>
        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
          Setiap menu memiliki banner dengan latar belakang foto bermakna dan nuansa resmi. 
          Jika sedang ada acara/event (seperti HUT Kota Serang, Penyaluran Bansos, atau Kerja Bakti), 
          Admin dapat mengaktifkan <strong>Mode Event</strong> dan memasukkan foto serta teks acara sendiri.
        </p>
      </div>

      {/* Alert Status Pesan */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border shadow-xs animate-in fade-in duration-200 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-950 border-emerald-200"
              : "bg-rose-50 text-rose-950 border-rose-200"
          }`}
        >
          <CheckCircle2 className={`h-5 w-5 shrink-0 ${statusMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Navigasi Pilihan Menu (6 Menu) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(Object.keys(MENU_LABELS) as BannerPages[]).map((key) => {
          const item = MENU_LABELS[key];
          const isActive = activeMenu === key;
          const isEvent = banners[key]?.enabledCustom;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMenu(key)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isActive
                  ? "bg-[#1b365d] text-white border-[#1b365d] shadow-md ring-2 ring-[#1b365d]/20"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{item.icon}</span>
                {isEvent && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5" /> Event
                  </span>
                )}
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-slate-900"}`}>
                  {item.title}
                </p>
                <p className={`text-[10px] mt-0.5 truncate ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                  {item.path}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Event / Custom Toggle */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>Mode Tampilan: Menu {MENU_LABELS[activeMenu].title}</span>
                {currentBanner.enabledCustom && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
                    Mode Event Aktif
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Pilih apakah menu ini menampilkan tema visual default resmi atau pengumuman event kustom.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentBanner.enabledCustom}
                  onChange={(e) => updateCurrent({ enabledCustom: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
                <span className="ml-3 text-xs font-bold text-slate-800">
                  {currentBanner.enabledCustom ? "Banner Event Kustom" : "Banner Default Resmi"}
                </span>
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-6">
          
          {/* Form Teks & Identitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="banner-badge" className="text-xs font-semibold">
                Badge / Label Atas
              </Label>
              <Input
                id="banner-badge"
                value={currentBanner.badge}
                onChange={(e) => updateCurrent({ badge: e.target.value })}
                placeholder="Misal: EVENT SPESIAL • KELURAHAN BANJAR AGUNG"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="banner-date" className="text-xs font-semibold">
                Jadwal / Periode Acara (Opsional untuk Event)
              </Label>
              <Input
                id="banner-date"
                value={currentBanner.eventDate || ""}
                onChange={(e) => updateCurrent({ eventDate: e.target.value })}
                placeholder="Misal: 15 - 20 Oktober 2026 atau Setiap Hari Rabu"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner-title" className="text-xs font-semibold">
              Judul Utama Banner
            </Label>
            <Input
              id="banner-title"
              value={currentBanner.title}
              onChange={(e) => updateCurrent({ title: e.target.value })}
              placeholder="Judul besar banner halaman"
              className="text-sm font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner-sub" className="text-xs font-semibold">
              Subjudul / Narasi Lengkap
            </Label>
            <Textarea
              id="banner-sub"
              rows={3}
              value={currentBanner.subtitle}
              onChange={(e) => updateCurrent({ subtitle: e.target.value })}
              placeholder="Deskripsi atau narasi penjelasan event / halaman..."
              className="text-sm"
            />
          </div>

          {/* Pengaturan Tombol Aksi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-700">Tombol Aksi Utama (Kuning Emas)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={currentBanner.actionText || ""}
                  onChange={(e) => updateCurrent({ actionText: e.target.value })}
                  placeholder="Teks Tombol (cth: Lihat Layanan)"
                  className="text-xs"
                />
                <Input
                  value={currentBanner.actionUrl || ""}
                  onChange={(e) => updateCurrent({ actionUrl: e.target.value })}
                  placeholder="Link / URL (cth: /layanan)"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-700">Tombol Aksi Kedua (Gelap Transparan)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={currentBanner.secondaryActionText || ""}
                  onChange={(e) => updateCurrent({ secondaryActionText: e.target.value })}
                  placeholder="Teks Tombol (cth: Pengaduan Online)"
                  className="text-xs"
                />
                <Input
                  value={currentBanner.secondaryActionUrl || ""}
                  onChange={(e) => updateCurrent({ secondaryActionUrl: e.target.value })}
                  placeholder="Link / URL (cth: /pengaduan)"
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Pengaturan Foto Background Penuh */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <Label className="text-sm font-bold text-slate-900 block">
                Foto Latar Belakang Penuh (Full-Bleed Background Photo)
              </Label>
              <p className="text-xs text-slate-500 mt-0.5">
                Foto akan tampil memenuhi seluruh lebar banner dengan efek gradient gelap elegan di sebelah kiri.
              </p>
            </div>

            {/* Unggah File & URL Input */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-4">
                <label className="border-2 border-dashed border-slate-300 hover:border-[#1b365d] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/80">
                  <Upload className="w-5 h-5 text-slate-600 mb-1.5" />
                  <span className="text-xs font-bold text-slate-800">Unggah Foto Baru</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WebP (Maks. 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "imageUrl")}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="md:col-span-8 space-y-1.5">
                <Label htmlFor="banner-img-url" className="text-xs font-semibold text-slate-700">
                  Atau Masukkan Tautan / URL Gambar:
                </Label>
                <Input
                  id="banner-img-url"
                  value={currentBanner.imageUrl}
                  onChange={(e) => updateCurrent({ imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="text-xs font-mono"
                />
                {uploading && (
                  <p className="text-xs text-blue-600 font-medium animate-pulse">
                    Sedang mengunggah foto ke server...
                  </p>
                )}
              </div>
            </div>

            {/* Pilihan Preset Foto Berkualitas Tinggi & Bermakna */}
            {PRESET_PHOTOS[activeMenu] && PRESET_PHOTOS[activeMenu].length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Pilihan Foto Preset Bermakna untuk Menu {MENU_LABELS[activeMenu].title}:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PRESET_PHOTOS[activeMenu].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateCurrent({ imageUrl: preset.url, imageMeaning: preset.meaning })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex gap-3 items-center ${
                        currentBanner.imageUrl === preset.url
                          ? "border-[#1b365d] bg-blue-50/50 ring-1 ring-[#1b365d]"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{preset.label}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2">{preset.meaning}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>



          {/* SIMULASI LIVE PREVIEW PERSIS SEPERTI DI WEBSITE */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Eye className="w-4 h-4 text-[#1b365d]" />
              <span>Simulasi Live Tampilan Banner ({MENU_LABELS[activeMenu].title})</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden min-h-[300px] bg-[#0B1B2B] text-white p-6 sm:p-8 flex items-center border border-slate-800 shadow-inner">
              {/* Image & Gradient */}
              <div className="absolute inset-0 pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B1B2B] via-[#0B1B2B]/90 sm:via-[#0B1B2B]/80 to-transparent" />
              </div>

              {/* Preview Content */}
              <div className="relative z-10 w-full">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{currentBanner.badge}</span>
                    {currentBanner.enabledCustom && currentBanner.eventDate && (
                      <span className="text-rose-300">• {currentBanner.eventDate}</span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                    {currentBanner.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {currentBanner.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentBanner.actionText && (
                      <span className="bg-[#f59e0b] text-slate-950 font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-1.5">
                        {currentBanner.actionText} <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                    {currentBanner.secondaryActionText && (
                      <span className="border border-slate-700 bg-[#0F2236]/90 text-white font-medium px-4 py-2 rounded-lg text-xs">
                        {currentBanner.secondaryActionText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Simpan & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetToDefault}
              className="text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset ke Setelan Default
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1b365d] hover:bg-[#152a48] text-white font-bold text-sm px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Menyimpan ke Server..." : `Simpan Banner ${MENU_LABELS[activeMenu].title}`}
            </Button>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
