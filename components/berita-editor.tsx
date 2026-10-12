"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ImagePlus,
  Eye,
  Edit3,
  ArrowLeft,
  Save,
  Newspaper,
  Calendar,
  Tag,
  FileText,
  Upload,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { uploadImageToStorage } from "@/lib/uploadImage";
import { writeAuditLog } from "@/lib/audit";
import { useState } from "react";
import { getBeritaCategories, DEFAULT_BERITA_CATEGORIES } from "@/lib/site-config";
import { apiGet, apiUpdate, apiInsert } from "@/lib/api";

type BeritaEditorProps = {
  id?: string | null;
};

function Toolbar({ editor }: { editor: Editor | null }) {
  const { success, error: showError, warning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || !editor) return;
    try {
      const url = await uploadImageToStorage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error("Upload gagal:", err);
      showError("Gagal mengunggah gambar.");
    }
    e.target.value = "";
  };

  if (!editor) return null;

  const ToolBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 ${
        active
          ? "bg-[#1b365d] text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border border-slate-200 rounded-t-xl bg-slate-50/80 border-b-0">
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolBtn>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
        <Heading1 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <Heading3 className="h-3.5 w-3.5" />
      </ToolBtn>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
        <List className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolBtn>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <ToolBtn onClick={() => fileInputRef.current?.click()} title="Sisipkan gambar">
        <ImagePlus className="h-3.5 w-3.5" />
      </ToolBtn>
    </div>
  );
}

