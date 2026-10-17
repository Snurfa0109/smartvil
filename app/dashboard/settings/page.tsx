"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Database,
  Bot,
  User,
  KeyRound,
  CheckCircle,
  Building,
  Home,
  PhoneCall,
  MapPin,
  Tag,
  Plus,
  Trash2,
  GripVertical,
  BookOpen,
  Landmark,
  Globe,
  Clock,
  Shield,
  Mail,
  FileText,
  Sparkles,
  Camera,
  Compass,
} from "lucide-react";
import { BannerManagement } from "@/components/dashboard/banner-management";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImageToStorage } from "@/lib/uploadImage";
import { getToken } from "@/lib/api";
import { DEFAULT_CHATBOT_SETTINGS, ChatbotSettings, getChatbotSettings, saveChatbotSettings } from "@/lib/chatbot-config";
import {
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
  saveSiteSettings,
  invalidateSiteSettings,
  getBeritaCategories,
  saveBeritaCategories,
  DEFAULT_BERITA_CATEGORIES,
} from "@/lib/site-config";
import { useToast } from "@/components/ui/toast";
import { usePolling } from "@/hooks/use-polling";

function SettingsContent() {
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();
  const { success, error: showError, confirm: showConfirm } = useToast();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [siteForm, setSiteForm] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [siteLoading, setSiteLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [siteMsg, setSiteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  const [chatbotForm, setChatbotForm] = useState<ChatbotSettings>(DEFAULT_CHATBOT_SETTINGS);
  const [savingChatbot, setSavingChatbot] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(true);

  const [accountName, setAccountName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [beritaCategories, setBeritaCategories] = useState<string[]>(DEFAULT_BERITA_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editingCategoryVal, setEditingCategoryVal] = useState("");
  const [savingCategories, setSavingCategories] = useState(false);
  const [categoryMsg, setCategoryMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const siteFormDirtyRef = useRef(false);
  const chatbotFormDirtyRef = useRef(false);
  const beritaCategoriesFormDirtyRef = useRef(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const loadData = useCallback(async () => {
    try {
      const config = await getSiteSettings();
      if (!siteFormDirtyRef.current) {
        setSiteForm(config);
      }
    } catch (err) {
      console.error("Error loading site settings:", err);
    } finally {
      setSiteLoading(false);
    }

    try {
      const config = await getChatbotSettings();
      if (!chatbotFormDirtyRef.current) {
        setChatbotForm((prev) => ({ ...prev, ...config }));
      }
    } catch (err) {
      console.error("Error loading chatbot settings:", err);
    } finally {
      setChatbotLoading(false);
    }

    try {
      const cats = await getBeritaCategories();
      if (cats && cats.length > 0 && !beritaCategoriesFormDirtyRef.current) {
        setBeritaCategories(cats);
      }
    } catch (err) {
      console.error("Error loading berita categories:", err);
    }
  }, []);

  useEffect(() => {
    loadData();

    if (authUser?.displayName) {
      setAccountName(authUser.displayName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePolling(loadData, 30_000);

  const handleSaveSite = async (sectionName = "Pengaturan") => {
    setSavingSite(true);
    setSiteMsg(null);
    try {
      await saveSiteSettings(siteForm);
      invalidateSiteSettings();
      siteFormDirtyRef.current = false;
      setSiteMsg({
        type: "success",
        text: `Berhasil! ${sectionName} telah diperbarui dan otomatis tampil di halaman website.`,
      });
      setTimeout(() => setSiteMsg(null), 6000);
    } catch (err: unknown) {
      console.error("Error saving site settings:", err);
      setSiteMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan perubahan ke database.",
      });
    } finally {
      setSavingSite(false);
    }
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof SiteSettings
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = field as string;
    setUploadingPhoto(key);
    try {
      const url = await uploadImageToStorage(file, "aparatur");
      setSiteForm((p) => ({ ...p, [field]: url }));
      siteFormDirtyRef.current = true;
    } catch (err) {
      console.error("Photo upload error:", err);
      showError("Gagal mengunggah foto. Pastikan file tidak melebihi 5MB.");
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleSaveChatbot = async () => {
    try {
      setSavingChatbot(true);
      await saveChatbotSettings({
        ...chatbotForm,
        updatedAt: new Date().toISOString(),
      });
      success("Pengaturan Chatbot AI berhasil disimpan!");
      chatbotFormDirtyRef.current = false;
    } catch (error) {
      console.error("Error saving chatbot settings:", error);
      showError("Gagal menyimpan pengaturan chatbot.");
    } finally {
      setSavingChatbot(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    
    if (!authUser) {
      setAccountMsg({ type: "error", text: "Sesi login tidak ditemukan. Silakan login kembali." });
      return;
    }

    setSavingAccount(true);
    try {
      const updates: Record<string, unknown> = {};
      
      if (accountName.trim() && accountName !== authUser.displayName) {
        updates.display_name = accountName.trim();
      }

      if (newPassword) {
        if (newPassword.length < 12) {
          throw new Error("Password baru minimal harus 12 karakter.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("Konfirmasi password tidak cocok.");
        }
        updates.password = newPassword;
      }

      if (Object.keys(updates).length > 0) {
        const token = getToken();
        const res = await fetch(`/api/admins`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ uid: authUser.uid, ...updates }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal memperbarui profil.");
        }
        
        if (newPassword) {
          setNewPassword("");
          setConfirmPassword("");
        }
      }

      setAccountMsg({ type: "success", text: "Informasi profil akun & kata sandi berhasil diperbarui!" });
    } catch (err: unknown) {
      console.error("Error updating account:", err);
      setAccountMsg({ type: "error", text: err instanceof Error ? err.message : "Gagal memperbarui akun." });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSeed = async () => {
    const confirmed = await showConfirm({
      title: "Isi Database Dummy?",
      message: "Apakah anda yakin ingin mengisi database dengan data dummy? Ini akan menambahkan data baru.",
      variant: "danger",
      confirmLabel: "Ya, Isi Data",
    });
    if (confirmed) {
      setSeeding(true);
      try {
        const token = getToken();
        const res = await fetch("/api/seed", { 
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mengisi database.");
        success("Database berhasil diisi:\n" + (data.logs || []).join("\n"));
      } catch (err: unknown) {
        console.error("Seed error:", err);
        showError("Gagal mengisi database: " + (err instanceof Error ? err.message : "Unknown error"));
      } finally {
        setSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-md shadow-[#1b365d]/15">
            <SettingsIcon className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pengaturan & Konten</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Kelola profil kelurahan, beranda, kontak, dan chatbot
            </p>
          </div>
        </div>
      </div>

      {siteMsg && (
        <div
          className={`p-3 rounded-xl text-[11px] font-bold flex items-center gap-2 border ${
            siteMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <CheckCircle className={`h-4 w-4 shrink-0 ${siteMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span>{siteMsg.text}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-slate-100 p-0.5 flex flex-wrap h-auto gap-0.5 border border-slate-200/70 rounded-xl">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#1b365d] data-[state=active]:shadow-sm rounded-lg font-bold text-[11px]">
            <Building className="h-3.5 w-3.5" /> Profil
          </TabsTrigger>
          <TabsTrigger value="home" className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#1b365d] data-[state=active]:shadow-sm rounded-lg font-bold text-[11px]">
            <Home className="h-3.5 w-3.5" /> Beranda
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#1b365d] data-[state=active]:shadow-sm rounded-lg font-bold text-[11px]">
            <PhoneCall className="h-3.5 w-3.5" /> Kontak
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#1b365d] data-[state=active]:shadow-sm rounded-lg font-bold text-[11px]">
            <Tag className="h-3.5 w-3.5" /> Kategori
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#1b365d] data-[state=active]:shadow-sm rounded-lg font-bold text-[11px]">
            <Bot className="h-3.5 w-3.5" /> Chatbot
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#1b365d] data-[state=active]:shadow-sm rounded-lg font-bold text-[11px]">
            <User className="h-3.5 w-3.5" /> Akun
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#1b365d] data-[state=active]:shadow-sm rounded-lg font-bold text-[11px]">
            <Database className="h-3.5 w-3.5" /> Sistem
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#1b365d] data-[state=active]:shadow-sm rounded-lg font-bold text-[11px]">
            <Sparkles className="h-3.5 w-3.5" /> Banner
          </TabsTrigger>

        </TabsList>
        <TabsContent value="profile" className="space-y-6" onInputCapture={() => { siteFormDirtyRef.current = true; }}>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Judul Halaman Profil</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Judul & subjudul di bagian atas halaman <code className="bg-slate-100 px-1 rounded text-[9px]">/profil</code>
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prof-title">Judul Halaman Profil</Label>
                <Input
                  id="prof-title"
                  value={siteForm.title}
                  onChange={(e) => setSiteForm((p) => ({ ...p, title: e.target.value }))}
                  disabled={siteLoading}
                  placeholder="Contoh: Profil Kelurahan Banjar Agung"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prof-subtitle">Subjudul & Deskripsi Singkat</Label>
                <Input
                  id="prof-subtitle"
                  value={siteForm.subtitle}
                  onChange={(e) => setSiteForm((p) => ({ ...p, subtitle: e.target.value }))}
                  disabled={siteLoading}
                  placeholder="Deskripsi wilayah kecamatan & kota"
                />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Sejarah, Visi & Misi</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Narasi sejarah, visi jangka panjang, dan poin-poin misi kelurahan.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="prof-history">Narasi Sejarah Kelurahan</Label>
                <Textarea
                  id="prof-history"
                  rows={5}
                  value={siteForm.history}
                  onChange={(e) => setSiteForm((p) => ({ ...p, history: e.target.value }))}
                  disabled={siteLoading}
                  placeholder="Tuliskan latar belakang sejarah..."
                />
                <p className="text-xs text-slate-500">Pisahkan paragraf dengan baris baru (enter ganda).</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prof-vision">Visi Kelurahan</Label>
                <Textarea
                  id="prof-vision"
                  rows={3}
                  value={siteForm.vision}
                  onChange={(e) => setSiteForm((p) => ({ ...p, vision: e.target.value }))}
                  disabled={siteLoading}
                  placeholder="Visi kelurahan..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prof-mission">Misi Kelurahan</Label>
                <Textarea
                  id="prof-mission"
                  rows={5}
                  value={siteForm.mission}
                  onChange={(e) => setSiteForm((p) => ({ ...p, mission: e.target.value }))}
                  disabled={siteLoading}
                  placeholder="Poin misi kelurahan (1 poin per baris)..."
                />
                <p className="text-xs text-slate-500">Tuliskan setiap poin misi pada baris baru (enter). Otomatis diformat sebagai daftar berpoin di web.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <Landmark className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Struktur Organisasi & Aparatur</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Nama, jabatan, dan foto resmi pejabat kelurahan.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-5">
              <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-[#1b365d] space-y-4 shadow-sm">
                <div className="font-bold text-sm text-[#1b365d] flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#1b365d]/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-[#1b365d]" />
                  </div>
                  Kepala Kelurahan (Lurah)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="flex flex-col items-center gap-2.5">
                    {siteForm.headPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={siteForm.headPhoto} alt="Lurah" className="w-24 h-24 rounded-2xl object-cover border-2 border-[#1b365d]/20 shadow-sm" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
                        <Camera className="h-6 w-6" />
                        <span className="text-[9px] font-medium">Foto Lurah</span>
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="text-[10px] px-3 py-1.5 bg-[#1b365d] text-white rounded-lg hover:bg-[#152a48] transition-colors font-bold shadow-sm">
                        {uploadingPhoto === "headPhoto" ? "Mengunggah..." : "Unggah Foto"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, "headPhoto")} disabled={siteLoading || uploadingPhoto !== null} />
                    </label>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="head-name">Nama Lengkap & Gelar</Label>
                      <Input id="head-name" value={siteForm.headName} onChange={(e) => setSiteForm((p) => ({ ...p, headName: e.target.value }))} disabled={siteLoading} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="head-title">Jabatan Resmi</Label>
                      <Input id="head-title" value={siteForm.headTitle} onChange={(e) => setSiteForm((p) => ({ ...p, headTitle: e.target.value }))} disabled={siteLoading} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="head-nip">NIP (untuk tanda tangan surat)</Label>
                      <Input id="head-nip" value={siteForm.headNip} onChange={(e) => setSiteForm((p) => ({ ...p, headNip: e.target.value }))} disabled={siteLoading} placeholder="19780512 200501 1 004" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-blue-500 space-y-4 shadow-sm">
                <div className="font-bold text-sm text-blue-700 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Sekretaris Kelurahan (Seklur)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="flex flex-col items-center gap-2.5">
                    {siteForm.secretaryPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={siteForm.secretaryPhoto} alt="Seklur" className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-200 shadow-sm" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
                        <Camera className="h-6 w-6" />
                        <span className="text-[9px] font-medium">Foto Seklur</span>
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="text-[10px] px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm">
                        {uploadingPhoto === "secretaryPhoto" ? "Mengunggah..." : "Unggah Foto"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, "secretaryPhoto")} disabled={siteLoading || uploadingPhoto !== null} />
                    </label>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="sec-name">Nama Lengkap & Gelar</Label>
                      <Input id="sec-name" value={siteForm.secretaryName} onChange={(e) => setSiteForm((p) => ({ ...p, secretaryName: e.target.value }))} disabled={siteLoading} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sec-title">Jabatan Resmi</Label>
                      <Input id="sec-title" value={siteForm.secretaryTitle} onChange={(e) => setSiteForm((p) => ({ ...p, secretaryTitle: e.target.value }))} disabled={siteLoading} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-emerald-500 space-y-3 shadow-sm">
                  <div className="font-bold text-sm text-emerald-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    Kasi Pemerintahan & Trantib
                  </div>
                  <div className="flex items-center gap-3">
                    {siteForm.kasiPemerintahanPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={siteForm.kasiPemerintahanPhoto} alt="Kasi" className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-200 shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-slate-50">
                        <Camera className="h-4 w-4" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="text-[10px] px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm">
                        {uploadingPhoto === "kasiPemerintahanPhoto" ? "..." : "Unggah"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, "kasiPemerintahanPhoto")} disabled={siteLoading || uploadingPhoto !== null} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kasi-pem-name">Nama Lengkap & Gelar</Label>
                    <Input id="kasi-pem-name" value={siteForm.kasiPemerintahanName} onChange={(e) => setSiteForm((p) => ({ ...p, kasiPemerintahanName: e.target.value }))} disabled={siteLoading} />
                    <Label htmlFor="kasi-pem-title">Jabatan</Label>
                    <Input id="kasi-pem-title" value={siteForm.kasiPemerintahanTitle} onChange={(e) => setSiteForm((p) => ({ ...p, kasiPemerintahanTitle: e.target.value }))} disabled={siteLoading} />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-amber-500 space-y-3 shadow-sm">
                  <div className="font-bold text-sm text-amber-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    Kasi Pelayanan Umum
                  </div>
                  <div className="flex items-center gap-3">
                    {siteForm.kasiPelayananPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={siteForm.kasiPelayananPhoto} alt="Kasi" className="w-16 h-16 rounded-xl object-cover border-2 border-amber-200 shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-slate-50">
                        <Camera className="h-4 w-4" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="text-[10px] px-2.5 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold shadow-sm">
                        {uploadingPhoto === "kasiPelayananPhoto" ? "..." : "Unggah"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, "kasiPelayananPhoto")} disabled={siteLoading || uploadingPhoto !== null} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kasi-pel-name">Nama Lengkap & Gelar</Label>
                    <Input id="kasi-pel-name" value={siteForm.kasiPelayananName} onChange={(e) => setSiteForm((p) => ({ ...p, kasiPelayananName: e.target.value }))} disabled={siteLoading} />
                    <Label htmlFor="kasi-pel-title">Jabatan</Label>
                    <Input id="kasi-pel-title" value={siteForm.kasiPelayananTitle} onChange={(e) => setSiteForm((p) => ({ ...p, kasiPelayananTitle: e.target.value }))} disabled={siteLoading} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <Building className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Fasilitas & Pemukiman Utama</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  3 fasilitas utama yang disorot pada halaman profil.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-[#1b365d] space-y-3 shadow-sm">
                  <Label className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#1b365d] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                    Fasilitas / Wilayah
                  </Label>
                  <Input
                    placeholder="Judul Fasilitas 1"
                    value={siteForm.facility1Title}
                    onChange={(e) => setSiteForm((p) => ({ ...p, facility1Title: e.target.value }))}
                    disabled={siteLoading}
                  />
                  <Textarea
                    rows={3}
                    placeholder="Deskripsi ringkas..."
                    value={siteForm.facility1Desc}
                    onChange={(e) => setSiteForm((p) => ({ ...p, facility1Desc: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-blue-500 space-y-3 shadow-sm">
                  <Label className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                    Fasilitas / Wilayah
                  </Label>
                  <Input
                    placeholder="Judul Fasilitas 2"
                    value={siteForm.facility2Title}
                    onChange={(e) => setSiteForm((p) => ({ ...p, facility2Title: e.target.value }))}
                    disabled={siteLoading}
                  />
                  <Textarea
                    rows={3}
                    placeholder="Deskripsi ringkas..."
                    value={siteForm.facility2Desc}
                    onChange={(e) => setSiteForm((p) => ({ ...p, facility2Desc: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-emerald-500 space-y-3 shadow-sm">
                  <Label className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                    Fasilitas / Wilayah
                  </Label>
                  <Input
                    placeholder="Judul Fasilitas 3"
                    value={siteForm.facility3Title}
                    onChange={(e) => setSiteForm((p) => ({ ...p, facility3Title: e.target.value }))}
                    disabled={siteLoading}
                  />
                  <Textarea
                    rows={3}
                    placeholder="Deskripsi ringkas..."
                    value={siteForm.facility3Desc}
                    onChange={(e) => setSiteForm((p) => ({ ...p, facility3Desc: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Geografis & Batas Wilayah</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Luas wilayah, koordinat, dan batas administratif kelurahan.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="geo-area">Luas Wilayah</Label>
                  <Input
                    id="geo-area"
                    value={siteForm.geoArea}
                    onChange={(e) => setSiteForm((p) => ({ ...p, geoArea: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="Contoh: 348 Ha"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="geo-coord">Titik Koordinat</Label>
                  <Input
                    id="geo-coord"
                    value={siteForm.geoCoord}
                    onChange={(e) => setSiteForm((p) => ({ ...p, geoCoord: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="Contoh: 6Â°7â€²25â€³S 106Â°11â€²54â€³E"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="geo-area-desc">Keterangan Wilayah</Label>
                  <Input
                    id="geo-area-desc"
                    value={siteForm.geoAreaDesc}
                    onChange={(e) => setSiteForm((p) => ({ ...p, geoAreaDesc: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="geo-coord-desc">Keterangan Koordinat</Label>
                  <Input
                    id="geo-coord-desc"
                    value={siteForm.geoCoordDesc}
                    onChange={(e) => setSiteForm((p) => ({ ...p, geoCoordDesc: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                  <Compass className="h-3.5 w-3.5" /> Batas Wilayah Administratif
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="b-north" className="text-xs flex items-center gap-1">
                      <span className="text-[10px]">↑</span> Batas Utara
                    </Label>
                    <Input
                      id="b-north"
                      value={siteForm.boundaryNorth}
                      onChange={(e) => setSiteForm((p) => ({ ...p, boundaryNorth: e.target.value }))}
                      disabled={siteLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-south" className="text-xs flex items-center gap-1">
                      <span className="text-[10px]">↓</span> Batas Selatan
                    </Label>
                    <Input
                      id="b-south"
                      value={siteForm.boundarySouth}
                      onChange={(e) => setSiteForm((p) => ({ ...p, boundarySouth: e.target.value }))}
                      disabled={siteLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-east" className="text-xs flex items-center gap-1">
                      <span className="text-[10px]">→</span> Batas Timur
                    </Label>
                    <Input
                      id="b-east"
                      value={siteForm.boundaryEast}
                      onChange={(e) => setSiteForm((p) => ({ ...p, boundaryEast: e.target.value }))}
                      disabled={siteLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-west" className="text-xs flex items-center gap-1">
                      <span className="text-[10px]">←</span> Batas Barat
                    </Label>
                    <Input
                      id="b-west"
                      value={siteForm.boundaryWest}
                      onChange={(e) => setSiteForm((p) => ({ ...p, boundaryWest: e.target.value }))}
                      disabled={siteLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Identitas & Kode Wilayah</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Kode Kemendagri, kode pos, dan Google Maps.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kemendagri-code">Kode Wilayah Kemendagri</Label>
                  <Input
                    id="kemendagri-code"
                    value={siteForm.kemendagriCode}
                    onChange={(e) => setSiteForm((p) => ({ ...p, kemendagriCode: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="Contoh: 36.73.05.1004"
                  />
                  <p className="text-[11px] text-slate-500">Kode Kemendagri resmi Kelurahan (format: XX.XX.XX.XXXX).</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal-code">Kode Pos</Label>
                  <Input
                    id="postal-code"
                    value={siteForm.postalCode}
                    onChange={(e) => setSiteForm((p) => ({ ...p, postalCode: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="Contoh: 42122"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maps-url">Tautan Google Maps (URL Langsung)</Label>
                <Input
                  id="maps-url"
                  value={siteForm.googleMapsUrl}
                  onChange={(e) => setSiteForm((p) => ({ ...p, googleMapsUrl: e.target.value }))}
                  disabled={siteLoading}
                  placeholder="https://maps.google.com/?q=Kelurahan+Banjar+Agung"
                />
                <p className="text-[11px] text-slate-500">Tautan ini digunakan untuk tombol &quot;Buka di Google Maps&quot; di footer.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maps-embed">Kode Embed Google Maps (iframe src)</Label>
                <Textarea
                  id="maps-embed"
                  rows={3}
                  value={siteForm.googleMapsEmbed}
                  onChange={(e) => setSiteForm((p) => ({ ...p, googleMapsEmbed: e.target.value }))}
                  disabled={siteLoading}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Buka Google Maps â†’ Bagikan â†’ Sematkan Peta â†’ Salin URL dari atribut <code>src</code> pada kode iframe.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleSaveSite("Profil Kelurahan")}
            disabled={savingSite || siteLoading}
            className="w-full bg-gradient-to-r from-[#1b365d] to-[#264478] hover:from-[#152a48] hover:to-[#1b365d] text-white font-bold rounded-xl shadow-md shadow-[#1b365d]/15 h-12 text-sm transition-all duration-200"
          >
            <Save className="mr-2 h-4 w-4" />
            {savingSite ? "Menyimpan..." : "Simpan Profil Kelurahan"}
          </Button>
        </TabsContent>
        <TabsContent value="home" className="space-y-6" onInputCapture={() => { siteFormDirtyRef.current = true; }}>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <Home className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Teks Hero Beranda Utama</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Teks yang dilihat pertama kali oleh warga saat membuka halaman depan website.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="hero-badge">Badge Label Atas</Label>
                <Input
                  id="hero-badge"
                  value={siteForm.heroBadge}
                  onChange={(e) => setSiteForm((p) => ({ ...p, heroBadge: e.target.value }))}
                  disabled={siteLoading}
                  placeholder="Contoh: Portal Resmi Pelayanan Kelurahan Banjar Agung"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-title">Judul Utama Hero (Heading)</Label>
                <Input
                  id="hero-title"
                  value={siteForm.heroTitle}
                  onChange={(e) => setSiteForm((p) => ({ ...p, heroTitle: e.target.value }))}
                  disabled={siteLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-desc">Subjudul & Narasi Penjelas</Label>
                <Textarea
                  id="hero-desc"
                  rows={3}
                  value={siteForm.heroSubtitle}
                  onChange={(e) => setSiteForm((p) => ({ ...p, heroSubtitle: e.target.value }))}
                  disabled={siteLoading}
                />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Status & Jadwal Loket Pelayanan</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Atur status buka/tutup loket serta jam kerja pelayanan administrasi di kantor kelurahan.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="counter-status">Status Loket Saat Ini</Label>
                  <select
                    id="counter-status"
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d]"
                    value={siteForm.counterStatus}
                    onChange={(e) => setSiteForm((p) => ({ ...p, counterStatus: e.target.value }))}
                    disabled={siteLoading}
                  >
                    <option value="Buka">Buka (Hijau - Sedang Melayani)</option>
                    <option value="Tutup">Tutup (Amber/Merah - Di Luar Jam Kerja)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="counter-hours">Jam Operasional</Label>
                  <Input
                    id="counter-hours"
                    value={siteForm.counterHours}
                    onChange={(e) => setSiteForm((p) => ({ ...p, counterHours: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="Contoh: 08:00 - 15:30 WIB"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="counter-days">Hari Kerja</Label>
                  <Input
                    id="counter-days"
                    value={siteForm.counterDays}
                    onChange={(e) => setSiteForm((p) => ({ ...p, counterDays: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="Contoh: Senin - Jumat"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-sm">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Kontak Darurat Wilayah Terpadu</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Nomor hotline medis dan keamanan darurat yang tampil di kartu biru beranda serta footer website.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="em-hotline" className="text-red-700 font-semibold">Hotline Bebas Pulsa (112)</Label>
                  <Input
                    id="em-hotline"
                    value={siteForm.emergencyHotline}
                    onChange={(e) => setSiteForm((p) => ({ ...p, emergencyHotline: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="em-puskesmas">Puskesmas Banjar Agung</Label>
                  <Input
                    id="em-puskesmas"
                    value={siteForm.emergencyPuskesmas}
                    onChange={(e) => setSiteForm((p) => ({ ...p, emergencyPuskesmas: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="em-polsek">Polsek Cipocok Jaya (Bhabinkamtibmas)</Label>
                  <Input
                    id="em-polsek"
                    value={siteForm.emergencyPolsek}
                    onChange={(e) => setSiteForm((p) => ({ ...p, emergencyPolsek: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="em-koramil">Koramil Cipocok Jaya (Babinsa)</Label>
                  <Input
                    id="em-koramil"
                    value={siteForm.emergencyKoramil}
                    onChange={(e) => setSiteForm((p) => ({ ...p, emergencyKoramil: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="em-damkar">Damkar & BPBD Kota Serang</Label>
                  <Input
                    id="em-damkar"
                    value={siteForm.emergencyDamkar}
                    onChange={(e) => setSiteForm((p) => ({ ...p, emergencyDamkar: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleSaveSite("Beranda & Loket")}
            disabled={savingSite || siteLoading}
            className="w-full bg-gradient-to-r from-[#1b365d] to-[#264478] hover:from-[#152a48] hover:to-[#1b365d] text-white font-bold rounded-xl shadow-md shadow-[#1b365d]/15 h-12 text-sm transition-all duration-200"
          >
            <Save className="mr-2 h-4 w-4" />
            {savingSite ? "Menyimpan..." : "Simpan Beranda & Loket"}
          </Button>
        </TabsContent>
        <TabsContent value="contact" className="space-y-6" onInputCapture={() => { siteFormDirtyRef.current = true; }}>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Kontak Resmi & Media Sosial</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Informasi ini otomatis tampil di footer seluruh halaman, navigasi, dan informasi kontak publik.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vil-name">Nama Instansi / Kelurahan</Label>
                  <Input
                    id="vil-name"
                    value={siteForm.villageName}
                    onChange={(e) => setSiteForm((p) => ({ ...p, villageName: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vil-phone">Nomor Telepon / WhatsApp Resmi</Label>
                  <Input
                    id="vil-phone"
                    value={siteForm.villagePhone}
                    onChange={(e) => setSiteForm((p) => ({ ...p, villagePhone: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="Contoh: 0813-1505-3901"
                  />
                  <p className="text-[11px] text-slate-500">Nomor ini terhubung langsung ke tombol WhatsApp di footer.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vil-email">Email Resmi Kantor</Label>
                  <Input
                    id="vil-email"
                    type="email"
                    value={siteForm.villageEmail}
                    onChange={(e) => setSiteForm((p) => ({ ...p, villageEmail: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vil-address">Alamat Lengkap Kantor Kelurahan</Label>
                  <Input
                    id="vil-address"
                    value={siteForm.villageAddress}
                    onChange={(e) => setSiteForm((p) => ({ ...p, villageAddress: e.target.value }))}
                    disabled={siteLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ig-url">Tautan Instagram Resmi</Label>
                  <Input
                    id="ig-url"
                    value={siteForm.instagramUrl}
                    onChange={(e) => setSiteForm((p) => ({ ...p, instagramUrl: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="https://www.instagram.com/kel.banjaragung/"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lt-url">Tautan Linktree / Portal Terkait</Label>
                  <Input
                    id="lt-url"
                    value={siteForm.linktreeUrl}
                    onChange={(e) => setSiteForm((p) => ({ ...p, linktreeUrl: e.target.value }))}
                    disabled={siteLoading}
                    placeholder="https://linktr.ee/kelurahanbanjaragung"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleSaveSite("Kontak & Media Sosial")}
            disabled={savingSite || siteLoading}
            className="w-full bg-gradient-to-r from-[#1b365d] to-[#264478] hover:from-[#152a48] hover:to-[#1b365d] text-white font-bold rounded-xl shadow-md shadow-[#1b365d]/15 h-12 text-sm transition-all duration-200"
          >
            <Save className="mr-2 h-4 w-4" />
            {savingSite ? "Menyimpan..." : "Simpan Kontak & Medsos"}
          </Button>
        </TabsContent>
        <TabsContent value="chatbot" className="space-y-6" onInputCapture={() => { chatbotFormDirtyRef.current = true; }}>
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Pengaturan Asisten AI (Gemini)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Atur perilaku, instruksi, dan batas ruang lingkup chatbot berbasis Google Gemini untuk warga Banjar Agung.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${
                  chatbotForm.enabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {chatbotForm.enabled ? "Aktif" : "Non-Aktif"}
              </span>
            </div>
            <div className="p-5 pt-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-xl bg-slate-50/50">
                <div className="space-y-2">
                  <Label htmlFor="bot-enabled">Status Chatbot</Label>
                  <select
                    id="bot-enabled"
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d]"
                    value={chatbotForm.enabled ? "true" : "false"}
                    onChange={(e) =>
                      setChatbotForm((prev) => ({ ...prev, enabled: e.target.value === "true" }))
                    }
                    disabled={chatbotLoading}
                  >
                    <option value="true">Aktif (Tampil di Website)</option>
                    <option value="false">Non-Aktif (Sembunyikan Widget)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bot-model">Model Google Gemini</Label>
                  <select
                    id="bot-model"
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d]"
                    value={chatbotForm.selectedModel}
                    onChange={(e) =>
                      setChatbotForm((prev) => ({ ...prev, selectedModel: e.target.value }))
                    }
                    disabled={chatbotLoading}
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Direkomendasikan - Stabil & Cepat)</option>
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Ringan & Hemat Kuota)</option>
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Generasi Terbaru)</option>
                    <option value="gemini-flash-latest">Gemini Flash (Versi Selalu Terkini)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bot-temp">Kreativitas (Temperature: {chatbotForm.temperature})</Label>
                  <input
                    id="bot-temp"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3"
                    value={chatbotForm.temperature}
                    onChange={(e) =>
                      setChatbotForm((prev) => ({
                        ...prev,
                        temperature: parseFloat(e.target.value),
                      }))
                    }
                    disabled={chatbotLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-name">Nama Asisten AI</Label>
                  <Input
                    id="bot-name"
                    value={chatbotForm.botName}
                    onChange={(e) =>
                      setChatbotForm((prev) => ({ ...prev, botName: e.target.value }))
                    }
                    disabled={chatbotLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bot-greeting">Pesan Pembuka (Welcome Message)</Label>
                  <Input
                    id="bot-greeting"
                    value={chatbotForm.welcomeMessage}
                    onChange={(e) =>
                      setChatbotForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))
                    }
                    disabled={chatbotLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-allowed">Topik yang Diizinkan (Allowed Topics)</Label>
                <Textarea
                  id="bot-allowed"
                  rows={4}
                  value={chatbotForm.allowedTopics}
                  onChange={(e) =>
                    setChatbotForm((prev) => ({ ...prev, allowedTopics: e.target.value }))
                  }
                  disabled={chatbotLoading}
                  placeholder="Daftar topik pelayanan desa yang boleh dijawab..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-forbidden">Topik yang Ditolak & Pesan Penolakan</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Textarea
                    id="bot-forbidden"
                    rows={3}
                    value={chatbotForm.forbiddenTopics}
                    onChange={(e) =>
                      setChatbotForm((prev) => ({ ...prev, forbiddenTopics: e.target.value }))
                    }
                    disabled={chatbotLoading}
                    placeholder="Topik terlarang (politik, kode komputer, medis)..."
                  />
                  <Textarea
                    id="bot-refusal"
                    rows={3}
                    value={chatbotForm.refusalMessage}
                    onChange={(e) =>
                      setChatbotForm((prev) => ({ ...prev, refusalMessage: e.target.value }))
                    }
                    disabled={chatbotLoading}
                    placeholder="Pesan penolakan sopan..."
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveChatbot}
                disabled={savingChatbot || chatbotLoading}
                className="w-full bg-gradient-to-r from-[#1b365d] to-[#264478] hover:from-[#152a48] hover:to-[#1b365d] text-white font-bold rounded-xl shadow-md shadow-[#1b365d]/15 h-12 text-sm transition-all duration-200"
              >
                <Save className="mr-2 h-4 w-4" />
                {savingChatbot ? "Menyimpan..." : "Simpan Pengaturan Chatbot"}
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="account" className="space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Profil Akun & Kata Sandi Administrator</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ubah nama tampilan login admin dan perbarui kata sandi akun keamanan.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3">
              <form onSubmit={handleUpdateAccount} className="space-y-6 max-w-xl">
                {accountMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-sm flex items-center gap-2 ${
                      accountMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{accountMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Email Akun (Login)</Label>
                  <Input
                    type="email"
                    disabled
                    value={authUser?.email || "admin@banjaragung.go.id"}
                    className="bg-slate-100 text-slate-500 font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-500">Email login terikat dengan lisensi akun desa.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="account-name">Nama Administrator</Label>
                  <Input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Contoh: Admin Kelurahan Banjar Agung"
                    required
                  />
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#1b365d]" /> Ganti Kata Sandi
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kosongkan bagian ini jika Anda tidak ingin mengubah kata sandi saat ini.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-pw">Kata Sandi Baru</Label>
                    <Input
                      id="new-pw"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pw">Konfirmasi Kata Sandi Baru</Label>
                    <Input
                      id="confirm-pw"
                      type="password"
                      placeholder="Ulangi kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={savingAccount} className="w-full bg-gradient-to-r from-[#1b365d] to-[#264478] hover:from-[#152a48] hover:to-[#1b365d] text-white font-bold rounded-xl shadow-md shadow-[#1b365d]/15 h-12 text-sm transition-all duration-200">
                    <Save className="mr-2 h-4 w-4" />
                    {savingAccount ? "Menyimpan Perubahan..." : "Simpan Profil & Sandi"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="system" className="space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Pengaturan Sistem & Database</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Utilitas pengisian data contoh ke Firestore.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Isi Database Dummy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tambahkan data contoh untuk Penduduk, Berita & Artikel, Pengaduan Warga, dan Permohonan Surat.
                  </p>
                </div>
                <Button variant="outline" onClick={handleSeed} disabled={seeding} className="border-slate-300">
                  <Database className="mr-2 h-4 w-4" />
                  {seeding ? "Memproses..." : "Isi Data Dummy"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="categories" className="space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm dash-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-sm">
                <Tag className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Manajemen Kategori Berita</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Kelola daftar kategori yang tersedia saat membuat atau mengedit berita. Perubahan langsung berlaku di form tambah/edit berita.
                </p>
              </div>
            </div>
            <div className="p-5 pt-3 space-y-5">
              {categoryMsg && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${
                  categoryMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}>
                  <CheckCircle className={`h-4 w-4 shrink-0 ${categoryMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
                  {categoryMsg.text}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tambah Kategori Baru</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Nama kategori baru..."
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = newCategoryInput.trim();
                        if (!trimmed || beritaCategories.includes(trimmed)) return;
                        setBeritaCategories((prev) => [...prev, trimmed]);
                        beritaCategoriesFormDirtyRef.current = true;
                        setNewCategoryInput("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const trimmed = newCategoryInput.trim();
                      if (!trimmed || beritaCategories.includes(trimmed)) return;
                      setBeritaCategories((prev) => [...prev, trimmed]);
                      beritaCategoriesFormDirtyRef.current = true;
                      setNewCategoryInput("");
                    }}
                    className="bg-[#1b365d] hover:bg-[#152a48] text-white shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Tambah
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">Tekan Enter atau klik Tambah untuk menambahkan kategori baru.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Daftar Kategori Saat Ini</Label>
                {beritaCategories.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Belum ada kategori.</p>
                ) : (
                  <div className="space-y-2">
                    {beritaCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                        {editingCategoryIdx === idx ? (
                          <Input
                            value={editingCategoryVal}
                            onChange={(e) => setEditingCategoryVal(e.target.value)}
                            className="text-sm h-7 py-0 flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const trimmed = editingCategoryVal.trim();
                                if (!trimmed) return;
                                setBeritaCategories((prev) => prev.map((c, i) => i === idx ? trimmed : c));
                                beritaCategoriesFormDirtyRef.current = true;
                                setEditingCategoryIdx(null);
                              }
                              if (e.key === "Escape") setEditingCategoryIdx(null);
                            }}
                          />
                        ) : (
                          <span
                            className="flex-1 text-sm text-slate-800 cursor-pointer hover:text-[#1b365d]"
                            onClick={() => { setEditingCategoryIdx(idx); setEditingCategoryVal(cat); }}
                            title="Klik untuk edit nama"
                          >
                            {cat}
                          </span>
                        )}
                        {editingCategoryIdx === idx ? (
                          <Button
                            type="button" size="sm" variant="ghost"
                            className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                            onClick={() => {
                              const trimmed = editingCategoryVal.trim();
                              if (!trimmed) return;
                              setBeritaCategories((prev) => prev.map((c, i) => i === idx ? trimmed : c));
                              beritaCategoriesFormDirtyRef.current = true;
                              setEditingCategoryIdx(null);
                            }}
                          >Simpan</Button>
                        ) : null}
                        <Button
                          type="button" size="sm" variant="ghost"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                          onClick={() => {
                            setBeritaCategories((prev) => prev.filter((_, i) => i !== idx));
                            beritaCategoriesFormDirtyRef.current = true;
                            if (editingCategoryIdx === idx) setEditingCategoryIdx(null);
                          }}
                          title="Hapus kategori"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-300 text-slate-600"
                  onClick={() => {
                    setBeritaCategories(DEFAULT_BERITA_CATEGORIES);
                    beritaCategoriesFormDirtyRef.current = true;
                    setCategoryMsg(null);
                  }}
                >
                  Reset ke Default
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    setSavingCategories(true);
                    try {
                      await saveBeritaCategories(beritaCategories);
                      beritaCategoriesFormDirtyRef.current = false;
                      setCategoryMsg({ type: "success", text: "Kategori berita berhasil disimpan!" });
                      setTimeout(() => setCategoryMsg(null), 3000);
                    } catch {
                      setCategoryMsg({ type: "error", text: "Gagal menyimpan kategori. Coba lagi." });
                    } finally {
                      setSavingCategories(false);
                    }
                  }}
                  disabled={savingCategories}
                  className="w-full bg-gradient-to-r from-[#1b365d] to-[#264478] hover:from-[#152a48] hover:to-[#1b365d] text-white font-bold rounded-xl shadow-md shadow-[#1b365d]/15 h-12 text-sm transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {savingCategories ? "Menyimpan..." : "Simpan Kategori"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          <BannerManagement />
        </TabsContent>


      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat pengaturan...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

