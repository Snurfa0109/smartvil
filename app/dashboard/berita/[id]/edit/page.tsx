"use client";

/**
 * @layer Frontend (Admin / Dashboard)
 * @role Form Pengubahan Berita
 * @access Terautentikasi (Admin / Staf Kelurahan)
 * @description Halaman antarmuka untuk memperbarui konten, kategori, dan gambar thumbnail artikel berita yang telah ada.
 */

import { useParams } from "next/navigation";
import BeritaEditor from "@/components/berita-editor";

export default function EditBeritaPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  return <BeritaEditor id={id} />;
}
