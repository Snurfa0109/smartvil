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
      { title: "Penyaluran BLT Bulan Februari", category: "Pengumuman", content: "Penyaluran BLT akan dilaksanakan pada tanggal 15 Februari 2026 di Balai Desa.", date: "2026-02-01" },
      { title: "Kerja Bakti Massal", category: "Kegiatan", content: "Diharapkan seluruh warga membawa alat kebersihan untuk kerja bakti hari Minggu ini.", date: "2026-02-03" },
      { title: "Jadwal Posyandu", category: "Kesehatan", content: "Posyandu balita dan lansia akan diadakan di RW 02 mulai pukul 08.00 WIB.", date: "2026-02-05" },
      { title: "Pelatihan UMKM Digital", category: "Pelatihan", content: "Pemdes mengadakan pelatihan pemasaran online untuk pelaku UMKM desa.", date: "2026-02-07" },
      { title: "Musdes Perencanaan 2027", category: "Pemerintahan", content: "Musyawarah Desa untuk perencanaan tahun 2027 telah disepakati.", date: "2026-02-10" },
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
