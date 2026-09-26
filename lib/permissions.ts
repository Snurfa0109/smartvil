export interface FeaturePermission {
  key: string;
  label: string;
  description: string;
  path: string;
}

export const MANAGEABLE_FEATURES: FeaturePermission[] = [
  {
    key: "dashboard",
    label: "Dashboard Ringkasan",
    description: "Statistik umum, grafik kependudukan & aktivitas kelurahan",
    path: "/dashboard",
  },
  {
    key: "berita",
    label: "Berita & Artikel",
    description: "Publikasi, edit, dan kelola berita serta artikel kelurahan",
    path: "/dashboard/berita",
  },
  {
    key: "agenda",
    label: "Agenda Kegiatan",
    description: "Jadwal kegiatan kelurahan, perayaan, dan gotong royong",
    path: "/dashboard/agenda",
  },
  {
    key: "layanan",
    label: "Permohonan Surat",
    description: "Pelayanan surat pengantar warga, verifikasi berkas, dan loket",
    path: "/dashboard/layanan",
  },
  {
    key: "penduduk",
    label: "Data Penduduk",
    description: "Database kependudukan warga RW/RT di Banjar Agung",
    path: "/dashboard/penduduk",
  },
  {
    key: "pengaduan",
    label: "Pengaduan Masuk",
    description: "Kelola aspirasi dan laporan pengaduan dari warga",
    path: "/dashboard/pengaduan",
  },
  {
    key: "settings",
    label: "Profil & Konten Web",
    description: "Kelola profil kelurahan, kontak medsos, & kategori berita",
    path: "/dashboard/settings",
  },
];

export const ALL_MANAGEABLE_FEATURE_KEYS = MANAGEABLE_FEATURES.map((f) => f.key);

export const DEFAULT_ADMIN_PERMISSIONS = [
  "dashboard",
  "berita",
  "agenda",
  "layanan",
  "penduduk",
  "pengaduan",
  "settings",
];
