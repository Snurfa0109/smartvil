import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface LetterCustomFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "textarea";
  required: boolean;
}

export interface LetterType {
  id?: string;
  code: string;
  name: string;
  desc: string;
  requirements: string[];
  templateNarrative?: string;
  active: boolean;
  order?: number;
  templateFileUrl?: string;
  templateStoragePath?: string;
  templateData?: string;
  templatePlaceholders?: string[];
  customFields?: LetterCustomFieldDef[];
}

export const DEFAULT_LETTER_TYPES: LetterType[] = [
  {
    code: "sktm",
    name: "Surat Keterangan Tidak Mampu (SKTM)",
    desc: "Untuk keperluan beasiswa, keringanan biaya kesehatan/BPJS, dan bantuan sosial.",
    requirements: [
      "Fotokopi KTP Pemohon & Orang Tua/Wali",
      "Fotokopi Kartu Keluarga (KK)",
      "Surat Pengantar dari Ketua RT / RW setempat",
      "Foto kondisi rumah (tampak depan)",
    ],
    templateNarrative:
      "Menerangkan bahwa nama tersebut di atas adalah benar warga Kelurahan Banjar Agung yang tergolong keluarga pra-sejahtera/kurang mampu secara ekonomi dan surat ini dibuat untuk keperluan pengajuan beasiswa / jaminan kesehatan.",
    active: true,
    order: 1,
  },
  {
    code: "domisili",
    name: "Surat Keterangan Domisili",
    desc: "Bukti keterangan tempat tinggal sementara atau menetap di wilayah kelurahan.",
    requirements: [
      "Fotokopi KTP Pemohon",
      "Fotokopi Kartu Keluarga (KK)",
      "Surat Pengantar RT / RW sesuai alamat domisili",
    ],
    templateNarrative:
      "Menerangkan bahwa nama tersebut di atas adalah benar berdomisili dan bertempat tinggal di lingkungan wilayah Kelurahan Banjar Agung.",
    active: true,
    order: 2,
  },
  {
    code: "usaha",
    name: "Surat Keterangan Usaha (SKU)",
    desc: "Persyaratan pinjaman modal usaha (KUR bank), legalitas UMKM, atau pembukaan rekening.",
    requirements: [
      "Fotokopi KTP & KK Pemohon",
      "Surat Pengantar RT / RW",
      "Foto tempat/kegiatan usaha aktif",
    ],
    templateNarrative:
      "Menerangkan bahwa nama tersebut di atas benar memiliki dan menjalankan kegiatan usaha aktif di wilayah Kelurahan Banjar Agung dan berkelakuan baik dalam menjalankan usahanya.",
    active: true,
    order: 3,
  },
  {
    code: "pengantar_ktp",
    name: "Surat Pengantar KTP / KK",
    desc: "Untuk permohonan pencetakan KTP baru, perpanjangan, atau pecah Kartu Keluarga ke Disdukcapil.",
    requirements: [
      "Surat Pengantar RT / RW",
      "Fotokopi KK lama (untuk perpanjangan/pecah KK)",
      "Surat Kehilangan dari Polsek (jika KTP/KK hilang)",
      "Akta Kelahiran bagi pemohon KTP pemula",
    ],
    templateNarrative:
      "Diberikan sebagai pengantar permohonan penerbitan dokumen administrasi kependudukan (KTP/KK) ke Dinas Kependudukan dan Pencatatan Sipil.",
    active: true,
    order: 4,
  },
  {
    code: "kelahiran",
    name: "Surat Keterangan Kelahiran",
    desc: "Keterangan kelahiran anak sebagai syarat penerbitan Akta Kelahiran dan penambahan anggota KK.",
    requirements: [
      "Surat Keterangan Lahir dari Bidan / Rumah Sakit",
      "Fotokopi KTP Ayah dan Ibu",
      "Fotokopi Buku Nikah / Akta Perkawinan Orang Tua",
      "Fotokopi Kartu Keluarga (KK)",
    ],
    templateNarrative:
      "Menerangkan bahwa telah lahir seorang anak di wilayah Kelurahan Banjar Agung dan dicatatkan dalam buku register kelahiran desa.",
    active: true,
    order: 5,
  },
  {
    code: "kematian",
    name: "Surat Keterangan Kematian",
    desc: "Keterangan kematian warga untuk pengurusan Akta Kematian, perbankan, dan hak waris.",
    requirements: [
      "Surat Keterangan Kematian dari Rumah Sakit / Puskesmas / RT",
      "KTP & KK Asli Almarhum/Almarhumah",
      "Fotokopi KTP Pelapor (Ahli Waris)",
    ],
    templateNarrative:
      "Menerangkan bahwa nama yang bersangkutan telah meninggal dunia dan telah tercatat dalam arsip register kematian Pemerintah Kelurahan Banjar Agung.",
    active: true,
    order: 6,
  },
];

let cachedTypes: { data: LetterType[]; at: number } | null = null;
const TYPES_TTL_MS = 60_000;

export async function getLetterTypes(): Promise<LetterType[]> {
  if (cachedTypes && Date.now() - cachedTypes.at < TYPES_TTL_MS) {
    return cachedTypes.data;
  }
  const snap = await getDocs(collection(db, "letter_types"));
  const types = snap.docs.map((d) => ({ id: d.id, ...(d.data() as LetterType) }));
  cachedTypes = { data: types, at: Date.now() };
  return types;
}

export function invalidateLetterTypes(): void {
  cachedTypes = null;
}
