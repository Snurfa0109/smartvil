import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^\\s*" + k + "\\s*=(.+)$", "m"));
  return (m ? m[1] : "").trim().replace(/^['"]|['"]$/g, "");
};
const supabase = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
const now = () => new Date().toISOString();

async function seedIfEmpty(table, rows) {
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    console.log(`${table}: sudah ada ${count} baris, dilewati`);
    return;
  }
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table}: +${rows.length} baris OK`);
}

const R = (o) => ({ id: randomUUID(), created_at: now(), ...o });

await seedIfEmpty("residents", [
  R({ nik: "3201010101010001", nama: "Budi Santoso", gender: "Laki-laki", address: "Jl. Mawar No. 1", occupation: "Petani", birth_date: "1980-01-01", status: "Tetap" }),
  R({ nik: "3201010202020002", nama: "Siti Aminah", gender: "Perempuan", address: "Jl. Mawar No. 2", occupation: "Ibu Rumah Tangga", birth_date: "1982-02-02", status: "Tetap" }),
  R({ nik: "3201010303030003", nama: "Ahmad Rizki", gender: "Laki-laki", address: "Jl. Melati No. 5", occupation: "Wiraswasta", birth_date: "1990-03-03", status: "Tetap" }),
  R({ nik: "3201010404040004", nama: "Dewi Sartika", gender: "Perempuan", address: "Jl. Anggrek No. 10", occupation: "Guru", birth_date: "1985-04-04", status: "Tetap" }),
  R({ nik: "3201010505050005", nama: "Eko Prasetyo", gender: "Laki-laki", address: "Jl. Kamboja No. 3", occupation: "Buruh", birth_date: "1975-05-05", status: "Tetap" }),
  R({ nik: "3201010606060006", nama: "Fajar Nugraha", gender: "Laki-laki", address: "Jl. Kenanga No. 8", occupation: "Mahasiswa", birth_date: "2000-06-06", status: "Tetap" }),
  R({ nik: "3201010707070007", nama: "Gita Pertiwi", gender: "Perempuan", address: "Jl. Dahlia No. 12", occupation: "Pelajar", birth_date: "2005-07-07", status: "Tetap" }),
  R({ nik: "3201010808080008", nama: "Hendra Wijaya", gender: "Laki-laki", address: "Jl. Flamboyan No. 7", occupation: "PNS", birth_date: "1978-08-08", status: "Tetap" }),
  R({ nik: "3201010909090009", nama: "Indah Lestari", gender: "Perempuan", address: "Jl. Teratai No. 4", occupation: "Perawat", birth_date: "1992-09-09", status: "Tetap" }),
  R({ nik: "3201011010100010", nama: "Joko Susilo", gender: "Laki-laki", address: "Jl. Mawar No. 15", occupation: "Supir", birth_date: "1983-10-10", status: "Tetap" }),
]);

await seedIfEmpty("news", [
  R({ title: "Penyaluran Bantuan Pangan Beras CPP Tahap I untuk Warga Prasejahtera", category: "Pengumuman", content: "Pemerintah Kelurahan Banjar Agung menyalurkan bantuan cadangan pangan pemerintah (CPP) berupa beras 10 kg kepada keluarga penerima manfaat di aula kelurahan.", date: "2026-09-24" }),
  R({ title: "Gerakan 'Rabu Asri' Bersama Warga di Lingkungan RW 03 dan RW 05", category: "Kegiatan", content: "Aparatur kelurahan, pengurus RT/RW, dan warga melaksanakan gotong royong kebersihan drainase dan pemangkasan dahan pohon.", date: "2026-09-23" }),
  R({ title: "Jadwal Posyandu Balita & Skrining PTM Puskesmas Banjar Agung", category: "Kesehatan", content: "Jadwal penimbangan balita, imunisasi dasar, serta pemeriksaan penyakit tidak menular bagi lansia di seluruh posyandu RW 01 hingga RW 10.", date: "2026-09-21" }),
  R({ title: "Musrenbang Kelurahan Banjar Agung TA 2027", category: "Pemerintahan", content: "Musrenbang tingkat kelurahan digelar dengan fokus drainase perumahan, perbaikan jalan lingkungan, dan pemberdayaan ekonomi perempuan.", date: "2026-09-15" }),
  R({ title: "Pelatihan Pemasaran Digital bagi UMKM Perumahan BAP", category: "Pelatihan", content: "Puluhan pelaku usaha rumahan mendapatkan pelatihan promosi media sosial dan sertifikasi halal bersama Dinas Koperasi dan UMKM.", date: "2026-09-12" }),
]);

await seedIfEmpty("complaints", [
  R({ ticket_code: "PGD-202609-1001", nama: "Warga 1", email: "warga1@email.com", phone: "081234567890", category: "Infrastruktur", title: "Jalan berlubang di RT 05", message: "Jalan berlubang di RT 05 mohon segera diperbaiki.", status: "pending", admin_response: "" }),
  R({ ticket_code: "PGD-202609-1002", nama: "Warga 2", email: "warga2@email.com", phone: "081234567891", category: "Pelayanan", title: "Apresiasi pelayanan", message: "Petugas kelurahan sangat ramah, terima kasih.", status: "completed", admin_response: "Terima kasih atas apresiasinya." }),
  R({ ticket_code: "PGD-202609-1003", nama: "Warga 3", email: "warga3@email.com", phone: "081234567892", category: "Keamanan", title: "Pos kamling RW 03", message: "Pos kamling di RW 03 perlu perbaikan atap.", status: "processed", admin_response: "" }),
]);

await seedIfEmpty("requests", [
  R({ ticket_code: "SRT-202609-1001", nama: "Budi Santoso", nik: "3201010101010001", phone: "08111111111", type: "sktm", type_name: "Surat Keterangan Tidak Mampu (SKTM)", keperluan: "Beasiswa Anak", status: "pending" }),
  R({ ticket_code: "SRT-202609-1002", nama: "Siti Aminah", nik: "3201010202020002", phone: "08222222222", type: "domisili", type_name: "Surat Keterangan Domisili", keperluan: "Pindah Datang", status: "processed" }),
  R({ ticket_code: "SRT-202609-1003", nama: "Ahmad Rizki", nik: "3201010303030003", phone: "08333333333", type: "usaha", type_name: "Surat Keterangan Usaha (SKU)", keperluan: "Kredit KUR", status: "completed" }),
]);

await seedIfEmpty("agenda", [
  R({ title: 'Gerakan "Rabu Asri" Kelurahan', category: "Program Lingkungan", category_color: "blue", schedule: "Setiap Rabu", description: "Kerja bakti kebersihan drainase, penghijauan lingkungan, dan penataan pemukiman bersama RT/RW se-Kelurahan Banjar Agung.", time_location: "07:30 WIB - Selesai • Seluruh Lingkungan RW", active: true, sort_order: 0 }),
  R({ title: "Penyaluran Beras Bantuan Pangan Kemensos RI", category: "Bantuan Sosial", category_color: "emerald", schedule: "Sesuai Jadwal", description: "Penyaluran Cadangan Beras Pangan Pemerintah (CPP) bagi Keluarga Penerima Manfaat (KPM) warga Kelurahan Banjar Agung.", time_location: "Aula Kantor Kelurahan Banjar Agung", active: true, sort_order: 1 }),
  R({ title: "Posyandu Balita & Lansia Puskesmas Banjar Agung", category: "Kesehatan Warga", category_color: "amber", schedule: "Jadwal Posyandu", description: "Pemeriksaan kesehatan tumbuh kembang balita, imunisasi dasar, penimbangan, dan pemeriksaan tekanan darah lansia.", time_location: "08:30 - 11:30 WIB • Posyandu BAP & Lingkungan RW", active: true, sort_order: 2 }),
]);

console.log("SELESAI");
process.exit(0);
