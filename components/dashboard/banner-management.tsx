"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Home,
  Building2,
  Newspaper,
  BarChart3,
  FileText,
  Megaphone,
  Upload, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Eye, 
  ArrowRight
} from "lucide-react";
import { 
  BannerPages, 
  PageBannerData, 
  DEFAULT_PAGE_BANNERS, 
  getAllBanners, 
  saveBanner 
} from "@/lib/banners-config";
import { uploadImageToStorage } from "@/lib/uploadImage";

interface MenuItemConfig {
  key: BannerPages;
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: MenuItemConfig[] = [
  { key: "beranda", title: "Beranda", path: "/", icon: Home },
  { key: "profil", title: "Profil", path: "/profil", icon: Building2 },
  { key: "berita", title: "Berita", path: "/berita", icon: Newspaper },
  { key: "data", title: "Informasi", path: "/data", icon: BarChart3 },
  { key: "layanan", title: "Layanan Surat", path: "/layanan", icon: FileText },
  { key: "pengaduan", title: "Pengaduan", path: "/pengaduan", icon: Megaphone },
];

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
      label: "Visualisasi Statistik & Data Terpadu",
      url: "/images/banner-informasi.jpg",
      meaning: "Latar teknologi minimalis dengan visualisasi node data dan keterbukaan statistik publik.",
    },
  ],
  layanan: [
    {
      label: "Dokumen & Administrasi Resmi",
      url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1920&q=85",
      meaning: "Keabsahan hukum surat keterangan, kecepatan verifikasi, dan tertib administrasi bebas pungli.",
    },
  ],
  pengaduan: [
    {
      label: "Keterbukaan & Aspirasi Warga",
      url: "/images/banner-pengaduan.jpg",
      meaning: "Timbangan keadilan dan keterbukaan ruang penampungan saran serta pengaduan masyarakat.",
    },
  ],
};

