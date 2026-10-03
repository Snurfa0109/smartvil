import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { countRecords } from "@/lib/records";
import { DEFAULT_LETTER_TYPES } from "@/lib/letters";
import { randomUUID } from "crypto";

const now = () => new Date();

async function seedIfEmpty(table: string, insert: () => Promise<void>) {
  try {
    const count = await countRecords(table as any);
    if (count > 0) {
      return `${table}: sudah ada ${count} baris, dilewati`;
    }
  } catch (e) {
    // Table mungkin belum ada atau error lain, lanjut seed
  }
  await insert();
  return `${table}: seeded`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionProfile(req);
    if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const logs: string[] = [];

    try {
      logs.push(
        await seedIfEmpty("residents", async () => {
          const residents = [
            ["3201010101010001", "Budi Santoso", "Laki-laki", "Jl. Mawar No. 1", "Petani", "1980-01-01"],
            ["3201010202020002", "Siti Aminah", "Perempuan", "Jl. Mawar No. 2", "Ibu Rumah Tangga", "1982-02-02"],
            ["3201010303030003", "Ahmad Rizki", "Laki-laki", "Jl. Melati No. 5", "Wiraswasta", "1990-03-03"],
            ["3201010404040004", "Dewi Sartika", "Perempuan", "Jl. Anggrek No. 10", "Guru", "1985-04-04"],
            ["3201010505050005", "Eko Prasetyo", "Laki-laki", "Jl. Kamboja No. 3", "Buruh", "1975-05-05"],
            ["3201010606060006", "Fajar Nugraha", "Laki-laki", "Jl. Kenanga No. 8", "Mahasiswa", "2000-06-06"],
            ["3201010707070007", "Gita Pertiwi", "Perempuan", "Jl. Dahlia No. 12", "Pelajar", "2005-07-07"],
            ["3201010808080008", "Hendra Wijaya", "Laki-laki", "Jl. Flamboyan No. 7", "PNS", "1978-08-08"],
            ["3201010909090009", "Indah Lestari", "Perempuan", "Jl. Teratai No. 4", "Perawat", "1992-09-09"],
            ["3201011010100010", "Joko Susilo", "Laki-laki", "Jl. Mawar No. 15", "Supir", "1983-10-10"],
          ];
          for (const [nik, nama, gender, address, occupation, birth] of residents) {
            await query(
              "INSERT INTO residents (id, nik, nama, gender, address, occupation, birth_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Tetap')",
              [randomUUID(), nik, nama, gender, address, occupation, birth]
            );
          }
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logs.push(`residents: ERROR - ${msg}`);
      console.error("Residents seed error:", e);
    }

    try {
      logs.push(
        await seedIfEmpty("news", async () => {
          const news = [
            ["Penyaluran Bantuan Pangan Beras CPP Tahap I untuk Warga Prasejahtera", "Pengumuman", "Pemerintah Kelurahan Banjar Agung menyalurkan bantuan cadangan pangan pemerintah (CPP) berupa beras 10 kg kepada keluarga penerima manfaat di aula kelurahan.", "2026-09-24"],
            ["Gerakan 'Rabu Asri' Bersama Warga di Lingkungan RW 03 dan RW 05", "Kegiatan", "Aparatur kelurahan, pengurus RT/RW, dan warga melaksanakan gotong royong kebersihan drainase dan pemangkasan dahan pohon.", "2026-09-23"],
            ["Jadwal Posyandu Balita & Skrining PTM Puskesmas Banjar Agung", "Kesehatan", "Jadwal penimbangan balita, imunisasi dasar, serta pemeriksaan penyakit tidak menular bagi lansia di seluruh posyandu RW 01 hingga RW 10.", "2026-09-21"],
            ["Musrenbang Kelurahan Banjar Agung TA 2027", "Pemerintahan", "Musrenbang tingkat kelurahan digelar dengan fokus drainase perumahan, perbaikan jalan lingkungan, dan pemberdayaan ekonomi perempuan.", "2026-09-15"],
            ["Pelatihan Pemasaran Digital bagi UMKM Perumahan BAP", "Pelatihan", "Puluhan pelaku usaha rumahan mendapatkan pelatihan promosi media sosial dan sertifikasi halal bersama Dinas Koperasi dan UMKM.", "2026-09-12"],
          ];
          for (const [title, category, content, date] of news) {
            await query(
              "INSERT INTO news (id, title, category, content, date, image_url) VALUES (?, ?, ?, ?, ?, ?)",
              [randomUUID(), title, category, content, date, "/images/default-news.jpg"]
            );
          }
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logs.push(`news: ERROR - ${msg}`);
      console.error("News seed error:", e);
    }

    try {
      logs.push(
        await seedIfEmpty("complaints", async () => {
          const complaints = [
            ["PGD-202609-1001", "Warga 1", "warga1@email.com", "081234567890", "Infrastruktur", "Jalan berlubang di RT 05 mohon segera diperbaiki.", "pending", ""],
            ["PGD-202609-1002", "Warga 2", "warga2@email.com", "081234567891", "Pelayanan", "Petugas kelurahan sangat ramah, terima kasih.", "completed", "Terima kasih atas apresiasinya."],
            ["PGD-202609-1003", "Warga 3", "warga3@email.com", "081234567892", "Keamanan", "Pos kamling di RW 03 perlu perbaikan atap.", "processed", ""],
          ];
          for (const [ticket, nama, email, phone, category, message, status, resp] of complaints) {
            await query(
              "INSERT INTO complaints (id, ticket_code, nama, email, phone, category, title, message, status, admin_response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [randomUUID(), ticket, nama, email, phone, category, message, message, status, resp]
            );
          }
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logs.push(`complaints: ERROR - ${msg}`);
      console.error("Complaints seed error:", e);
    }

    try {
      logs.push(
        await seedIfEmpty("requests", async () => {
          const requests = [
            ["SRT-202609-1001", "sktm", "Surat Keterangan Tidak Mampu (SKTM)", "Budi Santoso", "3201010101010001", "08111111111", "Beasiswa Anak", "pending"],
            ["SRT-202609-1002", "domisili", "Surat Keterangan Domisili", "Siti Aminah", "3201010202020002", "08222222222", "Pindah Datang", "processed"],
            ["SRT-202609-1003", "usaha", "Surat Keterangan Usaha (SKU)", "Ahmad Rizki", "3201010303030003", "08333333333", "Kredit KUR", "completed"],
          ];
          for (const [ticket, type, typeName, nama, nik, phone, keperluan, status] of requests) {
            await query(
              "INSERT INTO requests (id, ticket_code, type, type_name, nama, nik, phone, keperluan, status, form_data, template_narrative, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', '', '')",
              [randomUUID(), ticket, type, typeName, nama, nik, phone, keperluan, status]
            );
          }
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logs.push(`requests: ERROR - ${msg}`);
      console.error("Requests seed error:", e);
    }

    try {
      logs.push(
        await seedIfEmpty("agenda", async () => {
          const agenda = [
            ['Gerakan "Rabu Asri" Kelurahan', "Program Lingkungan", "blue", "Setiap Rabu", "Kerja bakti kebersihan drainase, penghijauan lingkungan, dan penataan pemukiman bersama RT/RW se-Kelurahan Banjar Agung.", "07:30 WIB - Selesai • Seluruh Lingkungan RW"],
            ["Penyaluran Beras Bantuan Pangan Kemensos RI", "Bantuan Sosial", "emerald", "Sesuai Jadwal", "Penyaluran Cadangan Beras Pangan Pemerintah (CPP) bagi Keluarga Penerima Manfaat (KPM) warga Kelurahan Banjar Agung.", "Aula Kantor Kelurahan Banjar Agung"],
            ["Posyandu Balita & Lansia Puskesmas Banjar Agung", "Kesehatan Warga", "amber", "Jadwal Posyandu", "Pemeriksaan kesehatan tumbuh kembang balita, imunisasi dasar, penimbangan, dan pemeriksaan tekanan darah lansia.", "08:30 - 11:30 WIB • Posyandu BAP & Lingkungan RW"],
          ];
          for (let i = 0; i < agenda.length; i++) {
            const [title, category, color, schedule, description, timeLocation] = agenda[i];
            await query(
              "INSERT INTO agenda (id, title, category, category_color, schedule, description, time_location, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)",
              [randomUUID(), title, category, color, schedule, description, timeLocation, i]
            );
          }
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logs.push(`agenda: ERROR - ${msg}`);
      console.error("Agenda seed error:", e);
    }

    try {
      logs.push(
        await seedIfEmpty("letter_types", async () => {
          for (let i = 0; i < DEFAULT_LETTER_TYPES.length; i++) {
            const lt = DEFAULT_LETTER_TYPES[i];
            await query(
              "INSERT INTO letter_types (id, code, name, description, requirements, template_narrative, active, sort_order, template_file_url, template_data, template_placeholders, custom_fields) VALUES (?, ?, ?, ?, ?, ?, 1, ?, '', ?, '[]', '[]')",
              [randomUUID(), lt.code, lt.name, lt.desc, JSON.stringify(lt.requirements), lt.templateNarrative ?? "", i + 1, lt.templateNarrative ?? ""]
            );
          }
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logs.push(`letter_types: ERROR - ${msg}`);
      console.error("Letter types seed error:", e);
    }

    return NextResponse.json({ logs, at: now().toISOString() });
  } catch (err) {
    console.error("Seed error detail:", err);
    const msg = err instanceof Error ? err.message : JSON.stringify(err) || "Seed gagal.";
    return NextResponse.json({ error: msg, stack: err instanceof Error ? err.stack : undefined }, { status: 500 });
  }
}
