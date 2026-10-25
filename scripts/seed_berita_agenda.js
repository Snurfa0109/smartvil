const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  console.log('Seeding rich news and agenda...');

  // 1. News items
  const newsItems = [
    {
      id: 'd2518441-f23c-46e8-a787-41a758557a36',
      title: 'Penyaluran Cadangan Beras Pangan (CPP) Tahap II untuk 450 KPM Warga Banjar Agung Berjalan Tertib',
      category: 'Pengumuman',
      date: '2026-10-15',
      image_url: '/images/banner-beranda-bogeg.jpg',
      views: 142,
      content: '<p>Pemerintah Kelurahan Banjar Agung bekerja sama dengan Perum BULOG Kantor Cabang Serang dan Dinas Ketahanan Pangan Kota Serang kembali menyalurkan bantuan <strong>Cadangan Pangan Pemerintah (CPP)</strong> berupa beras kualitas medium seberat 10 kg kepada 450 Keluarga Penerima Manfaat (KPM) prasejahtera.</p><h3>Ketentuan & Jadwal Pengambilan</h3><p>Penyaluran dilaksanakan terpusat di Aula Kantor Kelurahan Banjar Agung dengan pembagian jadwal per RW guna menjaga kelancaran dan ketertiban antrean:</p><ul><li><strong>Sesi Pagi (08.30 – 11.30 WIB):</strong> Warga RW 01 sampai dengan RW 05.</li><li><strong>Sesi Siang (13.00 – 15.30 WIB):</strong> Warga RW 06 sampai dengan RW 10.</li></ul><h3>Persyaratan Berkas</h3><p>Warga yang hendak mengambil bantuan diwajibkan membawa dokumen asli berikut:</p><ol><li>Surat undangan resmi penyaluran CPP yang dibagikan oleh Ketua RT.</li><li>Kartu Tanda Penduduk Elektronik (KTP-el) asli penerima.</li><li>Kartu Keluarga (KK) asli untuk pencocokan data NIK.</li></ol><p>Lurah Banjar Agung mengimbau warga agar hadir sesuai sesi jadwal masing-masing demi kenyamanan bersama. Pelayanan dipastikan bebas dari segala bentuk pungutan biaya.</p>'
    },
    {
      id: '85dc853b-0e45-4ff4-b761-831695873427',
      title: 'Musrenbang Kelurahan Banjar Agung TA 2027 Rumuskan Prioritas Drainase & Pemberdayaan UMKM',
      category: 'Pemerintahan',
      date: '2026-10-11',
      image_url: '/images/banner-profil.jpg',
      views: 98,
      content: '<p>Kelurahan Banjar Agung telah sukses menggelar Musyawarah Perencanaan Pembangunan (Musrenbang) tingkat kelurahan Tahun Anggaran 2027. Forum musyawarah tahunan ini dihadiri oleh jajaran aparatur kelurahan, Camat Cipocok Jaya, perwakilan Bappeda Kota Serang, Babinsa, Bhabinkamtibmas, seluruh Ketua RW/RT, serta tokoh masyarakat dan PKK.</p><h3>Fokus Pembangunan Fisik & Infrastruktur</h3><p>Berdasarkan rekapitulasi aspirasi warga dari pra-Musrenbang di tingkat RW, usulan pembangunan fisik yang menjadi prioritas utama mencakup normalisasi dan perbaikan saluran drainase di lingkungan perumahan rawan genangan, pengaspalan jalan lingkungan berlubang di RW 03 dan RW 04, serta penambahan titik penerangan jalan umum (PJU).</p><h3>Penguatan Ekonomi Kerakyatan</h3><p>Selain infrastruktur, Musrenbang 2027 turut menempatkan program pemberdayaan ekonomi perempuan dan pelatihan wirausaha bagi pemuda sebagai poin krusial, termasuk pendampingan sertifikasi halal dan pemasaran digital bagi UMKM kuliner lokal Banjar Agung.</p>'
    },
    {
      id: 'bf11e10b-2847-4ca6-9d04-4789807ba656',
      title: "Gerakan 'Rabu Asri' Bersama Warga: Kompak Bersihkan Saluran Drainase Antisipasi Musim Hujan",
      category: 'Kegiatan',
      date: '2026-10-08',
      image_url: '/images/jembatan-aria-wangsakara.png',
      views: 76,
      content: '<p>Aparatur Kelurahan Banjar Agung bersama pengurus RW 03 dan RW 05 menggelar aksi gotong royong rutin dalam program <em>Gerakan Rabu Asri</em>. Kegiatan ini difokuskan pada pembersihan sampah sedimentasi tanah pada drainase utama serta pemangkasan ranting pohon yang berisiko menimpa jaringan kabel PLN.</p><p>Kegiatan yang dimulai sejak pukul 07.30 WIB ini melibatkan puluhan warga sekitar yang antusias membawa perlengkapan kebersihan. Selain memperlancar aliran air menuju saluran pembuangan utama, aksi ini sekaligus menjadi sarana mempererat silaturahmi antarwarga.</p><p>Kasi Ketenteraman dan Ketertiban Kelurahan menyampaikan apresiasi atas partisipasi aktif masyarakat dan berharap budaya gotong royong senantiasa terjaga di setiap lingkungan RT/RW.</p>'
    },
    {
      id: '1c099a0b-8fbf-41ad-86ff-83f8c7f1e92e',
      title: 'Jadwal Posyandu Balita & Skrining PTM Puskesmas Pembantu Banjar Agung Bulan Ini',
      category: 'Kesehatan',
      date: '2026-10-04',
      image_url: '/images/banner-informasi.jpg',
      views: 115,
      content: '<p>Puskesmas Pembantu Banjar Agung bersama Tim Penggerak PKK mengumumkan jadwal operasional posyandu balita dan layanan posbindu Penyakit Tidak Menular (PTM) untuk seluruh posyandu di wilayah RW 01 hingga RW 10.</p><h3>Layanan yang Diberikan</h3><ul><li>Penimbangan berat badan dan pengukuran tinggi badan balita rutin (pemantauan stunting).</li><li>Pemberian Makanan Tambahan (PMT) bergizi tinggi berbahan pangan lokal.</li><li>Imunisasi dasar lengkap bagi bayi usia 0 – 18 bulan.</li><li>Pemeriksaan tensi darah, gula darah sewaktu, dan konsultasi kesehatan geriatri bagi lansia.</li></ul><p>Para orang tua diimbau untuk selalu membawa buku KIA (Kesehatan Ibu dan Anak) setiap kali berkunjung ke posyandu terdekat.</p>'
    },
    {
      id: 'fdccbde6-1ddc-4ec5-ac01-241207f6d1ff',
      title: 'Pelatihan Pemasaran Digital bagi Pelaku UMKM Kelurahan Banjar Agung',
      category: 'Pelatihan',
      date: '2026-09-28',
      image_url: '/images/banner-pengaduan.jpg',
      views: 89,
      content: '<p>Sebanyak 35 pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) di lingkungan Kelurahan Banjar Agung mengikuti bimbingan teknis pemasaran digital dan foto produk komersial yang difasilitasi oleh Dinas Koperasi dan UMKM Kota Serang bertempat di aula kelurahan.</p><p>Materi yang disampaikan meliputi pembuatan konten promosi media sosial (Instagram & TikTok), optimasi toko online, pengelolaan pencatatan keuangan sederhana berbasis aplikasi, serta prosedur pendaftaran sertifikasi halal secara gratis (Self-Declare).</p><p>Diharapkan melalui pelatihan ini, produk-produk lokal khas Banjar Agung seperti aneka kue basah, keripik olahan, dan kerajinan tangan dapat menjangkau pasar yang lebih luas di tingkat regional maupun nasional.</p>'
    }
  ];

  for (const n of newsItems) {
    await conn.query(
      `INSERT INTO news (id, title, category, date, image_url, views, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       category = VALUES(category),
       date = VALUES(date),
       image_url = VALUES(image_url),
       views = VALUES(views),
       content = VALUES(content)`,
      [n.id, n.title, n.category, n.date, n.image_url, n.views, n.content]
    );
  }
  console.log('News items seeded and updated successfully.');

  // 2. Agenda items
  const agendaItems = [
    {
      id: '27a19b85-1606-452d-b9ec-f642d946ae7d',
      title: 'Gerakan "Rabu Asri" Kerja Bakti Bersih Lingkungan',
      category: 'Program Lingkungan',
      category_color: 'blue',
      schedule: 'Setiap Rabu',
      date_start: '2026-10-21',
      date_end: '2026-10-21',
      time_start: '07:30',
      time_end: '11:00',
      location: 'Lingkungan RW 03 & RW 05 Kelurahan Banjar Agung',
      time_location: '07:30 - 11:00 WIB • Lingkungan RW 03 & RW 05',
      description: 'Kerja bakti pembersihan drainase pemukiman, penataan tanaman lingkungan, dan edukasi pilah sampah rumah tangga bersama warga.',
      active: 1,
      sort_order: 0
    },
    {
      id: '9dceb0a1-4c52-498a-a9e7-ea9b4d9120b1',
      title: 'Posyandu Terpadu Balita & Skrining Lansia Sehat',
      category: 'Kesehatan Warga',
      category_color: 'emerald',
      schedule: 'Jumat, 23 Okt 2026',
      date_start: '2026-10-23',
      date_end: '2026-10-23',
      time_start: '08:30',
      time_end: '11:30',
      location: 'Posyandu Terpadu RW 06, Banjar Agung',
      time_location: '08:30 - 11:30 WIB • Posyandu Terpadu RW 06',
      description: 'Pemeriksaan tumbuh kembang balita, imunisasi dasar lengkap, serta pemeriksaan tekanan darah dan gula darah gratis bagi lansia.',
      active: 1,
      sort_order: 1
    },
    {
      id: 'eb88ff3c-732c-48bf-891e-604cc04e8c4e',
      title: 'Penyaluran Beras Bantuan Pangan Kemensos RI Tahap II',
      category: 'Bantuan Sosial',
      category_color: 'amber',
      schedule: 'Senin, 26 Okt 2026',
      date_start: '2026-10-26',
      date_end: '2026-10-26',
      time_start: '08:30',
      time_end: '15:00',
      location: 'Aula Kantor Kelurahan Banjar Agung',
      time_location: '08:30 - 15:00 WIB • Aula Kantor Kelurahan',
      description: 'Penyaluran Cadangan Beras Pangan Pemerintah (CPP) bagi 450 KPM terdaftar dengan membawa surat undangan RT, KTP-el asli, dan KK.',
      active: 1,
      sort_order: 2
    },
    {
      id: 'a5c7f812-3498-4c8d-b09e-716491a67e10',
      title: 'Layanan Jemput Bola Aktivasi Identitas Kependudukan Digital (IKD)',
      category: 'Layanan Publik',
      category_color: 'violet',
      schedule: 'Kamis, 29 Okt 2026',
      date_start: '2026-10-29',
      date_end: '2026-10-29',
      time_start: '09:00',
      time_end: '14:00',
      location: 'Ruang Pelayanan Terpadu Kelurahan Banjar Agung',
      time_location: '09:00 - 14:00 WIB • Ruang Pelayanan Terpadu',
      description: 'Aktivasi aplikasi IKD di smartphone warga oleh petugas Disdukcapil bersama seksi pelayanan umum kelurahan.',
      active: 1,
      sort_order: 3
    }
  ];

  for (const a of agendaItems) {
    await conn.query(
      `INSERT INTO agenda (id, title, category, category_color, schedule, description, time_location, date_start, date_end, time_start, time_end, location, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       category = VALUES(category),
       category_color = VALUES(category_color),
       schedule = VALUES(schedule),
       description = VALUES(description),
       time_location = VALUES(time_location),
       date_start = VALUES(date_start),
       date_end = VALUES(date_end),
       time_start = VALUES(time_start),
       time_end = VALUES(time_end),
       location = VALUES(location),
       active = VALUES(active),
       sort_order = VALUES(sort_order)`,
      [a.id, a.title, a.category, a.category_color, a.schedule, a.description, a.time_location, a.date_start, a.date_end, a.time_start, a.time_end, a.location, a.active, a.sort_order]
    );
  }
  console.log('Agenda items seeded and updated successfully.');

  const [nCheck] = await conn.query('SELECT id, title, category, date, image_url, views FROM news');
  console.log('Total news in DB:', nCheck.length);
  console.table(nCheck);

  const [aCheck] = await conn.query('SELECT id, title, category, category_color, date_start, time_location, active FROM agenda');
  console.log('Total agenda in DB:', aCheck.length);
  console.table(aCheck);

  await conn.end();
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