export default function BeritaEditor({ id = null }: BeritaEditorProps) {
  const { success, error: showError, warning } = useToast();
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [loadedContent, setLoadedContent] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_BERITA_CATEGORIES);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({ placeholder: "Tulis isi berita di sini..." }),
    ],
    content: "<p></p>",
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        const item = Array.from(items).find((i) => i.type.startsWith("image/"));
        if (!item) return false;
        const file = item.getAsFile();
        if (!file) return false;
        const ed = editorRef.current;
        if (!ed) return false;
        uploadImageToStorage(file)
          .then((url) => {
            ed.chain().focus().setImage({ src: url }).run();
          })
          .catch((err) => {
            console.error("Upload paste gagal:", err);
            showError("Gagal mengunggah gambar yang di-paste.");
          });
        event.preventDefault();
        return true;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = Array.from(files).find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        const ed = editorRef.current;
        if (!ed) return false;
        event.preventDefault();
        uploadImageToStorage(file)
          .then((url) => {
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coordinates) {
              ed.chain().focus().insertContentAt(coordinates.pos, { type: "image", attrs: { src: url } }).run();
            } else {
              ed.chain().focus().setImage({ src: url }).run();
            }
          })
          .catch((err) => {
            console.error("Upload drop gagal:", err);
            showError("Gagal mengunggah gambar.");
          });
        return true;
      },
    },
  });

  useEffect(() => {
    if (editor) editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor]);

  useEffect(() => {
    getBeritaCategories().then(setCategories).catch(() => setCategories(DEFAULT_BERITA_CATEGORIES));
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const loadBerita = async () => {
      try {
        const data = await apiGet("news", id);
        if (data) {
          setTitle(data.title ?? "");
          setCategory(data.category ?? "");
          setDate(data.date ?? new Date().toISOString().split("T")[0]);
          setImageUrl(data.image_url ?? "");
          const content = data.content ?? "";
          setLoadedContent(content || "<p></p>");
        }
        setLoading(false);
      } catch {
        setLoading(false);
        showError("Gagal memuat data berita.");
      }
    };
    loadBerita();
  }, [id]);

  useEffect(() => {
    if (editor && loadedContent !== null) {
      editor.commands.setContent(loadedContent);
      setLoadedContent(null);
    }
  }, [editor, loadedContent]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingCover(true);
    try {
      const url = await uploadImageToStorage(file, "news-covers");
      setImageUrl(url);
    } catch (err) {
      console.error("Upload cover gagal:", err);
      showError("Gagal mengunggah foto sampul.");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    if (!category) {
      warning("Pilih kategori berita.");
      return;
    }
    const content = editor.getHTML();
    if (!content || content === "<p></p>") {
      warning("Isi berita tidak boleh kosong.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        category,
        date,
        content,
        image_url: imageUrl.trim() || "/images/default-news.jpg",
      };
      if (id) {
        await apiUpdate("news", id, payload);
        await writeAuditLog("UPDATE", "berita", `Memperbarui berita: "${title}" (Kategori: ${category})`);
        success("Berita berhasil diperbarui!");
      } else {
        await apiInsert("news", { id: crypto.randomUUID(), ...payload });
        await writeAuditLog("CREATE", "berita", `Menerbitkan berita baru: "${title}" (Kategori: ${category})`);
        success("Berita berhasil ditambahkan!");
      }
      router.push("/dashboard/berita");
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1b365d] rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Memuat data berita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/berita"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-[#1b365d] hover:border-[#1b365d]/30 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b365d] to-[#264478] flex items-center justify-center shadow-md shadow-[#1b365d]/15">
              {id ? <Edit3 className="h-[18px] w-[18px] text-white" /> : <FileText className="h-[18px] w-[18px] text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {id ? "Edit Berita" : "Tulis Berita Baru"}
              </h1>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {id ? "Perbarui konten artikel yang sudah terbit" : "Buat artikel baru untuk portal kelurahan"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showPreview ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-9 text-xs font-bold rounded-xl"
          >
            {showPreview ? (
              <><Edit3 className="h-3.5 w-3.5 mr-1.5" /> Mode Edit</>
            ) : (
              <><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview</>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Two-column layout */}
        <div className="grid lg:grid-cols-12 gap-5 items-start">

          {/* Left: Main content */}
          <div className="lg:col-span-8 space-y-5">
            {/* Title input — large, prominent */}
            <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
              <div className="p-5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Judul Artikel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Tulis judul berita yang menarik..."
                  className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 border-0 outline-none bg-transparent leading-tight"
                />
              </div>
            </div>

            {/* Editor */}
            <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-[#1b365d]" />
                  <span className="text-[13px] font-bold text-slate-800">Isi Berita</span>
                </div>
              </div>

              <div className="px-5 pb-5">
                {showPreview ? (
                  <div
                    className="berita-preview max-w-none min-h-[300px] p-5 border border-slate-200 rounded-xl bg-slate-50/50"
                    dangerouslySetInnerHTML={{
                      __html: editor?.getHTML() || "<p><em>Belum ada konten.</em></p>",
                    }}
                  />
                ) : (
                  <>
                    <Toolbar editor={editor} />
                    <div className="border border-slate-200 border-t-0 rounded-b-xl min-h-[300px] px-5 py-4 bg-white focus-within:ring-2 focus-within:ring-[#1b365d]/10 focus-within:border-[#1b365d]/30 transition-all">
                      <EditorContent editor={editor} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400">
                      <Info className="h-3 w-3 text-slate-300" />
                      <span>Paste gambar langsung (Ctrl+V) atau drag & drop ke editor.</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Sidebar — metadata */}
          <div className="lg:col-span-4 space-y-5">
            {/* Publish settings */}
            <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#c9971c]" />
                <span className="text-[13px] font-bold text-slate-800">Pengaturan Publikasi</span>
              </div>

              <div className="p-5 pt-3 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Terbit</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cover image */}
            <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-emerald-600" />
                <span className="text-[13px] font-bold text-slate-800">Foto Sampul</span>
              </div>

              <div className="p-5 pt-3 space-y-3">
                {/* Preview */}
                <div className="w-full aspect-[16/9] rounded-xl border border-slate-200/80 overflow-hidden bg-slate-100 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl || "/images/default-news.jpg"}
                    alt="Preview Sampul"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/default-news.jpg";
                    }}
                  />
                  {!imageUrl && (
                    <span className="absolute bottom-2 left-2 right-2 text-center bg-black/50 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm font-medium">
                      Cover Default Kelurahan
                    </span>
                  )}
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload area */}
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="URL gambar atau unggah file..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="text-xs"
                  />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#1b365d]/30 hover:text-[#1b365d] hover:bg-[#1b365d]/[0.02] transition-all text-xs font-medium disabled:opacity-40"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingCover ? "Mengunggah..." : "Unggah dari Komputer"}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Jika dikosongkan, otomatis menggunakan foto kantor kelurahan default.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={saving}
                className="w-full h-11 bg-[#1b365d] hover:bg-[#152a48] text-white font-bold text-sm rounded-xl shadow-md shadow-[#1b365d]/15"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </span>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> {id ? "Perbarui Berita" : "Terbitkan Berita"}</>
                )}
              </Button>
              <Link href="/dashboard/berita" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-xs font-medium rounded-xl border-slate-200"
                >
                  Batal & Kembali
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
