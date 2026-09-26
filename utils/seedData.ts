import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";

export const seedDatabase = async () => {
  try {
    const batch = writeBatch(db);

    const residents = [
      { nik: "3201010101010001", nama: "Budi Santoso", gender: "Laki-laki", address: "Jl. Mawar No. 1", occupation: "Petani", birthDate: "1980-01-01", status: "Tetap" },
      { nik: "3201010202020002", nama: "Siti Aminah", gender: "Perempuan", address: "Jl. Mawar No. 2", occupation: "Ibu Rumah Tangga", birthDate: "1982-02-02", status: "Tetap" },
      { nik: "3201010303030003", nama: "Ahmad Rizki", gender: "Laki-laki", address: "Jl. Melati No. 5", occupation: "Wiraswasta", birthDate: "1990-03-03", status: "Tetap" },
      { nik: "3201010404040004", nama: "Dewi Sartika", gender: "Perempuan", address: "Jl. Anggrek No. 10", occupation: "Guru", birthDate: "1985-04-04", status: "Tetap" },
      { nik: "3201010505050005", nama: "Eko Prasetyo", gender: "Laki-laki", address: "Jl. Kamboja No. 3", occupation: "Buruh", birthDate: "1975-05-05", status: "Tetap" },
      { nik: "3201010606060006", nama: "Fajar Nugraha", gender: "Laki-laki", address: "Jl. Kenanga No. 8", occupation: "Mahasiswa", birthDate: "2000-06-06", status: "Tetap" },
      { nik: "3201010707070007", nama: "Gita Pertiwi", gender: "Perempuan", address: "Jl. Dahlia No. 12", occupation: "Pelajar", birthDate: "2005-07-07", status: "Tetap" },
      { nik: "3201010808080008", nama: "Hendra Wijaya", gender: "Laki-laki", address: "Jl. Flamboyan No. 7", occupation: "PNS", birthDate: "1978-08-08", status: "Tetap" },
      { nik: "3201010909090009", nama: "Indah Lestari", gender: "Perempuan", address: "Jl. Teratai No. 4", occupation: "Perawat", birthDate: "1992-09-09", status: "Tetap" },
      { nik: "3201011010100010", nama: "Joko Susilo", gender: "Laki-laki", address: "Jl. Mawar No. 15", occupation: "Supir", birthDate: "1983-10-10", status: "Tetap" },
    ];

    residents.forEach((r) => {
      const ref = doc(collection(db, "residents"));
      batch.set(ref, { ...r, createdAt: serverTimestamp() });
    });

    const news = [
      {
        title: "Penyaluran Bantuan Pangan Beras CPP Tahap I untuk Warga Prasejahtera Banjar Agung",
        category: "Pengumuman",
        content: "Pemerintah Kelurahan Banjar Agung bersama Perum Bulog dan Kantor Pos menyalurkan bantuan cadangan pangan pemerintah (CPP) berupa beras 10 kg kepada keluarga penerima manfaat (KPM). Penyaluran bertempat di aula kelurahan dengan tertib dan lancar.",
        date: "2026-09-24",
      },
      {
        title: "Pelaksanaan Gerakan 'Rabu Asri' Bersama Warga di Lingkungan RW 03 dan RW 05",
        category: "Kegiatan",
        content: "Aparatur kelurahan, pengurus RT/RW, dan warga masyarakat serentak melaksanakan aksi gotong royong kebersihan lingkungan melalui program 'Rabu Asri'. Fokus pembersihan kali ini adalah drainase utama dan pemangkasan dahan pohon rawan tumbang.",
        date: "2026-09-23",
      },
      {
        title: "Jadwal Pelayanan Posyandu Balita & Skrining PTM Puskesmas Pembantu Banjar Agung",
        category: "Kesehatan",
        content: "Puskesmas Banjar Agung merilis jadwal pelayanan penimbangan balita, imunisasi dasar lengkap, serta pemeriksaan penyakit tidak menular (PTM) bagi lansia untuk seluruh posyandu di wilayah RW 01 hingga RW 10.",
        date: "2026-09-21",
      },
      {
        title: "Sosialisasi Penerbitan Surat Keterangan Usaha (SKU) Digital Melalui Portal Kelurahan",
        category: "Pelayanan",
        content: "Kini warga pelaku usaha mikro dan kecil di Kelurahan Banjar Agung dapat mengajukan Surat Keterangan Usaha secara daring tanpa perlu antre di kantor kelurahan. Proses verifikasi berkas dilakukan secara realtime oleh petugas loket.",
        date: "2026-09-18",
      },
      {
        title: "Musyawarah Perencanaan Pembangunan (Musrenbang) Kelurahan Banjar Agung TA 2027",
        category: "Pemerintahan",
        content: "Musrenbang tingkat kelurahan telah sukses digelar dengan fokus usulan prioritas pada peningkatan kualitas drainase perumahan, perbaikan jalan lingkungan, dan pemberdayaan ekonomi perempuan kelompok tani.",
        date: "2026-09-15",
      },
      {
        title: "Pelatihan Pemasaran Digital dan Pengemasan Produk bagi UMKM Perumahan BAP",
        category: "Pelatihan",
        content: "Bekerja sama dengan Dinas Koperasi dan UMKM Kota Serang, puluhan pelaku usaha rumahan di Perumahan Bumi Agung Permai (BAP) mendapatkan pelatihan strategi promosi media sosial dan sertifikasi halal.",
        date: "2026-09-12",
      },
      {
        title: "Kerja Bakti Pembersihan Saluran Drainase Antisipasi Musim Hujan di Kompleks Bumi Mutiara",
        category: "Kegiatan",
        content: "Guna mencegah genangan air saat curah hujan tinggi, warga Bumi Mutiara Serang bersama relawan kelurahan membersihkan endapan lumpur pada saluran primer sepanjang 500 meter.",
        date: "2026-09-08",
      },
      {
        title: "Perekaman KTP Elektronik Jemput Bola bagi Pelajar Pemilih Pemula di Aula Kelurahan",
        category: "Pelayanan",
        content: "Dinas Kependudukan dan Pencatatan Sipil bekerja sama dengan Kelurahan Banjar Agung menyelenggarakan layanan jemput bola perekaman KTP-el bagi remaja usia 17 tahun ke atas.",
        date: "2026-09-04",
      },
      {
        title: "Penyuluhan Pengelolaan Sampah Rumah Tangga & Pembentukan Bank Sampah RW 08",
        category: "Lingkungan",
        content: "Warga RW 08 resmi mendeklarasikan bank sampah mandiri guna mengurangi volume sampah anorganik serta memberikan nilai ekonomi sirkular bagi kas lingkungan warga.",
        date: "2026-08-28",
      },
      {
        title: "Pemberian Makanan Tambahan (PMT) Berbasis Pangan Lokal Pencegah Stunting di RW 02",
        category: "Kesehatan",
        content: "Kader Posyandu bersama bidan desa mendistribusikan paket PMT bergizi tinggi berupa olahan telur, ikan, dan sayuran segar bagi balita yang terindikasi gizi kurang.",
        date: "2026-08-22",
      },
      {
        title: "Semarak Kemerdekaan RI: Turnamen Bulutangkis Antar-RW Kelurahan Banjar Agung",
        category: "Kegiatan",
        content: "Sebanyak 18 kontingen perwakilan RW saling bertanding memperebutkan Piala Lurah Banjar Agung dalam rangka memeriahkan HUT Kemerdekaan Republik Indonesia.",
        date: "2026-08-16",
      },
      {
        title: "Sosialisasi Pencegahan Bahaya Kebakaran Bersama Damkar Kota Serang",
        category: "Pengumuman",
        content: "Petugas Pemadam Kebakaran Kota Serang memberikan edukasi dan simulasi penanganan dini kebocoran gas elpiji serta penggunaan APAR kepada ibu-ibu PKK dan pengurus lingkungan.",
        date: "2026-08-10",
      },
      {
        title: "Rembuk Warga: Optimalisasi Lampu Penerangan Jalan Umum (PJU) Perumahan Puri Angsana",
        category: "Pemerintahan",
        content: "Lurah Banjar Agung menampung aspirasi warga terkait titik-titik lampu jalan yang membutuhkan perbaikan dan penambahan demi keamanan lingkungan di malam hari.",
        date: "2026-08-05",
      },
      {
        title: "Aksi Donor Darah Sukarela dan Skrining Kesehatan Gratis di Kantor Kelurahan",
        category: "Kesehatan",
        content: "Bekerja sama dengan PMI Kota Serang, kegiatan donor darah berhasil mengumpulkan 65 kantong darah dari aparatur sipil negara dan warga Banjar Agung.",
        date: "2026-07-28",
      },
      {
        title: "Penyerahan Bibit Sayuran dan Media Tanam untuk Kelompok Wanita Tani (KWT) Mawar Asri",
        category: "Kegiatan",
        content: "Program ketahanan pangan kelurahan menyerahkan 500 bibit cabai, tomat, dan terong guna mendukung pemanfaatan pekarangan rumah tangga yang produktif.",
        date: "2026-07-20",
      },
    ];

    news.forEach((n) => {
      const ref = doc(collection(db, "news"));
      batch.set(ref, { ...n, createdAt: serverTimestamp() });
    });

    const complaints = [
      { nama: "Warga 1", email: "warga1@email.com", phone: "081234567890", category: "Infrastruktur", message: "Jalan berlubang di RT 05 mohon segera diperbaiki.", status: "pending" },
      { nama: "Warga 2", email: "warga2@email.com", phone: "081234567891", category: "Pelayanan", message: "Petugas kelurahan sangat ramah, terima kasih.", status: "completed" },
      { nama: "Warga 3", email: "warga3@email.com", phone: "081234567892", category: "Keamanan", message: "Pos kamling di RW 03 perlu perbaikan atap.", status: "processed" },
    ];

    complaints.forEach((c) => {
      const ref = doc(collection(db, "complaints"));
      batch.set(ref, { ...c, createdAt: serverTimestamp() });
    });

    const requests = [
      { nama: "Budi Santoso", nik: "3201010101010001", type: "sktm", keperluan: "Beasiswa Anak", status: "pending", phone: "08111111111" },
      { nama: "Siti Aminah", nik: "3201010202020002", type: "domisili", keperluan: "Pindah Datang", status: "processed", phone: "08222222222" },
      { nama: "Ahmad Rizki", nik: "3201010303030003", type: "usaha", keperluan: "Kredit KUR", status: "completed", phone: "08333333333" },
    ];

    requests.forEach((r) => {
      const ref = doc(collection(db, "requests"));
      batch.set(ref, { ...r, createdAt: serverTimestamp() });
    });

    await batch.commit();
    console.log("Database seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
};
