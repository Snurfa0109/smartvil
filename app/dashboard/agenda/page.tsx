"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

type AgendaItem = {
  id: string;
  title: string;
  category: string;
  categoryColor: "blue" | "emerald" | "amber" | "red" | "purple";
  schedule: string;
  description: string;
  timeLocation: string;
  active: boolean;
  order: number;
};

const CATEGORY_COLORS: Record<string, { label: string; badgeClass: string }> = {
  blue: { label: "Biru (Program Lingkungan)", badgeClass: "text-blue-800 bg-blue-50 border-blue-100" },
  emerald: { label: "Hijau (Bantuan Sosial)", badgeClass: "text-emerald-800 bg-emerald-50 border-emerald-100" },
  amber: { label: "Kuning (Kesehatan Warga)", badgeClass: "text-amber-800 bg-amber-50 border-amber-100" },
  red: { label: "Merah (Keamanan & Tanggap)", badgeClass: "text-red-800 bg-red-50 border-red-100" },
  purple: { label: "Ungu (Pendidikan & PKK)", badgeClass: "text-purple-800 bg-purple-50 border-purple-100" },
};

const EMPTY_FORM: Omit<AgendaItem, "id"> = {
  title: "",
  category: "",
  categoryColor: "blue",
  schedule: "",
  description: "",
  timeLocation: "",
  active: true,
  order: 0,
};

export default function AgendaDashboardPage() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AgendaItem, "id">>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<AgendaItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "agenda"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AgendaItem, "id">) })));
    } catch {
      try {
        const snap = await getDocs(collection(db, "agenda"));
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AgendaItem, "id">) })));
      } catch (err2) {
        console.error("Error fetching agenda:", err2);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
      alert("Judul dan Kategori wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "agenda", editingId), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "agenda"), { ...form, createdAt: serverTimestamp() });
      }
      await fetchItems();
      closeDialog();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan agenda.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AgendaItem) => {
    setDeleting(item.id);
    try {
      await deleteDoc(doc(db, "agenda", item.id));
      await fetchItems();
      setConfirmDelete(null);
    } catch {
      alert("Gagal menghapus agenda.");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (item: AgendaItem) => {
    try {
      await updateDoc(doc(db, "agenda", item.id), { active: !item.active });
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, active: !it.active } : it)));
    } catch {
      alert("Gagal mengubah status.");
    }
  };

  const badgeClass = (color: string) =>
    CATEGORY_COLORS[color]?.badgeClass || "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agenda & Program Kegiatan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola jadwal program lingkungan, bantuan sosial, dan kegiatan kemasyarakatan yang tampil di halaman beranda publik.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Tambah Agenda Baru
        </Button>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-3">
        <CalendarDays className="h-5 w-5 shrink-0 mt-0.5 text-blue-600" />
        <div>
          <p className="font-semibold">Agenda ini tampil otomatis di Halaman Beranda Publik</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Hingga 3 agenda aktif pertama (urutan terkecil) akan ditampilkan di bagian &quot;Program Kerja &amp; Jadwal Pelayanan Masyarakat&quot; pada halaman utama website.
          </p>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daftar Agenda ({items.length} total)</CardTitle>
          <CardDescription>
            Klik ikon mata untuk menyembunyikan/menampilkan agenda tanpa menghapusnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Belum ada agenda yang dibuat.</p>
              <p className="text-sm mt-1">Klik &quot;Tambah Agenda Baru&quot; untuk menambahkan program pertama.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs w-8">#</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs">Judul Agenda</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs hidden md:table-cell">Kategori</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs hidden lg:table-cell">Jadwal</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs w-32">Status</th>
                    <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors ${!item.active ? "opacity-50" : ""}`}
                    >
                      <td className="py-3.5 px-3 text-slate-400 text-xs font-mono">{item.order ?? idx}</td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900 leading-snug">{item.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</div>
                      </td>
                      <td className="py-3.5 px-3 hidden md:table-cell">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded border ${badgeClass(item.categoryColor)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-600 hidden lg:table-cell">{item.schedule}</td>
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                            item.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {item.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {item.active ? "Aktif" : "Disembunyikan"}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" className="h-8 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => openEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2.5 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(item)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="font-bold text-slate-900 text-base">{editingId ? "Edit Agenda" : "Tambah Agenda Baru"}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{editingId ? "Perbarui informasi agenda kegiatan." : "Isi detail agenda baru untuk ditampilkan di beranda."}</p>
              </div>
              <button onClick={closeDialog} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ag-title">Judul Agenda <span className="text-red-500">*</span></Label>
                <Input id="ag-title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder='Contoh: Gerakan "Rabu Asri" Kelurahan' />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ag-category">Label Kategori <span className="text-red-500">*</span></Label>
                  <Input id="ag-category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Contoh: Program Lingkungan" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ag-color">Warna Kategori</Label>
                  <select
                    id="ag-color"
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d]"
                    value={form.categoryColor}
                    onChange={(e) => setForm((p) => ({ ...p, categoryColor: e.target.value as AgendaItem["categoryColor"] }))}
                  >
                    {Object.entries(CATEGORY_COLORS).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ag-schedule">Frekuensi Jadwal</Label>
                <Input id="ag-schedule" value={form.schedule} onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))} placeholder="Contoh: Setiap Rabu / Sesuai Jadwal / Bulanan" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ag-desc">Deskripsi Singkat</Label>
                <Textarea id="ag-desc" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi ringkas tentang agenda kegiatan ini..." />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ag-time">Waktu & Lokasi Pelaksanaan</Label>
                <Input id="ag-time" value={form.timeLocation} onChange={(e) => setForm((p) => ({ ...p, timeLocation: e.target.value }))} placeholder="Contoh: 07:30 WIB - Selesai - Seluruh Lingkungan RW" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ag-order">Urutan Tampil</Label>
                  <Input id="ag-order" type="number" min={0} value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ag-status">Status Tampil</Label>
                  <select
                    id="ag-status"
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d]"
                    value={form.active ? "true" : "false"}
                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === "true" }))}
                  >
                    <option value="true">Aktif (Tampil di Beranda)</option>
                    <option value="false">Disembunyikan</option>
                  </select>
                </div>
              </div>

              {form.title && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Preview kartu:</p>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${badgeClass(form.categoryColor)}`}>
                        {form.category || "Kategori"}
                      </span>
                      <span className="text-xs text-slate-500">{form.schedule || "Jadwal"}</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900">{form.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{form.description || "Deskripsi akan muncul di sini."}</p>
                    {form.timeLocation && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                        <Clock className="h-3 w-3" /> {form.timeLocation}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 p-5 border-t border-slate-200">
              <Button variant="outline" onClick={closeDialog} disabled={saving}>Batal</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#1b365d] hover:bg-[#152a48] text-white font-semibold">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambahkan Agenda"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Hapus Agenda?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-semibold text-slate-800">{confirmDelete.title}</p>
              <p className="text-xs text-slate-500">{confirmDelete.category}</p>
            </div>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)} disabled={!!deleting}>Batal</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(confirmDelete)} disabled={!!deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting === confirmDelete.id ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
