import { getSetting, saveSetting } from "@/lib/settings-store";

export type SiteSettings = {
  // Identitas & Kontak Kelurahan
  villageName: string;
  villageAddress: string;
  villagePhone: string;
  villageEmail: string;
  instagramUrl: string;
  linktreeUrl: string;

  // Halaman Profil Publik (/profil)
  title: string;
  subtitle: string;
  history: string;
  vision: string;
  mission: string;

  // Geografis & Batas Wilayah
  geoArea: string;
  geoAreaDesc: string;
  geoCoord: string;
  geoCoordDesc: string;
  boundaryNorth: string;
  boundarySouth: string;
  boundaryEast: string;
  boundaryWest: string;

  // Identitas Wilayah & Peta
  kemendagriCode: string;
  postalCode: string;
  googleMapsEmbed: string;
  googleMapsUrl: string;

  // Struktur Aparatur Kelurahan
  headName: string;
  headTitle: string;
  headNip: string;
  headPhoto?: string;
  secretaryName: string;
  secretaryTitle: string;
  secretaryPhoto?: string;
  kasiPemerintahanName: string;
  kasiPemerintahanTitle: string;
  kasiPemerintahanPhoto?: string;
  kasiPelayananName: string;
  kasiPelayananTitle: string;
  kasiPelayananPhoto?: string;

  // Fasilitas & Kawasan Pemukiman Utama (/profil)
  facility1Title: string;
  facility1Desc: string;
  facility2Title: string;
  facility2Desc: string;
  facility3Title: string;
  facility3Desc: string;

  // Beranda / Landing Page (/)
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  counterStatus: "Buka" | "Tutup" | string;
  counterHours: string;
  counterDays: string;

  // Kontak Darurat Wilayah Terpadu
  emergencyHotline: string;
  emergencyPuskesmas: string;
  emergencyPolsek: string;
  emergencyKoramil: string;
  emergencyDamkar: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  // Identitas & Kontak Kelurahan
  villageName: "Kelurahan Banjar Agung",
  villageAddress: "Jl. Syech Nawawi Albantani No. 16, Kel. Banjar Agung, Kec. Cipocok Jaya, Kota Serang, Banten 42122",
  villagePhone: "0813-1505-3901",
  villageEmail: "kel.banjaragung@serang.go.id",
  instagramUrl: "https://www.instagram.com/kel.banjaragung/",
  linktreeUrl: "https://linktr.ee/kelurahanbanjaragung",

  // Halaman Profil Publik
  title: "Profil Kelurahan Banjar Agung",
  subtitle: "Kecamatan Cipocok Jaya, Kota Serang, Provinsi Banten — Melayani dengan Integritas dan Berorientasi Pelayanan Masyarakat.",
  history:
    "Banjaragung (atau Banjar Agung) merupakan salah satu kelurahan yang terletak di wilayah Kecamatan Cipocok Jaya, Kota Serang, Provinsi Banten. Dengan Kode Wilayah Kemendagri 36.73.05.1004 dan Kode Pos 42122, Kelurahan Banjar Agung memiliki posisi strategis di kawasan penyangga ibu kota Provinsi Banten.\n\n" +
    "Wilayah Kelurahan Banjar Agung mencakup pusat pemukiman masyarakat yang tumbuh pesat, di antaranya Perumahan Bumi Agung Permai (BAP) I & II serta Perumahan Bumi Mutiara Serang. Pelayanan kesehatan masyarakat didukung oleh fasilitas Puskesmas Banjar Agung yang siap melayani kebutuhan medis warga.\n\n" +
    "Dalam kehidupan bermasyarakat, warga Kelurahan Banjar Agung aktif memelihara kegotongroyongan melalui program lingkungan seperti 'Rabu Asri' (kerja bakti kebersihan dan penghijauan lingkungan), penyaluran bantuan sosial pangan dari Kemensos bagi warga prasejahtera, serta modernisasi pelayanan publik secara digital.",
  vision:
    "Terwujudnya Kelurahan Banjar Agung yang Religius, Asri, Sejahtera, dan Unggul dalam Pelayanan Publik Menuju Tata Kelola Kota Serang yang Maju dan Berkelanjutan.",
  mission:
    "Meningkatkan kualitas pelayanan administrasi kelurahan yang cepat, transparan, dan terintegrasi digital.\n" +
    "Mewujudkan lingkungan yang bersih, sehat, dan hijau secara berkelanjutan melalui gerakan 'Rabu Asri' dan kebersihan lingkungan warga.\n" +
    "Memperkuat jaring pengaman sosial melalui penyaluran bantuan pangan dan pendataan warga prasejahtera yang tepat sasaran.\n" +
    "Meningkatkan sinergi layanan kesehatan primer bersama Puskesmas Banjar Agung dan Posyandu di seluruh RW.\n" +
    "Menjaga kerukunan, ketertiban, dan ketenteraman warga bersama Bhabinkamtibmas dan Babinsa.",

  // Geografis & Batas Wilayah
  geoArea: "348 Ha",
  geoAreaDesc: "Kawasan pemukiman (BAP I & II, Bumi Mutiara), fasilitas umum, sentra usaha mikro, dan fasilitas kesehatan.",
  geoCoord: "6°7′25″S 106°11′54″E",
  geoCoordDesc: "Koordinat geografis: -6.12361, 106.19833 (Kecamatan Cipocok Jaya, Kota Serang, Banten).",
  boundaryNorth: "Kelurahan Panancangan",
  boundarySouth: "Kecamatan Curug / Kel. Kemanisan",
  boundaryEast: "Kecamatan Walantaka / Kel. Cigoong",
  boundaryWest: "Kelurahan Cipocok Jaya / Karundang",

  // Identitas Wilayah & Peta
  kemendagriCode: "36.73.05.1004",
  postalCode: "42122",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.553186774327!2d106.18526387499237!3d-6.132261593865507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e418b6f37a00001%3A0xfb48b3a8f7a1a77f!2sKelurahan%20Banjar%20Agung!5e0!3m2!1sid!2sid!4v1727188800000!5m2!1sid!2sid",
  googleMapsUrl: "https://maps.google.com/?q=Kelurahan+Banjar+Agung+Cipocok+Jaya+Kota+Serang",

  // Struktur Aparatur Kelurahan
  headName: "Ahmad Suhendar, S.Sos",
  headTitle: "Lurah Banjar Agung",
  headNip: "19780512 200501 1 004",
  headPhoto: "",
  secretaryName: "Hj. Siti Rohmah, S.AP",
  secretaryTitle: "Sekretaris Kelurahan",
  secretaryPhoto: "",
  kasiPemerintahanName: "Rizki Pratama, S.IP",
  kasiPemerintahanTitle: "Kasi Ketenteraman & Ketertiban",
  kasiPemerintahanPhoto: "",
  kasiPelayananName: "Dewi Sartika, S.E",
  kasiPelayananTitle: "Kasi Pelayanan Umum",
  kasiPelayananPhoto: "",

  // Fasilitas & Kawasan Pemukiman Utama
  facility1Title: "Perumahan BAP (Bumi Agung Permai)",
  facility1Desc: "Kawasan pemukiman terpadu BAP I dan BAP II dengan sarana warga yang tertata dan kebersamaan RT/RW yang aktif.",
  facility2Title: "Puskesmas Banjar Agung",
  facility2Desc: "Fasilitas pelayanan kesehatan masyarakat tingkat pertama untuk rawat jalan, imunisasi, posyandu balita & lansia.",
  facility3Title: "Perumahan Bumi Mutiara Serang",
  facility3Desc: "Kawasan hunian keluarga yang asri dan strategis, mendukung dinamika pertumbuhan wilayah Cipocok Jaya.",

  // Beranda / Landing Page
  heroBadge: "Portal Resmi Pelayanan Kelurahan Banjar Agung",
  heroTitle: "Pelayanan Administrasi Kelurahan yang Cepat, Transparan, & Akuntabel",
  heroSubtitle: "Sistem Informasi Pelayanan Publik Kelurahan Banjar Agung, Kecamatan Cipocok Jaya, Kota Serang. Pengajuan surat mandiri online, data kependudukan terpadu, transparansi program, dan kanal aspirasi masyarakat.",
  counterStatus: "Buka",
  counterHours: "08:00 - 15:30 WIB",
  counterDays: "Senin - Jumat",

  // Kontak Darurat Wilayah Terpadu
  emergencyHotline: "112",
  emergencyPuskesmas: "0813-1505-3901",
  emergencyPolsek: "0254-210110",
  emergencyKoramil: "0254-210220",
  emergencyDamkar: "0254-201113",
};

