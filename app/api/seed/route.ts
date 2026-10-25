/**
 * @layer Backend (API Route)
 * @role Endpoint seeding inisialisasi data awal database
 * @access Super Admin
 * @description Mengisi data master awal seperti admin, profil kelurahan, dan template surat jika tabel kosong.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { countRecords, TableName } from "@/lib/records";
import { randomUUID } from "crypto";

const now = () => new Date();

async function seedIfEmpty(table: string, insert: () => Promise<void>) {
  try {
    const count = await countRecords(table as TableName);
    if (count > 0) {
      return `${table}: sudah ada ${count} baris, dilewati`;
    }
  } catch {
    // Table mungkin belum ada atau error lain, lanjut seed
  }
  await insert();
  return `${table}: seeded`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdmin(req);
    if (!session) {
      const hasToken = req.headers.get("authorization");
      return NextResponse.json(
        { error: hasToken ? "Hanya superadmin yang dapat melakukan seed." : "Autentikasi diperlukan." },
        { status: hasToken ? 403 : 401 }
      );
    }
    const logs: string[] = [];

    try {
      await query("ALTER TABLE `news` ADD COLUMN `views` INT UNSIGNED NOT NULL DEFAULT 0");
      logs.push("migration: added views column to news");
    } catch {
      // Column already exists
    }

    for (const col of ["date_start DATE NULL", "date_end DATE NULL", "time_start VARCHAR(10) DEFAULT ''", "time_end VARCHAR(10) DEFAULT ''", "location VARCHAR(500) DEFAULT ''"]) {
      try {
        await query(`ALTER TABLE \`agenda\` ADD COLUMN ${col}`);
        logs.push(`migration: added ${col.split(" ")[0]} column to agenda`);
      } catch {
        // Column already exists
      }
    }

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
            [
              "Penyaluran Cadangan Beras Pangan (CPP) Tahap II untuk 450 KPM Warga Banjar Agung Berjalan Tertib",
              "Pengumuman",
              "<p>Pemerintah Kelurahan Banjar Agung bekerja sama dengan Perum BULOG Kantor Cabang Serang dan Dinas Ketahanan Pangan Kota Serang kembali menyalurkan bantuan <strong>Cadangan Pangan Pemerintah (CPP)</strong> berupa beras kualitas medium seberat 10 kg kepada 450 Keluarga Penerima Manfaat (KPM) prasejahtera.</p><h3>Ketentuan & Jadwal Pengambilan</h3><p>Penyaluran dilaksanakan terpusat di Aula Kantor Kelurahan Banjar Agung dengan pembagian jadwal per RW guna menjaga kelancaran antrean.</p>",
              "2026-10-15",
              "/images/banner-beranda-bogeg.jpg",
              142,
            ],
            [
              "Musrenbang Kelurahan Banjar Agung TA 2027 Rumuskan Prioritas Drainase & Pemberdayaan UMKM",
              "Pemerintahan",
              "<p>Kelurahan Banjar Agung telah sukses menggelar Musyawarah Perencanaan Pembangunan (Musrenbang) tingkat kelurahan Tahun Anggaran 2027 dihadiri oleh seluruh Ketua RT/RW dan tokoh masyarakat dengan fokus penanganan drainase dan pelatihan UMKM.</p>",
              "2026-10-11",
              "/images/banner-profil.jpg",
              98,
            ],
            [
              "Gerakan 'Rabu Asri' Bersama Warga: Kompak Bersihkan Saluran Drainase Antisipasi Musim Hujan",
              "Kegiatan",
              "<p>Aparatur Kelurahan Banjar Agung bersama pengurus RW 03 dan RW 05 menggelar aksi gotong royong rutin membersihkan sampah sedimentasi drainase dan pemangkasan dahan pohon rawan tumbang.</p>",
              "2026-10-08",
              "/images/jembatan-aria-wangsakara.png",
              76,
            ],
            [
              "Jadwal Posyandu Balita & Skrining PTM Puskesmas Pembantu Banjar Agung Bulan Ini",
              "Kesehatan",
              "<p>Puskesmas Pembantu Banjar Agung mengumumkan jadwal operasional posyandu balita dan layanan posbindu Penyakit Tidak Menular (PTM) untuk seluruh posyandu di wilayah RW 01 hingga RW 10.</p>",
              "2026-10-04",
              "/images/banner-informasi.jpg",
              115,
            ],
            [
              "Pelatihan Pemasaran Digital bagi Pelaku UMKM Kelurahan Banjar Agung",
              "Pelatihan",
              "<p>Sebanyak 35 pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) di lingkungan Kelurahan Banjar Agung mengikuti bimbingan teknis pemasaran digital dan fasilitasi sertifikasi halal produk lokal.</p>",
              "2026-09-28",
              "/images/banner-pengaduan.jpg",
              89,
            ],
          ];
          for (const [title, category, content, date, img, views] of news) {
            await query(
              "INSERT INTO news (id, title, category, content, date, image_url, views) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [randomUUID(), title, category, content, date, img, views]
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
            ['Gerakan "Rabu Asri" Kerja Bakti Bersih Lingkungan', "Program Lingkungan", "blue", "Setiap Rabu", "Kerja bakti pembersihan drainase pemukiman, penataan tanaman lingkungan, dan edukasi pilah sampah rumah tangga bersama warga.", "07:30 - 11:00 WIB • Lingkungan RW 03 & RW 05", "2026-10-21", "2026-10-21", "07:30", "11:00", "Lingkungan RW 03 & RW 05 Kelurahan Banjar Agung"],
            ["Posyandu Terpadu Balita & Skrining Lansia Sehat", "Kesehatan Warga", "emerald", "Jumat, 23 Okt 2026", "Pemeriksaan tumbuh kembang balita, imunisasi dasar lengkap, serta pemeriksaan tensi dan gula darah lansia.", "08:30 - 11:30 WIB • Posyandu Terpadu RW 06", "2026-10-23", "2026-10-23", "08:30", "11:30", "Posyandu Terpadu RW 06, Banjar Agung"],
            ["Penyaluran Beras Bantuan Pangan Kemensos RI Tahap II", "Bantuan Sosial", "amber", "Senin, 26 Okt 2026", "Penyaluran Cadangan Beras Pangan Pemerintah (CPP) bagi 450 KPM terdaftar dengan membawa KTP dan KK asli.", "08:30 - 15:00 WIB • Aula Kantor Kelurahan", "2026-10-26", "2026-10-26", "08:30", "15:00", "Aula Kantor Kelurahan Banjar Agung"],
            ["Layanan Jemput Bola Aktivasi Identitas Kependudukan Digital (IKD)", "Layanan Publik", "violet", "Kamis, 29 Okt 2026", "Aktivasi aplikasi IKD di smartphone warga oleh petugas Disdukcapil bersama seksi pelayanan umum kelurahan.", "09:00 - 14:00 WIB • Ruang Pelayanan Terpadu", "2026-10-29", "2026-10-29", "09:00", "14:00", "Ruang Pelayanan Terpadu Kelurahan Banjar Agung"],
          ];
          for (let i = 0; i < agenda.length; i++) {
            const [title, category, color, schedule, description, timeLocation, dStart, dEnd, tStart, tEnd, loc] = agenda[i];
            await query(
              "INSERT INTO agenda (id, title, category, category_color, schedule, description, time_location, date_start, date_end, time_start, time_end, location, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)",
              [randomUUID(), title, category, color, schedule, description, timeLocation, dStart, dEnd, tStart, tEnd, loc, i]
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
          // Jenis surat ditambahkan oleh admin melalui dashboard, tidak di-seed
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
    return NextResponse.json({ error: "Seed gagal." }, { status: 500 });
  }
}
