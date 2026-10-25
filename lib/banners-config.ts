/**
 * [CORE LIBRARY / SISTEM] Konfigurasi Gambar Banner & Hero Halaman
 * Definisi daftar gambar banner bawaan, metadata resolusi, dan teks default per halaman.
 */

import { getSetting, saveSetting } from "@/lib/settings-store";

export interface PageBannerData {
  enabledCustom: boolean;        // Jika true, gunakan banner event/custom ini
  badge: string;                 // Badge atas (misal: "PORTAL RESMI PELAYANAN KELURAHAN BANJAR AGUNG")
  title: string;                 // Judul utama banner
  subtitle: string;              // Subjudul banner
  imageUrl: string;              // URL gambar latar belakang simbolis tanpa orang (objek/arsitektur)
  imageMeaning: string;          // Makna filosofis gambar tersebut
  eventDate?: string;            // Tanggal pelaksanaan (jika mode event)
  actionText?: string;           // Tombol utama (misal: "Lihat Layanan")
  actionUrl?: string;            // Tautan tombol utama
  secondaryActionText?: string;  // Tombol kedua (misal: "Pengaduan Online")
  secondaryActionUrl?: string;   // Tautan tombol kedua
}

export type BannerPages = "beranda" | "profil" | "berita" | "data" | "layanan" | "pengaduan";

/**
 * Foto-foto simbolik formal pemerintahan TANPA GAMBAR ORANG:
 * - Pengaduan: Timbangan keadilan (Scales of Justice)
 * - Layanan Surat: Dokumen resmi, pena eksekutif, dan stempel administrasi
 * - Informasi: Infografis, chart analitik digital & peta tata ruang
 * - Profil: Pilar arsitektur marmer pemerintahan yang kokoh & berintegritas
 * - Beranda: Gedung balai pemerintahan megah dan gerbang pelayanan publik
 */