export function BannerManagement() {
  const [banners, setBanners] = useState<Record<BannerPages, PageBannerData>>(DEFAULT_PAGE_BANNERS);
  const [activeMenu, setActiveMenu] = useState<BannerPages>("beranda");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getAllBanners()
      .then((data) => setBanners(data))
      .catch((err) => console.error("Error loading banners in management:", err));
  }, []);

  const currentBanner = banners[activeMenu] || DEFAULT_PAGE_BANNERS[activeMenu];
  const activeMenuConfig = MENU_ITEMS.find((m) => m.key === activeMenu) || MENU_ITEMS[0];

  const updateCurrent = (patch: Partial<PageBannerData>) => {
    setBanners((prev) => ({
      ...prev,
      [activeMenu]: {
        ...prev[activeMenu],
        ...patch,
      },
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMsg(null);
    try {
      const downloadUrl = await uploadImageToStorage(file, "banners");
      updateCurrent({ imageUrl: downloadUrl });
      setStatusMsg({ type: "success", text: "Foto banner berhasil diunggah. Klik 'Simpan Banner' di bawah untuk menerapkan perubahan." });
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setStatusMsg({ type: "error", text: "Gagal mengunggah foto. Pastikan ukuran file tidak melebihi 5MB." });
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
        text: `Pengaturan banner untuk menu "${activeMenuConfig.title}" berhasil disimpan dan langsung diperbarui di website.`,
      });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err: unknown) {
      console.error("Save error:", err);
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan perubahan banner." });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm(`Kembalikan banner menu "${activeMenuConfig.title}" ke setelan bawaan resmi?`)) {
      updateCurrent(DEFAULT_PAGE_BANNERS[activeMenu]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Clean Standar Admin */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Banner Halaman &amp; Agenda Kegiatan
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola foto tajuk utama, teks pengumuman, dan tombol navigasi untuk masing-masing halaman website kelurahan.
        </p>
      </div>

      {/* Alert Status Notifikasi */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-3 border shadow-2xs transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-950 border-emerald-200"
              : "bg-rose-50 text-rose-950 border-rose-200"
          }`}
        >
          <CheckCircle2 className={`h-4 w-4 shrink-0 ${statusMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Selector Menu Halaman (Clean Tabular Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {MENU_ITEMS.map((item) => {
          const isActive = activeMenu === item.key;
          const isEvent = banners[item.key]?.enabledCustom;
          const IconComponent = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveMenu(item.key)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isActive
                  ? "bg-white border-[#1b365d] shadow-xs ring-1 ring-[#1b365d]/20 text-[#1b365d]"
                  : "bg-white hover:bg-slate-50/80 text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? "bg-[#1b365d]/10 text-[#1b365d]" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                {isEvent && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Agenda
                  </span>
                )}
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isActive ? "text-[#1b365d]" : "text-slate-900"}`}>
                  {item.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {item.path}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Konfigurasi Banner Terpilih */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Konfigurasi: Menu {activeMenuConfig.title}</span>
                {currentBanner.enabledCustom && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Mode Agenda Aktif
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih apakah menu ini menampilkan tema visual standar atau tajuk agenda/kegiatan khusus kelurahan.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentBanner.enabledCustom}
                  onChange={(e) => updateCurrent({ enabledCustom: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1b365d]" />
                <span className="ml-2.5 text-xs font-semibold text-slate-800">
                  {currentBanner.enabledCustom ? "Agenda Khusus Aktif" : "Tampilan Standar"}
                </span>
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-6">
          {/* Form Teks & Identitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="banner-badge" className="text-xs font-semibold text-slate-700">
                Label / Kategori Atas
              </Label>
              <Input
                id="banner-badge"
                value={currentBanner.badge}
                onChange={(e) => updateCurrent({ badge: e.target.value })}
                placeholder="Contoh: KELURAHAN BANJAR AGUNG"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="banner-date" className="text-xs font-semibold text-slate-700">
                Jadwal / Keterangan Waktu (Opsional)
              </Label>
              <Input
                id="banner-date"
                value={currentBanner.eventDate || ""}
                onChange={(e) => updateCurrent({ eventDate: e.target.value })}
                placeholder="Contoh: Periode 2026 atau Setiap Hari Kerja"
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner-title" className="text-xs font-semibold text-slate-700">
              Judul Utama Banner
            </Label>
            <Input
              id="banner-title"
              value={currentBanner.title}
              onChange={(e) => updateCurrent({ title: e.target.value })}
              placeholder="Judul tajuk halaman..."
              className="text-sm font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner-sub" className="text-xs font-semibold text-slate-700">
              Deskripsi / Subjudul
            </Label>
            <Textarea
              id="banner-sub"
              rows={3}
              value={currentBanner.subtitle}
              onChange={(e) => updateCurrent({ subtitle: e.target.value })}
              placeholder="Penjelasan ringkas mengenai halaman atau agenda terkait..."
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Pengaturan Tombol Aksi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Tombol Aksi Utama</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={currentBanner.actionText || ""}
                  onChange={(e) => updateCurrent({ actionText: e.target.value })}
                  placeholder="Teks (cth: Ajukan Surat)"
                  className="text-xs"
                />
                <Input
                  value={currentBanner.actionUrl || ""}
                  onChange={(e) => updateCurrent({ actionUrl: e.target.value })}
                  placeholder="Tautan (cth: /layanan)"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Tombol Aksi Sekunder (Opsional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={currentBanner.secondaryActionText || ""}
                  onChange={(e) => updateCurrent({ secondaryActionText: e.target.value })}
                  placeholder="Teks (cth: Pengaduan)"
                  className="text-xs"
                />
                <Input
                  value={currentBanner.secondaryActionUrl || ""}
                  onChange={(e) => updateCurrent({ secondaryActionUrl: e.target.value })}
                  placeholder="Tautan (cth: /pengaduan)"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pengaturan Foto Background */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-900 block">
                Foto Latar Belakang Banner
              </Label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Foto akan tampil memenuhi tajuk halaman dengan lapisan overlay resmi agar teks tetap terbaca dengan jelas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4">
                <label className="border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/70">
                  <Upload className="w-4 h-4 text-slate-500 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Unggah Foto Baru</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP (Maks. 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="md:col-span-8 space-y-1">
                <Label htmlFor="banner-img-url" className="text-xs text-slate-600">
                  Atau masukkan URL gambar:
                </Label>
                <Input
                  id="banner-img-url"
                  value={currentBanner.imageUrl}
                  onChange={(e) => updateCurrent({ imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="text-xs font-mono"
                />
                {uploading && (
                  <p className="text-xs text-blue-600 font-medium">
                    Mengunggah foto ke penyimpanan...
                  </p>
                )}
              </div>
            </div>

            {/* Pilihan Foto Bawaan Resmi */}
            {PRESET_PHOTOS[activeMenu] && PRESET_PHOTOS[activeMenu].length > 0 && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-medium text-slate-600">
                  Pilihan Foto Rekomendasi Menu {activeMenuConfig.title}:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_PHOTOS[activeMenu].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateCurrent({ imageUrl: preset.url, imageMeaning: preset.meaning })}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex gap-2.5 items-center ${
                        currentBanner.imageUrl === preset.url
                          ? "border-[#1b365d] bg-slate-50 ring-1 ring-[#1b365d]"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{preset.label}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{preset.meaning}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pratinjau Tampilan di Website */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Eye className="w-3.5 h-3.5 text-[#1b365d]" />
              <span>Pratinjau Tampilan ({activeMenuConfig.title})</span>
            </div>

            <div className="relative rounded-xl overflow-hidden min-h-[220px] bg-[#0B1B2B] text-white p-6 sm:p-7 flex items-center border border-slate-800 shadow-inner">
              <div className="absolute inset-0 pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B1B2B] via-[#0B1B2B]/90 sm:via-[#0B1B2B]/80 to-transparent" />
              </div>

              <div className="relative z-10 w-full">
                <div className="max-w-xl space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{currentBanner.badge}</span>
                    {currentBanner.enabledCustom && currentBanner.eventDate && (
                      <span className="text-rose-300">• {currentBanner.eventDate}</span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {currentBanner.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {currentBanner.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentBanner.actionText && (
                      <span className="bg-[#f59e0b] text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1">
                        {currentBanner.actionText} <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                    {currentBanner.secondaryActionText && (
                      <span className="border border-slate-700 bg-[#0F2236]/90 text-white font-medium px-3 py-1.5 rounded-lg text-xs">
                        {currentBanner.secondaryActionText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Aksi Simpan & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              className="text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Atur Ulang ke Default
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold text-xs px-5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Menyimpan..." : `Simpan Banner ${activeMenuConfig.title}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
