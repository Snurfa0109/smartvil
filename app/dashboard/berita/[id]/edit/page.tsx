"use client";

/**
 * [HALAMAN ADMIN / DASHBOARD] Form Pengubahan Artikel Berita
 * Pengubahan konten artikel, penyesuaian kategori warta, dan pembaruan gambar berita.
 */

import { useParams } from "next/navigation";
import BeritaEditor from "@/components/berita-editor";

export default function EditBeritaPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  return <BeritaEditor id={id} />;
}