let cachedSettings: { data: SiteSettings; at: number } | null = null;
const SETTINGS_TTL_MS = 60_000;

/**
 * Fetch settings from MySQL `settings` table (key `profile`), merging with default settings
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (cachedSettings && Date.now() - cachedSettings.at < SETTINGS_TTL_MS) {
    return cachedSettings.data;
  }
  try {
    const stored = await getSetting<Partial<SiteSettings>>("profile", {});
    if (stored && Object.keys(stored).length > 0) {
      const merged = { ...DEFAULT_SITE_SETTINGS, ...stored };
      cachedSettings = { data: merged, at: Date.now() };
      return merged;
    }
  } catch (error) {
    console.error("Error fetching site settings:", error);
  }
  return cachedSettings?.data ?? DEFAULT_SITE_SETTINGS;
}

export function invalidateSiteSettings(): void {
  cachedSettings = null;
}

/**
 * Save settings to MySQL `settings` table (key `profile`)
 */
export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const current = await getSetting<Partial<SiteSettings>>("profile", {});
  await saveSetting("profile", { ...current, ...settings });
}
export const DEFAULT_BERITA_CATEGORIES = [
  "Pengumuman",
  "Kegiatan",
  "Kesehatan",
  "Pelatihan",
  "Pemerintahan",
  "Lainnya",
];

export async function getBeritaCategories(): Promise<string[]> {
  try {
    const stored = await getSetting<{ categories?: unknown }>("berita_categories", {});
    const categories = stored?.categories;
    if (Array.isArray(categories) && categories.length > 0) {
      return categories as string[];
    }
  } catch (error) {
    console.error("Error fetching berita categories:", error);
  }
  return DEFAULT_BERITA_CATEGORIES;
}

export async function saveBeritaCategories(categories: string[]): Promise<void> {
  await saveSetting("berita_categories", { categories });
}
