"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Shield,
  Clock,
  Image as ImageIcon,
  HeartPulse,
  ShieldAlert,
  Tag,
  Plus,
  Trash2,
  GripVertical,
  Lock,
  Unlock,
  Edit3,
  RotateCcw,
  BarChart3,
  Globe,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImageToStorage } from "@/lib/uploadImage";
import { getToken } from "@/lib/api";
import { DEFAULT_CHATBOT_SETTINGS, ChatbotSettings, getChatbotSettings, saveChatbotSettings } from "@/lib/chatbot-config";
import {
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  OfficialItem,
  FacilityItem,
  ExternalLinkItem,
  DemographySettings,
  getSiteSettings,
  saveSiteSettings,
  invalidateSiteSettings,
  getBeritaCategories,
  saveBeritaCategories,
  DEFAULT_BERITA_CATEGORIES,
} from "@/lib/site-config";
import { BannerManagement } from "@/components/dashboard/banner-management";
import { useToast } from "@/components/ui/toast";

function SettingsContent() {
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();
  const { success, error: showError, confirm: showConfirm } = useToast();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [siteForm, setSiteForm] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [backupSiteForm, setBackupSiteForm] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isDataEditing, setIsDataEditing] = useState(false);
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

  const [beritaCategories, setBeritaCategories] = useState<string[]>(DEFAULT_BERITA_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editingCategoryVal, setEditingCategoryVal] = useState("");
  const [savingCategories, setSavingCategories] = useState(false);
  const [categoryMsg, setCategoryMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const config = await getSiteSettings();

        setSiteForm(config);
        setBackupSiteForm(config);
      } catch (err) {
        console.error("Error loading site settings:", err);
      } finally {
        setSiteLoading(false);
      }

      try {
        const config = await getChatbotSettings();
        setChatbotForm((prev) => ({ ...prev, ...config }));
      } catch (err) {
        console.error("Error loading chatbot settings:", err);
      } finally {
        setChatbotLoading(false);
      }

      try {
        const cats = await getBeritaCategories();
        if (cats && cats.length > 0) {
          setBeritaCategories(cats);
        }
      } catch (err) {
        console.error("Error loading berita categories:", err);
      }
    };

    loadData();

    if (authUser?.displayName) {
      setAccountName(authUser.displayName);
    }
  }, []);

  const handleSaveSite = async (sectionName = "Pengaturan") => {
    setSavingSite(true);
    setSiteMsg(null);
    try {
      await saveSiteSettings(siteForm);
      invalidateSiteSettings();
      setSiteMsg({
        type: "success",
        text: `Berhasil! ${sectionName} telah diperbarui dan otomatis tampil di halaman website.`,
      });
      setTimeout(() => setSiteMsg(null), 6000);
    } catch (err: any) {
      console.error("Error saving site settings:", err);
      setSiteMsg({
        type: "error",
        text: err.message || "Gagal menyimpan perubahan ke database.",
      });
    } finally {
      setSavingSite(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingSite(true);
    setSiteMsg(null);
    try {
      await saveSiteSettings(siteForm);
      invalidateSiteSettings();
      setBackupSiteForm(siteForm);
      setIsProfileEditing(false);
      success("Profil kelurahan berhasil disimpan dan terkunci kembali.");
      setSiteMsg({
        type: "success",
        text: "Berhasil! Profil kelurahan, aparatur, dan fasilitas umum telah diperbarui di website.",
      });
      setTimeout(() => setSiteMsg(null), 5000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      showError(err.message || "Gagal menyimpan perubahan profil.");
    } finally {
      setSavingSite(false);
    }
  };

  const handleCancelProfile = () => {
    setSiteForm(backupSiteForm);
    setIsProfileEditing(false);
    setSiteMsg(null);
  };

  const handleAddOfficial = () => {
    const newOff: OfficialItem = {
      id: "off-" + Date.now(),
      name: "",
      title: "",
      nip: "",
      photo: "",
      roleBadge: "STAF",
      division: "Pelayanan",
      duties: "",
    };
    setSiteForm((p) => ({
      ...p,
      officials: [...(p.officials || []), newOff],
    }));
  };

  const handleUpdateOfficial = (id: string, field: keyof OfficialItem, value: string) => {
    setSiteForm((p) => ({
      ...p,
      officials: (p.officials || []).map((off) =>
        off.id === id ? { ...off, [field]: value } : off
      ),
    }));
  };

  const handleDeleteOfficial = (id: string) => {
    setSiteForm((p) => ({
      ...p,
      officials: (p.officials || []).filter((off) => off.id !== id),
    }));
  };

  const handleOfficialPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    officialId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(officialId);
    try {
      const url = await uploadImageToStorage(file, "aparatur");
      setSiteForm((p) => ({
        ...p,
        officials: (p.officials || []).map((off) =>
          off.id === officialId ? { ...off, photo: url } : off
        ),
      }));
      success("Foto aparatur berhasil diunggah.");
    } catch (err) {
      console.error("Official photo upload error:", err);
      showError("Gagal mengunggah foto. Pastikan file gambar tidak melebihi 5MB.");
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleRemoveOfficialPhoto = (officialId: string) => {
    setSiteForm((p) => ({
      ...p,
      officials: (p.officials || []).map((off) =>
        off.id === officialId ? { ...off, photo: "" } : off
      ),
    }));
  };

  const handleAddFacility = () => {
    const newFac: FacilityItem = {
      id: "fac-" + Date.now(),
      title: "",
      desc: "",
      category: "Fasilitas Umum",
    };
    setSiteForm((p) => ({
      ...p,
      facilities: [...(p.facilities || []), newFac],
    }));
  };

  const handleUpdateFacility = (id: string, field: keyof FacilityItem, value: string) => {
    setSiteForm((p) => ({
      ...p,
      facilities: (p.facilities || []).map((fac) =>
        fac.id === id ? { ...fac, [field]: value } : fac
      ),
    }));
  };

  const handleDeleteFacility = (id: string) => {
    setSiteForm((p) => ({
      ...p,
      facilities: (p.facilities || []).filter((fac) => fac.id !== id),
    }));
  };

  const handleSaveDataSettings = async () => {
    setSavingSite(true);
    setSiteMsg(null);
    try {
      await saveSiteSettings(siteForm);
      invalidateSiteSettings();
      setBackupSiteForm(siteForm);
      setIsDataEditing(false);
      success("Data statistik demografi & direktori layanan berhasil disimpan.");
      setSiteMsg({
        type: "success",
        text: "Berhasil! Statistik demografi dan tautan layanan telah diperbarui di website.",
      });
      setTimeout(() => setSiteMsg(null), 5000);
    } catch (err: any) {
      console.error("Error saving data settings:", err);
      showError(err.message || "Gagal menyimpan pengaturan data.");
    } finally {
      setSavingSite(false);
    }
  };

  const handleCancelDataSettings = () => {
    setSiteForm(backupSiteForm);
    setIsDataEditing(false);
    setSiteMsg(null);
  };

  const handleUpdateDemography = (field: keyof DemographySettings, value: any) => {
    setSiteForm((p) => ({
      ...p,
      demography: {
        ...(p.demography || DEFAULT_SITE_SETTINGS.demography!),
        [field]: value,
      },
    }));
  };

  const handleAddExternalLink = () => {
    const newLink: ExternalLinkItem = {
      id: "link-" + Date.now(),
      name: "",
      desc: "",
      url: "https://",
      badge: "Layanan",
      category: "Bantuan Sosial & Kesejahteraan",
    };
    setSiteForm((p) => ({
      ...p,
      externalLinks: [...(p.externalLinks || []), newLink],
    }));
  };

  const handleUpdateExternalLink = (id: string, field: keyof ExternalLinkItem, value: string) => {
    setSiteForm((p) => ({
      ...p,
      externalLinks: (p.externalLinks || []).map((lnk) =>
        lnk.id === id ? { ...lnk, [field]: value } : lnk
      ),
    }));
  };

  const handleDeleteExternalLink = (id: string) => {
    setSiteForm((p) => ({
      ...p,
      externalLinks: (p.externalLinks || []).filter((lnk) => lnk.id !== id),
    }));
  };

  const handleSaveChatbot = async () => {
    try {
      setSavingChatbot(true);
      await saveChatbotSettings({
        ...chatbotForm,
        updatedAt: new Date().toISOString(),
      });
      success("Pengaturan Chatbot AI berhasil disimpan!");
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
        if (newPassword.length < 6) {
          throw new Error("Password baru minimal harus 6 karakter.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("Konfirmasi password tidak cocok.");
        }
        updates.password = newPassword;
      }

      if (Object.keys(updates).length > 0) {
        const res = await fetch(`/api/admins`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
    } catch (err: any) {
      console.error("Error updating account:", err);
      setAccountMsg({ type: "error", text: err.message || "Gagal memperbarui akun." });
    } finally {
      setSavingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan & Kelola Konten</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ubah seluruh teks profil kelurahan, beranda, kontak, nomor darurat, dan chatbot tanpa ubah kode HTML.
          </p>
        </div>
      </div>

      {siteMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border shadow-xs ${
            siteMsg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <CheckCircle className={`h-5 w-5 shrink-0 ${siteMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span className="font-medium">{siteMsg.text}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Sub-Navigation Sidebar (UCD Gold Standard: No horizontal scrollbars, logical chunking) */}
          <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs lg:sticky lg:top-4">
            <div className="space-y-4">
              {/* Kelompok 1: Konten Publik */}
              <div>
                <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Konten Publik
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                      activeTab === "profile"
                        ? "bg-[#1b365d] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Building className="h-4 w-4 shrink-0" />
                    <span className="truncate">Profil Kelurahan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("home")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                      activeTab === "home"
                        ? "bg-[#1b365d] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Home className="h-4 w-4 shrink-0" />
                    <span className="truncate">Beranda & Loket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("data")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                      activeTab === "data"
                        ? "bg-[#1b365d] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Informasi & Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("contact")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                      activeTab === "contact"
                        ? "bg-[#1b365d] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <PhoneCall className="h-4 w-4 shrink-0" />
                    <span className="truncate">Kontak & Medsos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("banners")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                      activeTab === "banners"
                        ? "bg-[#1b365d] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">Banner & Kegiatan</span>
                  </button>
                </div>
              </div>

              {/* Kelompok 2: Konfigurasi & Akun */}
              <div className="pt-2 border-t border-slate-100">
                <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Konfigurasi & Akun
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("categories")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                      activeTab === "categories"
                        ? "bg-[#1b365d] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Tag className="h-4 w-4 shrink-0" />
                    <span className="truncate">Kategori Berita</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("chatbot")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                      activeTab === "chatbot"
                        ? "bg-[#1b365d] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Bot className="h-4 w-4 shrink-0" />
                    <span className="truncate">Layanan Chatbot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("account")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                      activeTab === "account"
                        ? "bg-[#1b365d] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">Akun Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Panel Konten Pengaturan */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            <TabsContent value="profile" className="space-y-6">
          {/* Banner Status Mode Kunci / Edit (Defensive Accidental Edit Prevention) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
              isProfileEditing
                ? "bg-amber-50/70 border-amber-300 text-amber-950"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isProfileEditing
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {isProfileEditing ? (
                  <Unlock className="w-5 h-5 animate-pulse" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base">
                    {isProfileEditing
                      ? "Mode Pengeditan Aktif (Terbuka)"
                      : "Data Profil Sedang Terkunci (Perlindungan Data)"}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isProfileEditing
                        ? "bg-amber-200 text-amber-900"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isProfileEditing ? "Editing" : "Locked"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {isProfileEditing
                    ? "Anda dapat mengubah narasi sejarah, visi-misi, menambah/menghapus aparatur, mengunggah foto, dan fasilitas umum. Pastikan mengklik 'Simpan Perubahan' setelah selesai."
                    : "Formulir dikunci otomatis untuk mencegah data profil, aparatur, atau fasilitas umum terhapus atau tergeser secara tidak sengaja saat menggulir layar."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              {isProfileEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelProfile}
                    disabled={savingSite}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={savingSite}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {savingSite ? "Menyimpan..." : "Simpan & Kunci"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsProfileEditing(true)}
                  className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold text-xs shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  Buka Kunci &amp; Edit Profil
                </Button>
              )}
            </div>
          </div>

          {/* 1. Judul & Subjudul */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span>Judul Halaman Profil</span>
                {!isProfileEditing && (
                  <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Hanya Baca
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Teks judul utama dan subjudul yang muncul di bagian paling atas halaman <code>/profil</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-title" className="text-xs font-semibold">Judul Halaman Profil</Label>
                <Input
                  id="prof-title"
                  value={siteForm.title}
                  onChange={(e) => setSiteForm((p) => ({ ...p, title: e.target.value }))}
                  disabled={!isProfileEditing || siteLoading}
                  placeholder="Contoh: Profil Kelurahan Banjar Agung"
                  className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-subtitle" className="text-xs font-semibold">Subjudul &amp; Deskripsi Singkat</Label>
                <Input
                  id="prof-subtitle"
                  value={siteForm.subtitle}
                  onChange={(e) => setSiteForm((p) => ({ ...p, subtitle: e.target.value }))}
                  disabled={!isProfileEditing || siteLoading}
                  placeholder="Deskripsi wilayah kecamatan & kota"
                  className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Sejarah, Visi, Misi */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span>Sejarah, Visi &amp; Misi Kelurahan</span>
                {!isProfileEditing && (
                  <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Hanya Baca
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Ubah narasi sejarah desa, visi jangka panjang, dan poin-poin misi kelurahan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="prof-history" className="text-xs font-semibold">Narasi Sejarah Kelurahan</Label>
                <Textarea
                  id="prof-history"
                  rows={5}
                  value={siteForm.history}
                  onChange={(e) => setSiteForm((p) => ({ ...p, history: e.target.value }))}
                  disabled={!isProfileEditing || siteLoading}
                  placeholder="Tuliskan latar belakang sejarah..."
                  className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                />
                <p className="text-[11px] text-slate-500">Pisahkan paragraf dengan baris baru (enter ganda).</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-vision" className="text-xs font-semibold">Visi Kelurahan</Label>
                <Textarea
                  id="prof-vision"
                  rows={3}
                  value={siteForm.vision}
                  onChange={(e) => setSiteForm((p) => ({ ...p, vision: e.target.value }))}
                  disabled={!isProfileEditing || siteLoading}
                  placeholder="Visi kelurahan..."
                  className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-mission" className="text-xs font-semibold">Misi Kelurahan</Label>
                <Textarea
                  id="prof-mission"
                  rows={5}
                  value={siteForm.mission}
                  onChange={(e) => setSiteForm((p) => ({ ...p, mission: e.target.value }))}
                  disabled={!isProfileEditing || siteLoading}
                  placeholder="Poin misi kelurahan (1 poin per baris)..."
                  className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                />
                <p className="text-[11px] text-slate-500">Tuliskan setiap poin misi pada baris baru (enter). Otomatis diformat sebagai daftar berpoin di web.</p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Struktur Organisasi & Aparatur Kelurahan (Dinamis & Fleksibel) */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-[#1b365d]" />
                    <span>Struktur Organisasi &amp; Aparatur Kelurahan</span>
                  </CardTitle>
                  <CardDescription>
                    Kelola foto resmi, nama, jabatan, NIP, dan tugas aparatur. Anda dapat menambah atau mengurangi aparatur secara fleksibel.
                  </CardDescription>
                </div>
                {isProfileEditing && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddOfficial}
                    className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold text-xs shadow-xs self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Tambah Aparatur
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!siteForm.officials || siteForm.officials.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <User className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Belum ada data aparatur</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {isProfileEditing
                      ? "Klik tombol '+ Tambah Aparatur' di atas untuk memasukkan profil aparatur pertama."
                      : "Buka kunci pengeditan terlebih dahulu untuk menambahkan aparatur kelurahan."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {siteForm.officials.map((off, idx) => (
                    <div
                      key={off.id || idx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4 relative transition-all hover:border-slate-300"
                    >
                      {/* Baris Atas Kartu: Nomor & Aksi */}
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#1b365d] text-white text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {off.name ? off.name : `Aparatur #${idx + 1}`}
                          </span>
                          {off.roleBadge && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                              {off.roleBadge}
                            </span>
                          )}
                        </div>
                        {isProfileEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOfficial(off.id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-xs"
                            title="Hapus aparatur ini"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Hapus
                          </Button>
                        )}
                      </div>

                      {/* Layout Foto & Data Form */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        {/* Kolom Foto */}
                        <div className="md:col-span-3 flex flex-col items-center gap-2 text-center">
                          <Label className="text-xs font-semibold text-slate-700">Foto Resmi</Label>
                          <div className="relative">
                            {off.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={off.photo}
                                alt={off.name || "Aparatur"}
                                className="w-24 h-24 rounded-full object-cover border-2 border-[#1b365d]/20 shadow-xs"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-400">
                                <User className="h-10 w-10" />
                              </div>
                            )}
                          </div>

                          {isProfileEditing && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <label className="cursor-pointer">
                                <span className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700 inline-block shadow-2xs">
                                  {uploadingPhoto === off.id ? "Mengunggah..." : "Unggah"}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleOfficialPhotoUpload(e, off.id)}
                                  disabled={!isProfileEditing || siteLoading || uploadingPhoto !== null}
                                />
                              </label>
                              {off.photo && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOfficialPhoto(off.id)}
                                  className="text-xs px-2 py-1.5 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                  title="Hapus foto ini"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Kolom Input Form */}
                        <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs font-semibold text-slate-700">Nama Lengkap &amp; Gelar</Label>
                            <Input
                              value={off.name}
                              onChange={(e) => handleUpdateOfficial(off.id, "name", e.target.value)}
                              disabled={!isProfileEditing || siteLoading}
                              placeholder="Contoh: H. Ahmad Fauzi, S.Sos., M.Si."
                              className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Jabatan Resmi</Label>
                            <Input
                              value={off.title}
                              onChange={(e) => handleUpdateOfficial(off.id, "title", e.target.value)}
                              disabled={!isProfileEditing || siteLoading}
                              placeholder="Contoh: Kepala Kelurahan (Lurah)"
                              className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">NIP (Nomor Induk Pegawai)</Label>
                            <Input
                              value={off.nip || ""}
                              onChange={(e) => handleUpdateOfficial(off.id, "nip", e.target.value)}
                              disabled={!isProfileEditing || siteLoading}
                              placeholder="Contoh: 19780512 200501 1 004"
                              className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Kategori Hirarki / Posisi</Label>
                            <Input
                              value={off.roleBadge || ""}
                              onChange={(e) => handleUpdateOfficial(off.id, "roleBadge", e.target.value)}
                              disabled={!isProfileEditing || siteLoading}
                              placeholder="Contoh: PIMPINAN / SEKRETARIAT / KASI / STAF"
                              className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Divisi / Seksi</Label>
                            <Input
                              value={off.division || ""}
                              onChange={(e) => handleUpdateOfficial(off.id, "division", e.target.value)}
                              disabled={!isProfileEditing || siteLoading}
                              placeholder="Contoh: Pemerintahan & Trantib / Pelayanan Umum"
                              className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs font-semibold text-slate-700">Tugas Pokok &amp; Tanggung Jawab Singkat</Label>
                            <Input
                              value={off.duties || ""}
                              onChange={(e) => handleUpdateOfficial(off.id, "duties", e.target.value)}
                              disabled={!isProfileEditing || siteLoading}
                              placeholder="Contoh: Penanggung jawab kebijakan wilayah dan legalitas surat..."
                              className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Fasilitas & Pemukiman Utama (Dinamis & Fleksibel) */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Home className="h-5 w-5 text-[#1b365d]" />
                    <span>Fasilitas Publik &amp; Kawasan Pemukiman</span>
                  </CardTitle>
                  <CardDescription>
                    Kelola fasilitas umum, sarana kesehatan primer, balai pertemuan, dan pemukiman yang disorot pada halaman profil.
                  </CardDescription>
                </div>
                {isProfileEditing && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddFacility}
                    className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold text-xs shadow-xs self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Tambah Fasilitas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!siteForm.facilities || siteForm.facilities.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Home className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Belum ada data fasilitas umum</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {isProfileEditing
                      ? "Klik '+ Tambah Fasilitas' untuk memasukkan fasilitas publik atau perumahan."
                      : "Buka kunci pengeditan terlebih dahulu untuk menambahkan fasilitas."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {siteForm.facilities.map((fac, idx) => (
                    <div
                      key={fac.id || idx}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3 relative hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <span className="text-xs font-bold text-slate-700">
                            Fasilitas #{idx + 1}
                          </span>
                          {isProfileEditing && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFacility(fac.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 text-xs"
                              title="Hapus fasilitas ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Nama / Judul Fasilitas</Label>
                          <Input
                            placeholder="Contoh: Balai Warga & Puskesmas Pembantu"
                            value={fac.title}
                            onChange={(e) => handleUpdateFacility(fac.id, "title", e.target.value)}
                            disabled={!isProfileEditing || siteLoading}
                            className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Kategori</Label>
                          <Input
                            placeholder="Contoh: Fasilitas Sosial / Pemukiman"
                            value={fac.category || ""}
                            onChange={(e) => handleUpdateFacility(fac.id, "category", e.target.value)}
                            disabled={!isProfileEditing || siteLoading}
                            className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Deskripsi Singkat</Label>
                          <Textarea
                            rows={3}
                            placeholder="Deskripsi sarana dan kegunaan..."
                            value={fac.desc}
                            onChange={(e) => handleUpdateFacility(fac.id, "desc", e.target.value)}
                            disabled={!isProfileEditing || siteLoading}
                            className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Geografis & Batas Wilayah */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span>Geografis &amp; Batas Wilayah</span>
                {!isProfileEditing && (
                  <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Hanya Baca
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Informasi luas wilayah, titik koordinat, dan batas administratif kelurahan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="geo-area" className="text-xs font-semibold">Luas Wilayah</Label>
                  <Input
                    id="geo-area"
                    value={siteForm.geoArea}
                    onChange={(e) => setSiteForm((p) => ({ ...p, geoArea: e.target.value }))}
                    disabled={!isProfileEditing || siteLoading}
                    placeholder="Contoh: 348 Ha"
                    className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="geo-coord" className="text-xs font-semibold">Titik Koordinat</Label>
                  <Input
                    id="geo-coord"
                    value={siteForm.geoCoord}
                    onChange={(e) => setSiteForm((p) => ({ ...p, geoCoord: e.target.value }))}
                    disabled={!isProfileEditing || siteLoading}
                    placeholder="Contoh: 6°7'25&quot;S 106°11'54&quot;E"
                    className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="geo-area-desc" className="text-xs font-semibold">Keterangan Wilayah</Label>
                  <Input
                    id="geo-area-desc"
                    value={siteForm.geoAreaDesc}
                    onChange={(e) => setSiteForm((p) => ({ ...p, geoAreaDesc: e.target.value }))}
                    disabled={!isProfileEditing || siteLoading}
                    className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="geo-coord-desc" className="text-xs font-semibold">Keterangan Koordinat</Label>
                  <Input
                    id="geo-coord-desc"
                    value={siteForm.geoCoordDesc}
                    onChange={(e) => setSiteForm((p) => ({ ...p, geoCoordDesc: e.target.value }))}
                    disabled={!isProfileEditing || siteLoading}
                    className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Batas Wilayah Administratif</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="b-north" className="text-xs">Batas Utara</Label>
                    <Input
                      id="b-north"
                      value={siteForm.boundaryNorth}
                      onChange={(e) => setSiteForm((p) => ({ ...p, boundaryNorth: e.target.value }))}
                      disabled={!isProfileEditing || siteLoading}
                      className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-south" className="text-xs">Batas Selatan</Label>
                    <Input
                      id="b-south"
                      value={siteForm.boundarySouth}
                      onChange={(e) => setSiteForm((p) => ({ ...p, boundarySouth: e.target.value }))}
                      disabled={!isProfileEditing || siteLoading}
                      className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-east" className="text-xs">Batas Timur</Label>
                    <Input
                      id="b-east"
                      value={siteForm.boundaryEast}
                      onChange={(e) => setSiteForm((p) => ({ ...p, boundaryEast: e.target.value }))}
                      disabled={!isProfileEditing || siteLoading}
                      className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-west" className="text-xs">Batas Barat</Label>
                    <Input
                      id="b-west"
                      value={siteForm.boundaryWest}
                      onChange={(e) => setSiteForm((p) => ({ ...p, boundaryWest: e.target.value }))}
                      disabled={!isProfileEditing || siteLoading}
                      className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Identitas & Kode Wilayah */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#1b365d]" /> Identitas &amp; Kode Wilayah
                </span>
                {!isProfileEditing && (
                  <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Hanya Baca
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Kode resmi Kemendagri, kode pos, dan tautan Google Maps yang tampil di halaman profil &amp; footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kemendagri-code" className="text-xs font-semibold">Kode Wilayah Kemendagri</Label>
                  <Input
                    id="kemendagri-code"
                    value={siteForm.kemendagriCode}
                    onChange={(e) => setSiteForm((p) => ({ ...p, kemendagriCode: e.target.value }))}
                    disabled={!isProfileEditing || siteLoading}
                    placeholder="Contoh: 36.73.05.1004"
                    className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                  <p className="text-[11px] text-slate-500">Kode Kemendagri resmi Kelurahan (format: XX.XX.XX.XXXX).</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal-code" className="text-xs font-semibold">Kode Pos</Label>
                  <Input
                    id="postal-code"
                    value={siteForm.postalCode}
                    onChange={(e) => setSiteForm((p) => ({ ...p, postalCode: e.target.value }))}
                    disabled={!isProfileEditing || siteLoading}
                    placeholder="Contoh: 42122"
                    className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maps-url" className="text-xs font-semibold">Tautan Google Maps (URL Langsung)</Label>
                <Input
                  id="maps-url"
                  value={siteForm.googleMapsUrl}
                  onChange={(e) => setSiteForm((p) => ({ ...p, googleMapsUrl: e.target.value }))}
                  disabled={!isProfileEditing || siteLoading}
                  placeholder="https://maps.google.com/?q=Kelurahan+Banjar+Agung"
                  className={!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                />
                <p className="text-[11px] text-slate-500">Tautan ini digunakan untuk tombol &quot;Buka di Google Maps&quot; di footer.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maps-embed" className="text-xs font-semibold">Kode Embed Google Maps (iframe src)</Label>
                <Textarea
                  id="maps-embed"
                  rows={3}
                  value={siteForm.googleMapsEmbed}
                  onChange={(e) => setSiteForm((p) => ({ ...p, googleMapsEmbed: e.target.value }))}
                  disabled={!isProfileEditing || siteLoading}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className={`font-mono text-xs ${!isProfileEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}`}
                />
                <p className="text-[11px] text-slate-500">
                  Buka Google Maps &rarr; Bagikan &rarr; Sematkan Peta &rarr; Salin URL dari atribut <code>src</code> pada kode iframe.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar Bawah */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              {isProfileEditing
                ? "Pastikan data aparatur dan fasilitas sudah benar sebelum menyimpan."
                : "Klik 'Buka Kunci & Edit Profil' di atas jika Anda ingin melakukan perubahan data."}
            </p>
            {isProfileEditing && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelProfile}
                  disabled={savingSite}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingSite || siteLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-semibold text-xs shadow-xs"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingSite ? "Menyimpan..." : "Simpan & Kunci Profil"}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="home" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Teks Hero Beranda Utama</CardTitle>
              <CardDescription>
                Teks yang dilihat pertama kali oleh warga saat membuka halaman depan website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Status & Jadwal Loket Pelayanan</CardTitle>
              <CardDescription>
                Atur status buka/tutup loket serta jam kerja pelayanan administrasi di kantor kelurahan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Kontak Darurat Wilayah Terpadu</CardTitle>
              <CardDescription>
                Nomor hotline medis dan keamanan darurat yang tampil di kartu biru beranda serta footer website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => handleSaveSite("Beranda & Loket")}
              disabled={savingSite || siteLoading}
              className="bg-[#1b365d] hover:bg-[#152a48] text-white px-6 font-semibold"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingSite ? "Menyimpan..." : "Simpan Beranda & Loket"}
            </Button>
          </div>
        </TabsContent>

        {/* TAB: INFORMASI & DATA */}
        <TabsContent value="data" className="space-y-6">
          {/* Banner Status Mode Kunci / Edit (Defensive Accidental Edit Prevention) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
              isDataEditing
                ? "bg-amber-50/70 border-amber-300 text-amber-950"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDataEditing
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {isDataEditing ? (
                  <Unlock className="w-5 h-5 animate-pulse" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base">
                    {isDataEditing
                      ? "Mode Pengeditan Aktif (Terbuka)"
                      : "Data Statistik & Informasi Terkunci (Perlindungan Data)"}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      isDataEditing
                        ? "bg-amber-200 text-amber-900"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isDataEditing ? "Dapat Diedit" : "Terkunci Aman"}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {isDataEditing
                    ? "Silakan perbarui angka statistik demografi atau direktori tautan layanan resmi di bawah ini. Klik 'Simpan' untuk mempublikasikan."
                    : "Perlindungan defensif mencegah data penting tergeser tidak sengaja. Klik tombol di kanan untuk membuka akses perubahan."}
                </p>
              </div>
            </div>
            <div>
              {isDataEditing ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDataSettings}
                    disabled={savingSite}
                    className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveDataSettings}
                    disabled={savingSite}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {savingSite ? "Menyimpan..." : "Simpan & Kunci"}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsDataEditing(true)}
                  className="bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-semibold shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  Buka Kunci Pengeditan
                </Button>
              )}
            </div>
          </div>

          {/* CARD 1: REKAPITULASI STATISTIK DEMOGRAFI */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-900">
                  <BarChart3 className="w-5 h-5 text-[#1b365d]" />
                  Rekapitulasi Demografi Agregat Kelurahan
                </span>
                {!isDataEditing && (
                  <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Hanya Baca
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Angka agregat resmi monografi kependudukan yang ditampilkan pada kartu ringkasan dan grafik halaman Informasi &amp; Data publik.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="demo-total" className="text-xs font-semibold">Total Penduduk (Jiwa)</Label>
                  <Input
                    id="demo-total"
                    type="number"
                    value={siteForm.demography?.total ?? 3840}
                    onChange={(e) => handleUpdateDemography("total", parseInt(e.target.value) || 0)}
                    disabled={!isDataEditing || siteLoading}
                    className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                  <p className="text-[11px] text-slate-500">Jumlah seluruh warga terdaftar.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="demo-kk" className="text-xs font-semibold">Kepala Keluarga (KK)</Label>
                  <Input
                    id="demo-kk"
                    type="number"
                    value={siteForm.demography?.kk ?? 1185}
                    onChange={(e) => handleUpdateDemography("kk", parseInt(e.target.value) || 0)}
                    disabled={!isDataEditing || siteLoading}
                    className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                  <p className="text-[11px] text-slate-500">Jumlah Kartu Keluarga aktif.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="demo-male" className="text-xs font-semibold">Laki-laki (Jiwa)</Label>
                  <Input
                    id="demo-male"
                    type="number"
                    value={siteForm.demography?.male ?? 1948}
                    onChange={(e) => handleUpdateDemography("male", parseInt(e.target.value) || 0)}
                    disabled={!isDataEditing || siteLoading}
                    className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                  <p className="text-[11px] text-slate-500">Penduduk berjenis kelamin laki-laki.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="demo-female" className="text-xs font-semibold">Perempuan (Jiwa)</Label>
                  <Input
                    id="demo-female"
                    type="number"
                    value={siteForm.demography?.female ?? 1892}
                    onChange={(e) => handleUpdateDemography("female", parseInt(e.target.value) || 0)}
                    disabled={!isDataEditing || siteLoading}
                    className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                  <p className="text-[11px] text-slate-500">Penduduk berjenis kelamin perempuan.</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Label className="text-xs font-semibold text-slate-800 block mb-2">Sebaran Kelompok Usia Penduduk</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="demo-age-children" className="text-[11px] text-slate-600">Usia 0 - 17 Tahun (Anak & Remaja)</Label>
                    <Input
                      id="demo-age-children"
                      type="number"
                      value={siteForm.demography?.ageChildren ?? 998}
                      onChange={(e) => handleUpdateDemography("ageChildren", parseInt(e.target.value) || 0)}
                      disabled={!isDataEditing || siteLoading}
                      className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="demo-age-adults" className="text-[11px] text-slate-600">Usia 18 - 59 Tahun (Usia Produktif)</Label>
                    <Input
                      id="demo-age-adults"
                      type="number"
                      value={siteForm.demography?.ageAdults ?? 2496}
                      onChange={(e) => handleUpdateDemography("ageAdults", parseInt(e.target.value) || 0)}
                      disabled={!isDataEditing || siteLoading}
                      className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="demo-age-seniors" className="text-[11px] text-slate-600">Usia ≥ 60 Tahun (Lanjut Usia)</Label>
                    <Input
                      id="demo-age-seniors"
                      type="number"
                      value={siteForm.demography?.ageSeniors ?? 346}
                      onChange={(e) => handleUpdateDemography("ageSeniors", parseInt(e.target.value) || 0)}
                      disabled={!isDataEditing || siteLoading}
                      className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="demo-period" className="text-xs font-semibold">Periode Pemutakhiran Data</Label>
                  <Input
                    id="demo-period"
                    value={siteForm.demography?.updatedPeriod ?? "Semester II Tahun 2026"}
                    onChange={(e) => handleUpdateDemography("updatedPeriod", e.target.value)}
                    disabled={!isDataEditing || siteLoading}
                    placeholder="Contoh: Semester II Tahun 2026"
                    className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                  <p className="text-[11px] text-slate-500">Tampil sebagai catatan waktu pemutakhiran data resmi.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="demo-source" className="text-xs font-semibold">Sumber Rekapitulasi</Label>
                  <Input
                    id="demo-source"
                    value={siteForm.demography?.source ?? "Rekapitulasi Monografi BPS & Kelurahan Banjar Agung"}
                    onChange={(e) => handleUpdateDemography("source", e.target.value)}
                    disabled={!isDataEditing || siteLoading}
                    placeholder="Contoh: Rekapitulasi Monografi BPS & Kelurahan Banjar Agung"
                    className={!isDataEditing ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}
                  />
                  <p className="text-[11px] text-slate-500">Nama dokumen atau rujukan data resmi instansi.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: DIREKTORI TAUTAN LAYANAN & BANSOS EKSTERNAL */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900">
                    <Globe className="w-5 h-5 text-[#1b365d]" />
                    Direktori Layanan &amp; Bansos Resmi Pemerintah
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Daftar tautan portal pemerintah resmi (Cek Bansos, DTKS, Dukcapil, BPJS, dll) yang dapat diakses langsung oleh masyarakat.
                  </CardDescription>
                </div>
                {isDataEditing && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddExternalLink}
                    disabled={siteLoading}
                    className="border-slate-300 text-xs font-semibold text-[#1b365d] hover:bg-slate-100 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Tambah Tautan
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(siteForm.externalLinks || []).length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                  Belum ada tautan layanan yang ditambahkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {(siteForm.externalLinks || []).map((link, idx) => (
                    <div
                      key={link.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {link.name || "Tautan Layanan Baru"}
                          </span>
                        </div>
                        {isDataEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExternalLink(link.id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
                            title="Hapus tautan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600">Nama Layanan</Label>
                          <Input
                            value={link.name}
                            onChange={(e) => handleUpdateExternalLink(link.id, "name", e.target.value)}
                            disabled={!isDataEditing || siteLoading}
                            placeholder="Contoh: Cek Bansos Kemensos RI"
                            className={`text-xs ${!isDataEditing ? "bg-slate-50 cursor-not-allowed" : ""}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600">Kategori</Label>
                          <Input
                            value={link.category}
                            onChange={(e) => handleUpdateExternalLink(link.id, "category", e.target.value)}
                            disabled={!isDataEditing || siteLoading}
                            placeholder="Contoh: Bantuan Sosial & Kesejahteraan"
                            className={`text-xs ${!isDataEditing ? "bg-slate-50 cursor-not-allowed" : ""}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600">Label Badge</Label>
                          <Input
                            value={link.badge}
                            onChange={(e) => handleUpdateExternalLink(link.id, "badge", e.target.value)}
                            disabled={!isDataEditing || siteLoading}
                            placeholder="Contoh: Bansos, Kemendagri"
                            className={`text-xs ${!isDataEditing ? "bg-slate-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600">URL Tautan</Label>
                          <Input
                            value={link.url}
                            onChange={(e) => handleUpdateExternalLink(link.id, "url", e.target.value)}
                            disabled={!isDataEditing || siteLoading}
                            placeholder="https://cekbansos.kemensos.go.id"
                            className={`text-xs ${!isDataEditing ? "bg-slate-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600">Deskripsi Singkat</Label>
                          <Input
                            value={link.desc}
                            onChange={(e) => handleUpdateExternalLink(link.id, "desc", e.target.value)}
                            disabled={!isDataEditing || siteLoading}
                            placeholder="Penjelasan singkat manfaat layanan bagi warga..."
                            className={`text-xs ${!isDataEditing ? "bg-slate-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isDataEditing && (
                <div className="flex justify-end pt-4 border-t border-slate-100 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelDataSettings}
                    disabled={savingSite}
                    className="border-slate-300 text-slate-700 text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveDataSettings}
                    disabled={savingSite || siteLoading}
                    className="bg-[#1b365d] hover:bg-[#152a48] text-white text-xs font-semibold px-5"
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {savingSite ? "Menyimpan..." : "Simpan Seluruh Data & Tautan"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contact" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Kontak Resmi & Media Sosial</CardTitle>
              <CardDescription>
                Informasi ini otomatis tampil di footer seluruh halaman, navigasi, dan informasi kontak publik.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => handleSaveSite("Kontak & Media Sosial")}
              disabled={savingSite || siteLoading}
              className="bg-[#1b365d] hover:bg-[#152a48] text-white px-6 font-semibold"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingSite ? "Menyimpan..." : "Simpan Kontak & Medsos"}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="chatbot" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="h-5 w-5 text-[#1b365d]" /> Pengaturan Asisten AI (Gemini)
                  </CardTitle>
                  <CardDescription>
                    Atur perilaku, instruksi, dan batas ruang lingkup chatbot berbasis Google Gemini untuk warga Banjar Agung.
                  </CardDescription>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    chatbotForm.enabled
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {chatbotForm.enabled ? "Aktif" : "Non-Aktif"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveChatbot}
                  disabled={savingChatbot || chatbotLoading}
                  className="bg-[#1b365d] hover:bg-[#152a48] text-white px-6 font-semibold"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingChatbot ? "Menyimpan..." : "Simpan Pengaturan Chatbot"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="account" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-[#1b365d]" /> Profil Akun & Kata Sandi Administrator
              </CardTitle>
              <CardDescription>
                Ubah nama tampilan login admin dan perbarui kata sandi akun keamanan.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  <Button type="submit" disabled={savingAccount} className="bg-[#1b365d] hover:bg-[#152a48] text-white">
                    <Save className="mr-2 h-4 w-4" />
                    {savingAccount ? "Menyimpan Perubahan..." : "Simpan Profil & Sandi"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#1b365d]" /> Manajemen Kategori Berita
              </CardTitle>
              <CardDescription>
                Kelola daftar kategori yang tersedia saat membuat atau mengedit berita. Perubahan langsung berlaku di form tambah/edit berita.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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
                              setEditingCategoryIdx(null);
                            }}
                          >Simpan</Button>
                        ) : null}
                        <Button
                          type="button" size="sm" variant="ghost"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                          onClick={() => {
                            setBeritaCategories((prev) => prev.filter((_, i) => i !== idx));
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
                      setCategoryMsg({ type: "success", text: "Kategori berita berhasil disimpan!" });
                      setTimeout(() => setCategoryMsg(null), 3000);
                    } catch {
                      setCategoryMsg({ type: "error", text: "Gagal menyimpan kategori. Coba lagi." });
                    } finally {
                      setSavingCategories(false);
                    }
                  }}
                  disabled={savingCategories}
                  className="bg-[#1b365d] hover:bg-[#152a48] text-white text-sm"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {savingCategories ? "Menyimpan..." : "Simpan Kategori"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: BANNER & EVENT */}
        <TabsContent value="banners" className="space-y-6">
          <BannerManagement />
        </TabsContent>
          </div>
        </div>

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

