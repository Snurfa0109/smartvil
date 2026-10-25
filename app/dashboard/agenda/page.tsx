"use client";

/**
 * [HALAMAN ADMIN / DASHBOARD] Manajemen Agenda & Jadwal Kegiatan
 * Penjadwalan kegiatan posyandu, kerja bakti, musrenbang, dan kegiatan resmi kelurahan.
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { apiList, apiInsert, apiUpdate, apiDelete } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  Search,
  MapPin,
  Check,
  LayoutList,
  Repeat,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { usePolling } from "@/hooks/use-polling";

type AgendaItem = {
  id: string;
  title: string;
  category: string;
  categoryColor: "blue" | "emerald" | "amber" | "red" | "purple";
  schedule: string;
  description: string;
  timeLocation: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string;
  timeEnd: string;
  location: string;
  active: boolean;
  order: number;
};

type AgendaForm = Omit<AgendaItem, "id">;

const CATEGORY_COLORS: Record<string, { label: string; badgeClass: string; swatch: string }> = {
  blue: { label: "Biru (Program Lingkungan)", badgeClass: "text-blue-800 bg-blue-50 border-blue-200/60", swatch: "bg-blue-500" },
  emerald: { label: "Hijau (Bantuan Sosial)", badgeClass: "text-emerald-800 bg-emerald-50 border-emerald-200/60", swatch: "bg-emerald-500" },
  amber: { label: "Kuning (Kesehatan Warga)", badgeClass: "text-amber-800 bg-amber-50 border-amber-200/60", swatch: "bg-amber-500" },
  red: { label: "Merah (Keamanan & Tanggap)", badgeClass: "text-red-800 bg-red-50 border-red-200/60", swatch: "bg-red-500" },
  purple: { label: "Ungu (Pendidikan & PKK)", badgeClass: "text-purple-800 bg-purple-50 border-purple-200/60", swatch: "bg-purple-500" },
};

const EMPTY_FORM: AgendaForm = {
  title: "",
  category: "",
  categoryColor: "blue",
  schedule: "",
  description: "",
  timeLocation: "",
  dateStart: "",
  dateEnd: "",
  timeStart: "",
  timeEnd: "",
  location: "",
  active: true,
  order: 0,
};

function formatDateId(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function buildDateLabel(item: AgendaItem): string {
  if (!item.dateStart) return "";
  const start = formatDateId(item.dateStart);
  if (item.dateEnd && item.dateEnd !== item.dateStart) {
    return `${start} - ${formatDateId(item.dateEnd)}`;
  }
  return start;
}

function buildTimeLabel(item: AgendaItem): string {
  if (!item.timeStart) return "";
  if (item.timeEnd) return `${item.timeStart} - ${item.timeEnd} WIB`;
  return `${item.timeStart} WIB`;
}

function composeTimeLoc(form: AgendaForm): string {
  const parts: string[] = [];
  if (form.timeStart) {
    parts.push(form.timeEnd ? `${form.timeStart} - ${form.timeEnd} WIB` : `${form.timeStart} WIB`);
  }
  if (form.location) parts.push(form.location);
  return parts.join(" \u2022 ");
}

export default function AgendaDashboardPage() {
  const { warning, error: showError } = useToast();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AgendaForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<AgendaItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const initialLoadedRef = useRef(false);

  const fetchItems = useCallback(async () => {
    if (!initialLoadedRef.current) setLoading(true);
    try {
      const rows = await apiList("agenda", { orderBy: "sort_order", order: "asc" });
      setItems(
        (rows || []).map((row) => ({
          id: String(row.id),
          title: String(row.title || ""),
          category: String(row.category || ""),
          categoryColor: (row.category_color as AgendaItem["categoryColor"]) || "blue",
          schedule: String(row.schedule || ""),
          description: String(row.description || ""),
          timeLocation: String(row.time_location || ""),
          dateStart: String(row.date_start || ""),
          dateEnd: String(row.date_end || ""),
          timeStart: String(row.time_start || ""),
          timeEnd: String(row.time_end || ""),
          location: String(row.location || ""),
          active: Number(row.active) !== 0,
          order: Number(row.sort_order ?? 0),
        }))
      );
    } catch (err) {
      console.error("Error fetching agenda:", err);
    } finally {
      setLoading(false);
      initialLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  usePolling(fetchItems, 30_000);

  const activeCount = useMemo(() => items.filter((i) => i.active).length, [items]);
  const inactiveCount = useMemo(() => items.filter((i) => !i.active).length, [items]);
  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return items.filter((i) => i.active && i.dateStart && i.dateStart >= today).length;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: items.length });
    setShowDialog(true);
  };

  const openEdit = (item: AgendaItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      categoryColor: item.categoryColor || "blue",
      schedule: item.schedule,
      description: item.description,
      timeLocation: item.timeLocation,
      dateStart: item.dateStart ? item.dateStart.slice(0, 10) : "",
      dateEnd: item.dateEnd ? item.dateEnd.slice(0, 10) : "",
      timeStart: item.timeStart,
      timeEnd: item.timeEnd,
      location: item.location,
      active: item.active ?? true,
      order: item.order ?? 0,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.category.trim()) {
      warning("Judul dan Kategori wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const timeLoc = composeTimeLoc(form) || form.timeLocation;
      const payload = {
        title: form.title,
        category: form.category,
        category_color: form.categoryColor,
        schedule: form.schedule,
        description: form.description,
        time_location: timeLoc,
        date_start: form.dateStart || null,
        date_end: form.dateEnd || null,
        time_start: form.timeStart,
        time_end: form.timeEnd,
        location: form.location,
        active: form.active ? 1 : 0,
        sort_order: form.order,
      };
      if (editingId) {
        await apiUpdate("agenda", editingId, payload);
        await writeAuditLog("UPDATE", "agenda", `Memperbarui agenda: "${form.title}"`);
      } else {
        await apiInsert("agenda", payload);
        await writeAuditLog("CREATE", "agenda", `Menambahkan agenda baru: "${form.title}"`);
      }
      await fetchItems();
      closeDialog();
    } catch (err) {
      console.error(err);
      showError("Gagal menyimpan agenda.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AgendaItem) => {
    setDeleting(item.id);
    try {
      await apiDelete("agenda", item.id);
      await writeAuditLog("DELETE", "agenda", `Menghapus agenda: "${item.title}"`);
      await fetchItems();
      setConfirmDelete(null);
    } catch {
      showError("Gagal menghapus agenda.");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (item: AgendaItem) => {
    try {
      await apiUpdate("agenda", item.id, { active: item.active ? 0 : 1 });
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, active: !it.active } : it)));
    } catch {
      showError("Gagal mengubah status.");
    }
  };

  const badgeClass = (color: string) =>
    CATEGORY_COLORS[color]?.badgeClass || "text-slate-700 bg-slate-50 border-slate-200";

  const previewTimeLoc = composeTimeLoc(form);

  return (
    <div className="space-y-6 pb-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#2a4a7f] flex items-center justify-center shadow-md shadow-[#1b365d]/20">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Agenda Kegiatan</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Kelola program dan jadwal kegiatan kemasyarakatan
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="bg-[#1b365d] hover:bg-[#152a48] text-white h-9 px-4 text-xs font-semibold shrink-0 rounded-lg shadow-sm"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Agenda
        </Button>
      </div>

      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Agenda", value: items.length, accentBar: "bg-gradient-to-r from-[#1b365d] to-[#2a4a7f]", numText: "text-slate-900", iconBg: "bg-[#1b365d]/8", iconText: "text-[#1b365d]", icon: <CalendarDays className="h-4 w-4" /> },
          { label: "Aktif", value: activeCount, accentBar: "bg-gradient-to-r from-emerald-500 to-emerald-400", numText: "text-emerald-700", iconBg: "bg-emerald-50", iconText: "text-emerald-600", icon: <Eye className="h-4 w-4" /> },
          { label: "Akan Datang", value: upcomingCount, accentBar: "bg-gradient-to-r from-amber-500 to-amber-400", numText: "text-amber-700", iconBg: "bg-amber-50", iconText: "text-amber-600", icon: <Clock className="h-4 w-4" /> },
          { label: "Disembunyikan", value: inactiveCount, accentBar: "bg-gradient-to-r from-slate-400 to-slate-300", numText: "text-slate-600", iconBg: "bg-slate-100", iconText: "text-slate-500", icon: <EyeOff className="h-4 w-4" /> },
        ].map((stat, i) => (
          <div
            key={i}
            className="dash-card group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white transition-all duration-300 hover:shadow-md hover:border-slate-300/80"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`h-[3px] ${stat.accentBar}`} />
            <div className="p-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                {loading ? (
                  <div className="h-7 w-12 bg-slate-100 rounded-lg mt-1.5 animate-pulse" />
                ) : (
                  <p className={`text-2xl font-extrabold mt-1 tabular-nums tracking-tight dash-count ${stat.numText}`}>
                    {stat.value}
                  </p>
                )}
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} ${stat.iconText} flex items-center justify-center shrink-0 dash-icon-box`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      
      <div className="px-4 py-3 bg-[#1b365d]/[0.04] border border-[#1b365d]/10 rounded-xl text-sm text-[#1b365d] flex items-start gap-3">
        <CalendarDays className="h-4 w-4 shrink-0 mt-0.5 opacity-60" />
        <p className="text-xs leading-relaxed">
          Hingga <span className="font-semibold">3 agenda aktif</span> pertama (urutan terkecil) ditampilkan di bagian &quot;Program Kerja&quot; pada halaman utama website.
        </p>
      </div>

      
      {items.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            type="search"
            placeholder="Cari agenda..."
            className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      
      <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
        
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1b365d]/[0.06] flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-[#1b365d]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-800">Daftar Agenda</p>
              {!loading && items.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  <span className="tabular-nums font-semibold text-slate-500">{filteredItems.length}</span>
                  {filteredItems.length !== items.length ? ` dari ${items.length}` : ""} kegiatan
                </p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="h-[3px] bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-50 rounded animate-pulse" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-5 w-20 bg-slate-50 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-slate-50 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-7 w-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Belum ada agenda</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Tambahkan program atau kegiatan pertama untuk ditampilkan di halaman publik kelurahan.
            </p>
            <Button
              onClick={openCreate}
              size="sm"
              className="mt-5 bg-[#1b365d] hover:bg-[#152a48] text-white h-8 px-3.5 text-xs font-semibold rounded-lg"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Agenda
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              Tidak ada agenda yang cocok dengan &quot;{searchTerm}&quot;
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredItems.map((item, idx) => {
              const dateLabel = buildDateLabel(item);
              const timeLabel = buildTimeLabel(item);
              const catAccent: Record<string, string> = {
                blue: "from-blue-500 to-blue-400",
                emerald: "from-emerald-500 to-emerald-400",
                amber: "from-amber-500 to-amber-400",
                red: "from-red-500 to-red-400",
                purple: "from-purple-500 to-purple-400",
              };
              const accentGrad = catAccent[item.categoryColor] || "from-slate-400 to-slate-300";

              return (
                <div
                  key={item.id}
                  className={`dash-card group rounded-xl border border-slate-200/70 bg-white overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300/80 ${!item.active ? "opacity-60" : ""}`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className={`h-[3px] bg-gradient-to-r ${accentGrad}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-500 tabular-nums">
                          {item.order ?? idx}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-800 leading-snug">{item.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold ${badgeClass(item.categoryColor)}`}>
                              {item.category}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {dateLabel && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                                <CalendarDays className="h-3 w-3 text-slate-400 shrink-0" /> {dateLabel}
                              </span>
                            )}
                            {timeLabel && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" /> {timeLabel}
                              </span>
                            )}
                            {item.location && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {item.location}
                              </span>
                            )}
                            {item.schedule && (
                              <span className="text-[11px] text-slate-400 italic">{item.schedule}</span>
                            )}
                            {!dateLabel && !timeLabel && !item.location && item.timeLocation && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" /> {item.timeLocation}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                            item.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {item.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          <span className="hidden sm:inline">{item.active ? "Aktif" : "Sembunyi"}</span>
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1b365d] hover:bg-[#1b365d]/[0.06] transition-all"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(item)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={closeDialog}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col layanan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-br from-[#1b365d] to-[#264478] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">{editingId ? "Edit Agenda" : "Tambah Agenda"}</h2>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    {editingId ? "Perbarui informasi agenda kegiatan." : "Isi detail untuk agenda baru."}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDialog}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto">
              
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Informasi Utama</legend>
                <div>
                  <label htmlFor="ag-title" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Judul Agenda <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LayoutList className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                    <input
                      id="ag-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder='Contoh: Gerakan "Rabu Asri" Kelurahan'
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="ag-desc" className="block text-[11px] font-bold text-slate-600 mb-1">Deskripsi Singkat</label>
                  <Textarea
                    id="ag-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Deskripsi ringkas tentang agenda kegiatan ini..."
                    className="rounded-xl text-sm focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                  />
                </div>
              </fieldset>

              
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori</legend>
                <div>
                  <label htmlFor="ag-category" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Label Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ag-category"
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    placeholder="Contoh: Program Lingkungan"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Warna Kategori</label>
                  <div className="flex items-center gap-2">
                    {Object.entries(CATEGORY_COLORS).map(([val, { label, swatch }]) => (
                      <button
                        key={val}
                        type="button"
                        title={label}
                        onClick={() => setForm((p) => ({ ...p, categoryColor: val as AgendaItem["categoryColor"] }))}
                        className={`w-8 h-8 rounded-lg ${swatch} flex items-center justify-center transition-all ${
                          form.categoryColor === val
                            ? "ring-2 ring-offset-2 ring-[#1b365d] scale-110"
                            : "opacity-60 hover:opacity-100 hover:scale-105"
                        }`}
                      >
                        {form.categoryColor === val && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                  {form.category && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${badgeClass(form.categoryColor)}`}>
                        {form.category}
                      </span>
                    </div>
                  )}
                </div>
              </fieldset>

              
              <fieldset className="space-y-3 p-4 bg-slate-50/70 border border-slate-200/60 rounded-xl">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Jadwal Pelaksanaan</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ag-date-start" className="block text-[11px] font-bold text-slate-600 mb-1">
                      <CalendarDays className="inline h-3 w-3 mr-1 text-slate-400 -mt-px" />
                      Tanggal Mulai
                    </label>
                    <input
                      id="ag-date-start"
                      type="date"
                      value={form.dateStart}
                      onChange={(e) => setForm((p) => ({ ...p, dateStart: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="ag-date-end" className="block text-[11px] font-bold text-slate-600 mb-1">
                      <CalendarDays className="inline h-3 w-3 mr-1 text-slate-400 -mt-px" />
                      Tanggal Selesai
                    </label>
                    <input
                      id="ag-date-end"
                      type="date"
                      value={form.dateEnd}
                      min={form.dateStart || undefined}
                      onChange={(e) => setForm((p) => ({ ...p, dateEnd: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ag-time-start" className="block text-[11px] font-bold text-slate-600 mb-1">
                      <Clock className="inline h-3 w-3 mr-1 text-slate-400 -mt-px" />
                      Jam Mulai
                    </label>
                    <input
                      id="ag-time-start"
                      type="time"
                      value={form.timeStart}
                      onChange={(e) => setForm((p) => ({ ...p, timeStart: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="ag-time-end" className="block text-[11px] font-bold text-slate-600 mb-1">
                      <Clock className="inline h-3 w-3 mr-1 text-slate-400 -mt-px" />
                      Jam Selesai
                    </label>
                    <input
                      id="ag-time-end"
                      type="time"
                      value={form.timeEnd}
                      onChange={(e) => setForm((p) => ({ ...p, timeEnd: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                </div>
              </fieldset>

              
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Detail Tambahan</legend>
                <div>
                  <label htmlFor="ag-location" className="block text-[11px] font-bold text-slate-600 mb-1">Lokasi</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                    <input
                      id="ag-location"
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                      placeholder="Contoh: Aula Kantor Kelurahan"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="ag-schedule" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Frekuensi <span className="text-[10px] text-slate-400 font-normal ml-1">opsional, untuk agenda rutin</span>
                  </label>
                  <div className="relative">
                    <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                    <input
                      id="ag-schedule"
                      type="text"
                      value={form.schedule}
                      onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))}
                      placeholder="Contoh: Setiap Rabu / Bulanan"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                </div>
              </fieldset>

              
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pengaturan Tampilan</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ag-order" className="block text-[11px] font-bold text-slate-600 mb-1">Urutan Tampil</label>
                    <input
                      id="ag-order"
                      type="number"
                      min={0}
                      value={form.order}
                      onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:ring-offset-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="ag-status" className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, active: true }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          form.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" /> Aktif
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, active: false }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          !form.active
                            ? "bg-slate-100 text-slate-600 border-slate-300"
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <EyeOff className="h-3.5 w-3.5" /> Sembunyi
                      </button>
                    </div>
                  </div>
                </div>
              </fieldset>

              
              {form.title && (
                <div className="rounded-xl border border-[#1b365d]/10 bg-[#1b365d]/[0.02] overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-[#1b365d]/10 flex items-center gap-2">
                    <Eye className="h-3 w-3 text-[#1b365d]/40" />
                    <span className="text-[10px] font-bold text-[#1b365d]/50 uppercase tracking-widest">Preview Kartu Publik</span>
                  </div>
                  <div className="p-3.5">
                    <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden shadow-sm">
                      
                      <div className={`h-[3px] ${CATEGORY_COLORS[form.categoryColor]?.swatch || "bg-slate-300"}`} />
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${badgeClass(form.categoryColor)}`}>
                            {form.category || "Kategori"}
                          </span>
                          {form.schedule && (
                            <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                              <Repeat className="h-2.5 w-2.5" /> {form.schedule}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-slate-900 leading-snug">{form.title}</p>
                        {form.dateStart && (
                          <p className="text-[11px] text-slate-600 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-slate-400" />
                            {formatDateId(form.dateStart)}
                            {form.dateEnd && form.dateEnd !== form.dateStart && ` — ${formatDateId(form.dateEnd)}`}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 leading-relaxed">{form.description || "Deskripsi akan muncul di sini."}</p>
                        {(previewTimeLoc || form.timeLocation) && (
                          <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {previewTimeLoc || form.timeLocation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#1b365d] text-white rounded-xl text-xs font-bold hover:bg-[#152a48] disabled:bg-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambahkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden layanan-modal">
            <div className="p-5 bg-gradient-to-r from-red-600 to-red-500 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Hapus Agenda?</h3>
                  <p className="text-xs text-white/70 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                <p className="text-sm font-semibold text-slate-800">{confirmDelete.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{confirmDelete.category}</p>
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setConfirmDelete(null)} disabled={!!deleting}>
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={!!deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting === confirmDelete.id ? "Menghapus..." : "Ya, Hapus"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