export const DEFAULT_PAGE_BANNERS: Record<BannerPages, PageBannerData> = {
  beranda: {
    enabledCustom: false,
    badge: "PORTAL RESMI PELAYANAN KELURAHAN BANJAR AGUNG",
    title: "Pelayanan Administrasi Kelurahan yang Cepat, Transparan, & Akuntabel",
    subtitle: "Sistem Informasi Pelayanan Publik Kelurahan Banjar Agung, Kecamatan Cipocok Jaya, Kota Serang. Pengajuan surat mandiri online, data kependudukan terpadu, transparansi program, dan kanal aspirasi masyarakat.",
    imageUrl: "/images/banner-beranda-bogeg.jpg",
    imageMeaning: "Jembatan Raden Aria Wangsakara (Jembatan Bogeg): Landmark ikonik kebanggaan Kota Serang dan urat nadi penghubung wilayah Cipocok Jaya dengan ornamen batik Banten, melambangkan kemajuan infrastruktur, konektivitas masyarakat, dan gerbang kemakmuran Banjar Agung.",
    actionText: "Lihat Layanan",
    actionUrl: "/layanan",
    secondaryActionText: "Pengaduan Online",
    secondaryActionUrl: "/pengaduan",
  },
  profil: {
    enabledCustom: false,
    badge: "PROFIL & WILAYAH • KECAMATAN CIPOCOK JAYA",
    title: "Profil Kelurahan Banjar Agung",
    subtitle: "Kecamatan Cipocok Jaya, Kota Serang, Provinsi Banten — Melayani dengan Integritas dan Berorientasi Pelayanan Masyarakat.",
    imageUrl: "/images/banner-profil.jpg",
    imageMeaning: "Panorama Wilayah Kelurahan: Menggambarkan bentang wilayah Kelurahan Banjar Agung yang asri, hijau, dan damai, berorientasi pada keharmonisan warga dan kemajuan lingkungan.",
    actionText: "Struktur Aparatur",
    actionUrl: "#aparatur",
    secondaryActionText: "Sejarah Wilayah",
    secondaryActionUrl: "#sejarah",
  },
  data: {
    enabledCustom: false,
    badge: "KETERBUKAAN INFORMASI PUBLIK & SATU DATA",
    title: "Informasi & Infografis Kependudukan",
    subtitle: "Pusat satu data statistik demografi warga, piramida kependudukan, warta publikasi kelurahan, dan direktori layanan resmi terpadu.",
    imageUrl: "/images/banner-informasi.jpg",
    imageMeaning: "Visualisasi Data Digital & Statistik Kependudukan: Menggambarkan tata kelola Satu Data Kelurahan berbasis teknologi analitik yang transparan, modern, dan akurat.",
    actionText: "Lihat Infografis",
    actionUrl: "#demografi",
    secondaryActionText: "Warta & Berita",
    secondaryActionUrl: "#warta",
  },
  layanan: {
    enabledCustom: false,
    badge: "PELAYANAN ADMINISTRASI TERPADU KELURAHAN (PATEN)",
    title: "Layanan Administrasi Surat Kelurahan",
    subtitle: "Pengajuan surat pengantar dan keterangan resmi secara mandiri online. Cepat, transparan, terverifikasi otomatis, dan 100% bebas biaya retribusi (Gratis).",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1920&q=85",
    imageMeaning: "Dokumen & Pena Administrasi: Melambangkan keabsahan hukum surat keterangan, kecepatan verifikasi, dan tertib administrasi bebas calo.",
    actionText: "Buat Surat Mandiri",
    actionUrl: "#buat-surat",
    secondaryActionText: "Lacak Permohonan",
    secondaryActionUrl: "#lacak-surat",
  },
  pengaduan: {
    enabledCustom: false,
    badge: "KANAL ASPIRASI & PENGADUAN MASYARAKAT",
    title: "Layanan Pengaduan & Aspirasi Warga",
    subtitle: "Sampaikan keluhan fasilitas lingkungan, kebersihan, dan pelayanan publik. Seluruh laporan diverifikasi dan ditindaklanjuti secara adil dan transparan.",
    imageUrl: "/images/banner-pengaduan.jpg",
    imageMeaning: "Timbangan Keadilan Warga: Melambangkan integritas aparatur dalam menampung aspirasi masyarakat dengan adil, objektif, dan setara tanpa diskriminasi.",
    actionText: "Tulis Pengaduan",
    actionUrl: "#formulir",
    secondaryActionText: "Cek Riwayat Aduan",
    secondaryActionUrl: "#riwayat",
  },
  berita: {
    enabledCustom: false,
    badge: "WARTA RESMI & PUBLIKASI PEMERINTAHAN",
    title: "Warta & Publikasi Resmi Kelurahan",
    subtitle: "Pemberitaan resmi kegiatan aparatur, siaran pers agenda pembangunan, dan pengumuman program bantuan sosial Kelurahan Banjar Agung.",
    imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1920&q=85",
    imageMeaning: "Warta Media: Melambangkan penyebaran informasi yang akurat, terpercaya, dan mencerdaskan masyarakat.",
    actionText: "Jelajahi Berita",
    actionUrl: "#list-berita",
  },
};

/**
 * Mengambil konfigurasi seluruh banner dari settings store.
 */
export async function getAllBanners(): Promise<Record<BannerPages, PageBannerData>> {
  try {
    const data = await getSetting<Partial<Record<BannerPages, Partial<PageBannerData>>>>("banners", {});
    if (data && typeof data === "object") {
      const merged = { ...DEFAULT_PAGE_BANNERS };
      for (const key of Object.keys(DEFAULT_PAGE_BANNERS) as BannerPages[]) {
        if (data[key]) {
          merged[key] = {
            ...DEFAULT_PAGE_BANNERS[key],
            ...data[key],
          };
        }
      }
      return merged;
    }
  } catch (error) {
    console.error("Error fetching banners config:", error);
  }
  return DEFAULT_PAGE_BANNERS;
}

/**
 * Menyimpan banner untuk halaman tertentu ke settings store.
 */
export async function saveBanner(pageKey: BannerPages, config: Partial<PageBannerData>): Promise<void> {
  const current = await getAllBanners();
  const updated = {
    ...current,
    [pageKey]: {
      ...current[pageKey],
      ...config,
    },
  };
  await saveSetting("banners", updated);
}
