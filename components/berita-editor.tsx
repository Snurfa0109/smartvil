"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToStorage } from "@/lib/uploadImage";
import { writeAuditLog } from "@/lib/audit";
import { useState } from "react";
import { getBeritaCategories, DEFAULT_BERITA_CATEGORIES } from "@/lib/site-config";

// Categories loaded dynamically — see BeritaEditor component

type BeritaEditorProps = {
  id?: string | null;
};

function Toolbar({ editor }: { editor: Editor | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(editor);
  editorRef.current = editor;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || !editor) return;
    try {
      const url = await uploadImageToStorage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error("Upload gagal:", err);
      alert("Gagal mengunggah gambar.");
    }
    e.target.value = "";
  };

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border rounded-t-lg border-b-0 bg-muted/50">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-muted" : ""}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-muted" : ""}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? "bg-muted" : ""}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <span className="w-px h-5 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <span className="w-px h-5 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "bg-muted" : ""}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "bg-muted" : ""}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <span className="w-px h-5 bg-border mx-1" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        title="Sisipkan gambar"
      >
        <ImagePlus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function BeritaEditor({ id = null }: BeritaEditorProps) {
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
            alert("Gagal mengunggah gambar yang di-paste.");
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
            alert("Gagal mengunggah gambar.");
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
    getDoc(doc(db, "news", id))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setTitle(d.title ?? "");
          setCategory(d.category ?? "");
          setDate(d.date ?? new Date().toISOString().split("T")[0]);
          setImageUrl(d.imageUrl ?? "");
          const content = d.content ?? "";
          setLoadedContent(content || "<p></p>");
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Gagal memuat data berita.");
      });
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
      alert("Gagal mengunggah foto sampul.");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    if (!category) {
      alert("Pilih kategori berita.");
      return;
    }
    const content = editor.getHTML();
    if (!content || content === "<p></p>") {
      alert("Isi berita tidak boleh kosong.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        category,
        date,
        content,
        imageUrl: imageUrl.trim() || "/images/default-news.jpg",
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await updateDoc(doc(db, "news", id), payload);
        await writeAuditLog("UPDATE", "berita", `Memperbarui berita: "${title}" (Kategori: ${category})`);
        alert("Berita berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "news"), { ...payload, createdAt: serverTimestamp() });
        await writeAuditLog("CREATE", "berita", `Menerbitkan berita baru: "${title}" (Kategori: ${category})`);
        alert("Berita berhasil ditambahkan!");
      }
      router.push("/dashboard/berita");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/berita">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {id ? "Edit Berita" : "Tambah Berita Baru"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Berita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Berita</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Judul berita"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
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
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Foto Sampul Berita */}
            <div className="space-y-2 pt-3 border-t">
              <Label className="font-semibold text-slate-800">Foto Sampul (Cover Image)</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-48 h-32 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 relative shrink-0 shadow-xs">
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
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-xs font-medium">
                      Cover Kelurahan Default
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="Masukkan URL foto atau unggah langsung..."
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="shrink-0 text-xs gap-1.5"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      {uploadingCover ? "Mengunggah..." : "Unggah Foto"}
                    </Button>
                  </div>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-[11px] text-red-600 hover:underline block"
                    >
                      Hapus & gunakan foto kelurahan default
                    </button>
                  )}
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Jika tidak diunggah atau dikosongkan, sistem otomatis menggunakan foto kantor kelurahan default agar tampilan portal tetap rapi dan tidak kosong.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Isi Berita</CardTitle>
            <Button
              type="button"
              variant={showPreview ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <Edit3 className="h-4 w-4 mr-2" /> Edit
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <div
                className="berita-preview max-w-none min-h-[200px] p-4 border rounded-lg bg-muted/30"
                dangerouslySetInnerHTML={{
                  __html: editor?.getHTML() || "<p><em>Belum ada konten.</em></p>",
                }}
              />
            ) : (
              <>
                <Toolbar editor={editor} />
                <div className="border rounded-b-lg min-h-[280px] px-4 py-3 bg-background">
                  <EditorContent editor={editor} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Anda bisa paste gambar langsung (Ctrl+V) atau drag & drop gambar ke editor.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/berita">Batal</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
