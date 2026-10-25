"use client";

/**
 * @layer Frontend (Admin / Dashboard)
 * @role Form Pembuatan Berita Baru
 * @access Terautentikasi (Admin / Staf Kelurahan)
 * @description Halaman antarmuka untuk menyusun dan menerbitkan artikel berita baru menggunakan rich text editor.
 */

import BeritaEditor from "@/components/berita-editor";

export default function TambahBeritaPage() {
  return <BeritaEditor />;
}
