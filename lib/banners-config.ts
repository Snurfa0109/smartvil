import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
    // Simbol Landmark Kota Serang: Jembatan Raden Aria Wangsakara (Bogeg) Ultra HD
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
    // Simbol Wilayah Kelurahan: Panorama lanskap pemukiman kelurahan hijau asri dan pegunungan Banten
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
    // Simbol Data & Teknologi: Visualisasi analitik data kependudukan, chart digital 3D, dan smart city dashboard
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
    // Simbol Administrasi Surat: Dokumen resmi negara, stempel cap, dan pena eksekutif tanda tangan tanpa orang
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
    // Simbol Aspirasi & Keadilan: Timbangan keadilan condong di kanan dengan ruang kosong gelap di kiri
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
    // Simbol Berita & Pers: Lembaran warta berita cetak dan media dokumentasi tanpa orang
    imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1920&q=85",
    imageMeaning: "Warta Media: Melambangkan penyebaran informasi yang akurat, terpercaya, dan mencerdaskan masyarakat.",
    actionText: "Jelajahi Berita",
    actionUrl: "#list-berita",
  },
};

/**
 * Mengambil konfigurasi seluruh banner dari Firestore `settings/banners`.
 */
export async function getAllBanners(): Promise<Record<BannerPages, PageBannerData>> {
  try {
    const ref = doc(db, "settings", "banners");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<Record<BannerPages, Partial<PageBannerData>>>;
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
 * Menyimpan banner untuk halaman tertentu ke Firestore `settings/banners`.
 */
export async function saveBanner(pageKey: BannerPages, config: Partial<PageBannerData>): Promise<void> {
  const ref = doc(db, "settings", "banners");
  await setDoc(ref, { [pageKey]: config }, { merge: true });
}
