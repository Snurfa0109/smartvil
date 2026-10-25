/**
 * @layer Core / Library
 * @role Konfigurasi profil kelurahan dan data situs
 * @access Server-side / Client-side
 * @description Menyimpan konfigurasi default kelurahan, struktur aparat, data wilayah, dan sinkronisasi settings.
 */
import { getSetting, saveSetting } from "@/lib/settings-store";

export type OfficialItem = {
  id: string;
  name: string;
  title: string;
  nip?: string;
  photo?: string;
  roleBadge?: string; // "LURAH" | "SEKRETARIAT" | "KASI" | "STAF" | "MITRA"
  division?: string;
  duties?: string;
};

export type FacilityItem = {
  id: string;
  title: string;
  desc: string;
  category?: string;
};

export type ExternalLinkItem = {
  id: string;
  name: string;
  desc: string;
  url: string;
  badge: string;
  category: string;
};

export type DemographySettings = {
  total: number;
  male: number;
  female: number;
  kk: number;
  ageChildren: number; // 0 - 17 tahun
  ageAdults: number;   // 18 - 59 tahun
  ageSeniors: number;  // 60+ tahun
  updatedPeriod: string; // e.g. "Semester II Tahun 2026"
  source: string; // e.g. "Rekapitulasi Monografi BPS & Kelurahan"
};

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

  // Struktur Aparatur Kelurahan (Legacy Single + Dynamic List)
  headName: string;
  headTitle: string;
  headNip: string;
  headPhoto?: string;
  secretaryName: string;
  secretaryTitle: string;
  secretaryNip?: string;
  secretaryPhoto?: string;
  kasiPemerintahanName: string;
  kasiPemerintahanTitle: string;
  kasiPemerintahanNip?: string;
  kasiPemerintahanPhoto?: string;
  kasiPelayananName: string;
  kasiPelayananTitle: string;
  kasiPelayananNip?: string;
  kasiPelayananPhoto?: string;
  officials?: OfficialItem[];

  // Fasilitas & Kawasan Pemukiman Utama (/profil - Dynamic List)
  facility1Title: string;
  facility1Desc: string;
  facility2Title: string;
  facility2Desc: string;
  facility3Title: string;
  facility3Desc: string;
  facilities?: FacilityItem[];

  // Informasi & Statistik Publik (/data)
  demography?: DemographySettings;
  externalLinks?: ExternalLinkItem[];

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
    "Wilayah Kelurahan Banjar Agung mencakup pusat pemukiman masyarakat yang tumbuh pesat, di antaranya Perumahan Bumi Mutiara Serang. Pelayanan kesehatan masyarakat didukung oleh fasilitas Puskesmas Banjar Agung yang siap melayani kebutuhan medis warga.\n\n" +
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
  geoAreaDesc: "Kawasan pemukiman (Bumi Mutiara Serang), fasilitas umum, sentra usaha mikro, dan fasilitas kesehatan.",
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
  secretaryNip: "19820315 200801 2 007",
  secretaryPhoto: "",
  kasiPemerintahanName: "Rizki Pratama, S.IP",
  kasiPemerintahanTitle: "Kasi Ketenteraman & Ketertiban",
  kasiPemerintahanNip: "19850920 201001 1 012",
  kasiPemerintahanPhoto: "",
  kasiPelayananName: "Dewi Sartika, S.E",
  kasiPelayananTitle: "Kasi Pelayanan Umum",
  kasiPelayananNip: "19871104 201202 2 005",
  kasiPelayananPhoto: "",

  // Fasilitas & Kawasan Pemukiman Utama (Default List)
  facility1Title: "Puskesmas Banjar Agung",
  facility1Desc: "Fasilitas pelayanan kesehatan masyarakat tingkat pertama untuk rawat jalan, imunisasi, posyandu balita & lansia.",
  facility2Title: "Perumahan Bumi Mutiara Serang",
  facility2Desc: "Kawasan hunian keluarga yang asri dan strategis, mendukung dinamika pertumbuhan wilayah Cipocok Jaya.",
  facility3Title: "",
  facility3Desc: "",
  facilities: [
    {
      id: "fac-1",
      title: "Puskesmas Banjar Agung",
      desc: "Fasilitas pelayanan kesehatan masyarakat tingkat pertama untuk rawat jalan, imunisasi, posyandu balita & lansia.",
      category: "Kesehatan",
    },
    {
      id: "fac-2",
      title: "Perumahan Bumi Mutiara Serang",
      desc: "Kawasan hunian keluarga yang asri dan strategis, mendukung dinamika pertumbuhan wilayah Cipocok Jaya.",
      category: "Hunian / Pemukiman",
    },
  ],

  // Struktur Aparatur Kelurahan (Default List)
  officials: [
    {
      id: "off-1",
      name: "Ahmad Suhendar, S.Sos",
      title: "Lurah Banjar Agung",
      nip: "19780512 200501 1 004",
      photo: "",
      roleBadge: "LURAH",
      division: "Pimpinan Wilayah",
      duties: "Penanggung jawab kebijakan wilayah, pembinaan kemasyarakatan, dan penandatanganan legalitas surat resmi warga.",
    },
    {
      id: "off-2",
      name: "Hj. Siti Rohmah, S.AP",
      title: "Sekretaris Kelurahan",
      nip: "19820315 200801 2 007",
      photo: "",
      roleBadge: "SEKRETARIAT",
      division: "Sekretariat Kelurahan",
      duties: "Koordinator tata usaha, pengelolaan anggaran, dan administrasi kepegawaian internal kelurahan.",
    },
    {
      id: "off-3",
      name: "Rizki Pratama, S.IP",
      title: "Kasi Ketenteraman & Ketertiban",
      nip: "19850920 201001 1 012",
      photo: "",
      roleBadge: "KASI",
      division: "Wilayah & Ketertiban Umum",
      duties: "Pembinaan ketertiban umum, penanganan sengketa warga, dan koordinasi dengan ketua 8 RW & 32 RT.",
    },
    {
      id: "off-4",
      name: "Dewi Sartika, S.E",
      title: "Kasi Pelayanan Umum",
      nip: "19871104 201202 2 005",
      photo: "",
      roleBadge: "KASI",
      division: "Administrasi & Pelayanan",
      duties: "Verifikasi berkas persyaratan surat keterangan, legalisasi dokumen kependudukan, dan loket PATEN.",
    },
  ],

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

  // Informasi & Statistik Publik (/data)
  demography: {
    total: 0,
    male: 0,
    female: 0,
    kk: 0,
    ageChildren: 0,
    ageAdults: 0,
    ageSeniors: 0,
    updatedPeriod: "Semester II Tahun 2026",
    source: "Data Kependudukan Kelurahan",
  },
  externalLinks: [
    {
      id: "link-1",
      name: "Kecamatan Cipocok Jaya",
      desc: "Portal resmi Kecamatan Cipocok Jaya — informasi kegiatan, layanan, dan pengumuman wilayah kecamatan.",
      url: "https://cipocokjaya.serangkota.go.id",
      badge: "Kecamatan",
      category: "Pemerintah Wilayah",
    },
    {
      id: "link-2",
      name: "Pemerintah Kota Serang",
      desc: "Portal utama Pemerintah Kota Serang — berita resmi, agenda pemerintahan, dan layanan publik kota.",
      url: "https://serangkota.go.id",
      badge: "Kota Serang",
      category: "Pemerintah Wilayah",
    },
    {
      id: "link-3",
      name: "Cek Bansos Kemensos RI",
      desc: "Cek status penerima program bantuan sosial PKH, BPNT, dan program perlindungan sosial lainnya dari Kemensos.",
      url: "https://cekbansos.kemensos.go.id",
      badge: "Bansos",
      category: "Bantuan Sosial & Kesejahteraan",
    },
    {
      id: "link-4",
      name: "DTKS Online — Data Terpadu Kessos",
      desc: "Portal pendataan keluarga miskin dan rentan untuk keperluan program perlindungan sosial pemerintah pusat.",
      url: "https://dtks.kemensos.go.id",
      badge: "Kesejahteraan",
      category: "Bantuan Sosial & Kesejahteraan",
    },
    {
      id: "link-5",
      name: "Dukcapil Kemendagri",
      desc: "Layanan kependudukan nasional: e-KTP, KK, akta kelahiran, dan dokumen administrasi kependudukan online.",
      url: "https://dukcapil.kemendagri.go.id",
      badge: "Adminduk",
      category: "Kependudukan & Administrasi",
    },
    {
      id: "link-6",
      name: "Disdukcapil Kota Serang",
      desc: "Dinas Kependudukan dan Pencatatan Sipil Kota Serang — layanan cetak dokumen dan informasi administrasi lokal.",
      url: "https://disdukcapil.serangkota.go.id",
      badge: "Dukcapil Lokal",
      category: "Kependudukan & Administrasi",
    },
    {
      id: "link-7",
      name: "BPJS Kesehatan",
      desc: "Portal resmi BPJS Kesehatan — cek kepesertaan JKN, cetak kartu digital, dan informasi fasilitas kesehatan terdekat.",
      url: "https://bpjs-kesehatan.go.id",
      badge: "JKN/BPJS",
      category: "Kesehatan",
    },
    {
      id: "link-8",
      name: "LAPOR! — Layanan Aspirasi & Pengaduan",
      desc: "Platform pengaduan online nasional terintegrasi lintas instansi pemerintah pusat dan daerah.",
      url: "https://lapor.go.id",
      badge: "Aspirasi",
      category: "Layanan Digital Nasional",
    },
  ],
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
      const merged: SiteSettings = { ...DEFAULT_SITE_SETTINGS, ...stored };
      
      // Pastikan facilities terisi
      if (!Array.isArray(merged.facilities) || merged.facilities.length === 0) {
        merged.facilities = [
          { id: "fac-1", title: merged.facility1Title || DEFAULT_SITE_SETTINGS.facility1Title, desc: merged.facility1Desc || DEFAULT_SITE_SETTINGS.facility1Desc, category: "Kesehatan" },
          { id: "fac-2", title: merged.facility2Title || DEFAULT_SITE_SETTINGS.facility2Title, desc: merged.facility2Desc || DEFAULT_SITE_SETTINGS.facility2Desc, category: "Hunian / Pemukiman" },
        ];
      }

      // Pastikan officials terisi
      if (!Array.isArray(merged.officials) || merged.officials.length === 0) {
        merged.officials = [
          {
            id: "off-1",
            name: merged.headName || DEFAULT_SITE_SETTINGS.headName,
            title: merged.headTitle || DEFAULT_SITE_SETTINGS.headTitle,
            nip: merged.headNip || DEFAULT_SITE_SETTINGS.headNip,
            photo: merged.headPhoto || "",
            roleBadge: "LURAH",
            division: "Pimpinan Wilayah",
            duties: "Penanggung jawab kebijakan wilayah, pembinaan kemasyarakatan, dan penandatanganan legalitas surat resmi warga.",
          },
          {
            id: "off-2",
            name: merged.secretaryName || DEFAULT_SITE_SETTINGS.secretaryName,
            title: merged.secretaryTitle || DEFAULT_SITE_SETTINGS.secretaryTitle,
            nip: merged.secretaryNip || DEFAULT_SITE_SETTINGS.secretaryNip,
            photo: merged.secretaryPhoto || "",
            roleBadge: "SEKRETARIAT",
            division: "Sekretariat Kelurahan",
            duties: "Koordinator tata usaha, pengelolaan anggaran, dan administrasi kepegawaian internal kelurahan.",
          },
          {
            id: "off-3",
            name: merged.kasiPemerintahanName || DEFAULT_SITE_SETTINGS.kasiPemerintahanName,
            title: merged.kasiPemerintahanTitle || DEFAULT_SITE_SETTINGS.kasiPemerintahanTitle,
            nip: merged.kasiPemerintahanNip || DEFAULT_SITE_SETTINGS.kasiPemerintahanNip,
            photo: merged.kasiPemerintahanPhoto || "",
            roleBadge: "KASI",
            division: "Wilayah & Ketertiban Umum",
            duties: "Pembinaan ketertiban umum, penanganan sengketa warga, dan koordinasi dengan ketua 8 RW & 32 RT.",
          },
          {
            id: "off-4",
            name: merged.kasiPelayananName || DEFAULT_SITE_SETTINGS.kasiPelayananName,
            title: merged.kasiPelayananTitle || DEFAULT_SITE_SETTINGS.kasiPelayananTitle,
            nip: merged.kasiPelayananNip || DEFAULT_SITE_SETTINGS.kasiPelayananNip,
            photo: merged.kasiPelayananPhoto || "",
            roleBadge: "KASI",
            division: "Administrasi & Pelayanan",
            duties: "Verifikasi berkas persyaratan surat keterangan, legalisasi dokumen kependudukan, dan loket PATEN.",
          },
        ];
      }

      // Pastikan demography terisi
      if (!merged.demography || typeof merged.demography.total !== "number") {
        merged.demography = DEFAULT_SITE_SETTINGS.demography;
      }

      // Pastikan externalLinks terisi
      if (!Array.isArray(merged.externalLinks) || merged.externalLinks.length === 0) {
        merged.externalLinks = DEFAULT_SITE_SETTINGS.externalLinks;
      }

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
  const toSave = { ...current, ...settings };

  // Sinkronkan legacy fields jika officials diupdate
  if (Array.isArray(toSave.officials) && toSave.officials.length > 0) {
    const lurah = toSave.officials.find((o) => o.roleBadge === "LURAH") || toSave.officials[0];
    if (lurah) {
      toSave.headName = lurah.name;
      toSave.headTitle = lurah.title;
      toSave.headNip = lurah.nip || "";
      toSave.headPhoto = lurah.photo || "";
    }
    const seklur = toSave.officials.find((o) => o.roleBadge === "SEKRETARIAT") || toSave.officials[1];
    if (seklur) {
      toSave.secretaryName = seklur.name;
      toSave.secretaryTitle = seklur.title;
      toSave.secretaryNip = seklur.nip || "";
      toSave.secretaryPhoto = seklur.photo || "";
    }
  }

  // Sinkronkan legacy fields jika facilities diupdate
  if (Array.isArray(toSave.facilities) && toSave.facilities.length > 0) {
    if (toSave.facilities[0]) {
      toSave.facility1Title = toSave.facilities[0].title;
      toSave.facility1Desc = toSave.facilities[0].desc;
    }
    if (toSave.facilities[1]) {
      toSave.facility2Title = toSave.facilities[1].title;
      toSave.facility2Desc = toSave.facilities[1].desc;
    }
    if (toSave.facilities[2]) {
      toSave.facility3Title = toSave.facilities[2].title;
      toSave.facility3Desc = toSave.facilities[2].desc;
    } else {
      toSave.facility3Title = "";
      toSave.facility3Desc = "";
    }
  }

  await saveSetting("profile", toSave);
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
