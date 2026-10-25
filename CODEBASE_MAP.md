# Peta Arsitektur & Basis Kode Komprehensif (Codebase Map)
## SmartVil — Sistem Informasi & Pelayanan Terpadu Kelurahan Banjar Agung

Dokumen ini adalah referensi teknis resmi mengenai arsitektur, pemisahan peran (user vs admin), alur integrasi data, dan **penjelasan detail setiap file** di dalam repositori SmartVil. 

---

## 1. Ringkasan Eksekutif & Pemisahan Peran

| Peran & Halaman | Target Pengguna | Akses & Keamanan | Karakteristik Utama |
|---|---|---|---|
| **Halaman User / Warga** (`app/(public)/*`) | Warga Kelurahan Banjar Agung, pemohon surat, pelapor aduan, umum | Terbuka (Public / Tanpa Login), proteksi data sensitif (PII masked), rate-limited | Desain ramah warga (*mobile-first* & lansia-friendly), tombol aksi cepat, pelacakan tiket mandiri, AI Chatbot Arba. |
| **Halaman Admin / Dashboard** (`app/dashboard/*`) | Lurah, Sekretaris Kelurahan, Kepala Seksi (Pemerintahan, Ekbang, Trantibum), Staf Loket | Terproteksi cookie HttpOnly JWT (`smartvil_token`), otentikasi peran (RBAC), audit trail | Verifikasi berkas, generator template DOCX otomatis, cetak surat resmi siap ttd, pengarsipan kependudukan, monitoring aduan. |
| **Backend REST API** (`app/api/*`) | Klien Frontend Publik & Dashboard Admin | Autentikasi JWT Bearer/Cookie, Whitelist Tabel & Kolom, Sanitasi Magic Bytes | Gerbang transaksi data MySQL, failover LLM (Groq & Gemini), generator counter atomic, seeder basis data. |
| **Core Libraries & Kernel** (`lib/*`, `proxy.ts`) | Server runtime & Shared utilities | Internal engine | Connection pool `mysql2/promise`, engine template docx zip, RBAC permission matrix, rate limiter. |

---

## 2. Rincian Detail Setiap File (Fungsi, Relasi, & Fitur)

### 2.1 Layer Halaman User / Warga (`app/(public)/*`)

#### `app/(public)/page.tsx` — Beranda Utama Portal Kelurahan
- **Terkait Apa**: Pusat navigasi dan etalase informasi publik Kelurahan Banjar Agung untuk seluruh warga.
- **Fitur Utama**:
  - *Dynamic Hero Banner*: Menampilkan ucapan selamat datang dan foto ikonik wilayah Banjar Agung (Jembatan Raden Aria Wangsakara / Bogeg).
  - *Status Loket Fisik Real-time*: Deteksi otomatis waktu kerja loket kelurahan (Senin–Jumat, 08.00–15.30 WIB) sehingga warga tahu apakah kantor buka sebelum datang.
  - *Akses Cepat 3 Pilar (Core UCD Cards)*: Tombol tugas cepat "Buat Surat Mandiri", "Lacak Berkas Surat", dan "Lapor Aduan Warga".
  - *Widget Lacak Instan*: Input pencarian kode tiket langsung di beranda tanpa perlu membuka halaman lain.
  - *Agenda Terkini & Warta*: Integrasi cuplikan jadwal program kelurahan (Posyandu, Rabu Asri) dan rilis berita terbaru.
- **Relasi & Komponen**: Terhubung dengan `components/layout/page-banner.tsx`, `/api/records?table=news`, `/api/records?table=agenda`, dan `/api/track/requests`.

#### `app/(public)/profil/page.tsx` — Profil Lengkap Kelurahan
- **Terkait Apa**: Halaman transparansi profil pemerintahan wilayah, sejarah, legalitas, aparatur, dan sarana publik.
- **Fitur Utama**:
  - *Quick-Jump Sticky Anchor*: Bar navigasi mengambang untuk loncat ke seksi: Identitas, Aparatur, Visi Misi, Sejarah, Teritorial RW, dan Fasilitas.
  - *Legalitas Wilayah*: Kode Kemendagri kelurahan, standar pelayanan PATEN, dan alamat kantor resmi.
  - *Bagan Struktur Aparatur Dinamis*: Menampilkan hierarki jabatan Lurah, Sekretaris, Kasi, dan Staf kelurahan bersumber dari database CMS `profiles`.
  - *Peta Teritorial & Sebaran 8 RW*: Pemetaan wilayah lingkungan (Bogeg, Banjar Agung Timur, dsb) beserta rincian jumlah RT.
  - *Katalog Fasilitas Publik*: Direktori 2 kolom fasilitas sarana ibadah, kesehatan (Puskesmas/Posyandu), pendidikan, dan ruang terbuka.
- **Relasi & Komponen**: Mengambil data dari `lib/site-config.ts` dan tabel `settings`.

#### `app/(public)/layanan/page.tsx` — Permohonan & Pelacakan Surat Mandiri
- **Terkait Apa**: Loket pelayanan surat keterangan digital mandiri bagi warga 24 jam.
- **Fitur Utama**:
  - *Katalog Surat Terintegrasi*: SKTM (Surat Keterangan Tidak Mampu), SKU (Usaha), Domisili, Keterangan Kematian, Kelahiran, Penghasilan, Belum Menikah, dll.
  - *Formulir Dinamis (Dynamic Custom Fields)*: Menampilkan field isian otomatis sesuai jenis surat yang dipilih (contoh: jenis usaha dan alamat usaha untuk SKU).
  - *Penyimpanan Otomatis Tiket*: Tiket yang dibuat disimpan di `localStorage` peramban warga dan memiliki tombol "Simpan ke WhatsApp" agar warga tidak lupa nomor tiketnya.
  - *Pengecekan Tiket Mandiri*: Tab pelacakan progres surat (Menunggu Verifikasi -> Diproses -> Siap Diambil / Selesai) lengkap dengan riwayat catatan petugas.
- **Relasi & Komponen**: Mengirim data ke `POST /api/records` (tabel `requests`) dan mengecek status ke `GET /api/track/requests`.

#### `app/(public)/pengaduan/page.tsx` — Kanal Aspirasi & Aduan Warga
- **Terkait Apa**: Sarana penyampaian keluhan fasilitas umum, sampah, ketertiban, dan layanan aparatur secara online.
- **Fitur Utama**:
  - *Formulir Aduan Interaktif*: Input nama pelapor, nomor WhatsApp, kategori aduan (Infrastruktur, Kebersihan, Pelayanan, Bantuan Sosial), dan lokasi kejadian.
  - *Unggah Foto Bukti*: Pengunggahan bukti lapangan langsung dari kamera ponsel atau galeri warga dengan pratinjau instan.
  - *Opsi Anonimitas*: Kemampuan menyembunyikan identitas pelapor jika masalah bersifat sensitif demi keamanan warga.
  - *Pelacakan Respon Petugas*: Tab cek tiket aduan untuk melihat tanggapan resmi dari pihak kelurahan dan riwayat tindak lanjutnya.
- **Relasi & Komponen**: Terhubung dengan `POST /api/upload` untuk upload foto dan `POST /api/records` (tabel `complaints`).

#### `app/(public)/berita/page.tsx` — Portal Warta & Publikasi Kelurahan
- **Terkait Apa**: Pusat publikasi warta kegiatan, pengumuman resmi, dan informasi program kerja kelurahan.
- **Fitur Utama**:
  - *Filter & Pencarian Warta*: Pemfilteran artikel berdasarkan kategori (Pembangunan, Pengumuman, Sosial, PKK, dll) dan pencarian kata kunci.
  - *Featured Hero Story*: Menyorot berita utama terbaru dengan tata letak visual menonjol.
  - *Paginasi Bersih*: Penataan artikel per halaman untuk efisiensi pemuatan data.
- **Relasi & Komponen**: Mengambil data dari `GET /api/records?table=news&order=desc`.

#### `app/(public)/berita/[id]/page.tsx` — Detail Artikel Berita Lengkap
- **Terkait Apa**: Halaman membaca artikel warta kelurahan secara utuh.
- **Fitur Utama**:
  - *Sanitasi Konten*: Render konten HTML dari editor TipTap secara aman bebas celah XSS.
  - *Counter Pembaca*: Perekaman jumlah tayangan pembaca secara atomic melalui API view counter.
  - *Social Media Share*: Tombol instan membagikan artikel ke WhatsApp, Facebook, X (Twitter), dan salin tautan.
  - *Rekomendasi Warta Terkait*: Menampilkan 3-4 artikel warta lainnya di bagian bawah halaman.
- **Relasi & Komponen**: Mengirim ping atomic ke `POST /api/news/views` dan memuat komponen `components/berita/social-share.tsx`.

#### `app/(public)/data/page.tsx` — Infografis & Statistik Kependudukan Terbuka
- **Terkait Apa**: Portal transparansi demografi warga dan tautan layanan publik nasional.
- **Fitur Utama**:
  - *Kartu Metrik KPI*: Total jiwa terdaftar, total Kepala Keluarga (KK), proporsi laki-laki vs perempuan.
  - *Komposisi Usia Visual*: Grafik ring donat SVG piramida kelompok usia (Anak-anak 0-17, Usia Produktif 18-59, Lansia 60+).
  - *Grafik Batang Jenjang Pendidikan*: Visualisasi pencapaian pendidikan warga dari SD hingga Pascasarjana.
  - *Peringkat Mata Pencaharian*: Diagram batang ranking profesi warga terbanyak di kelurahan.
  - *Distribusi Keagamaan*: Bar warna tersegmentasi sebaran agama warga.
  - *Direktori Tautan Layanan Eksternal*: Tautan cepat ke portal Dukcapil Kota Serang, Cek Bansos Kemensos, BPJS Kesehatan, dan Layanan Darurat 112.
- **Relasi & Komponen**: Terhubung dengan `GET /api/records?table=residents` dan konfigurasi fallback demografi dari `lib/site-config.ts`.

#### `app/(public)/cari/page.tsx` — Mesin Pencari Global Terpadu
- **Terkait Apa**: Halaman hasil pencarian terpadu lintas seluruh konten situs kelurahan.
- **Fitur Utama**:
  - Memindai secara serentak judul berita, deskripsi permohonan surat, agenda kegiatan kelurahan, dan direktori fasilitas umum profil.
- **Relasi & Komponen**: Melakukan query multi-tabel via `lib/api.ts`.

#### `app/(public)/layout.tsx` — Kerangka Tata Letak Halaman Publik
- **Terkait Apa**: Wrapper layout global yang membungkus semua halaman publik.
- **Fitur Utama**:
  - Menyematkan `Navbar` di bagian atas, `Footer` di bagian bawah, dan tombol melayang `Chatbot Arba` di pojok kanan bawah.

---

### 2.2 Layer Halaman Admin Dashboard (`app/dashboard/*`)

#### `app/dashboard/page.tsx` — Ringkasan Eksekutif & Statistik Utama
- **Terkait Apa**: Pusat komando awal yang dilihat petugas kelurahan begitu login.
- **Fitur Utama**:
  - *Indikator Status Loket Operasional*: Tombol pengubah status loket fisik dan informasi status layanan saat ini.
  - *Kartu Metrik KPI*: Ringkasan permohonan surat masuk, surat selesai, aduan aktif, dan total warga terdata.
  - *Pipeline Alur Surat*: Visualisasi status berkas pemohon dalam antrean (Menunggu, Diproses, Selesai, Ditolak).
  - *Stream Aktivitas Terbaru*: Log real-time pemrosesan surat dan laporan aduan yang masuk.
- **Relasi**: Mengambil data ringkas via `GET /api/dashboard-stats`.

#### `app/dashboard/layout.tsx` — Shell Navigasi & Otorisasi Sesi Petugas
- **Terkait Apa**: Tata letak panel dashboard admin yang mengontrol sidebar navigasi dan hak akses modul.
- **Fitur Utama**:
  - *Navigasi Berbasis Peran (RBAC)*: Menyembunyikan menu yang tidak boleh diakses oleh akun non-superadmin (misal: menu Pengguna dan Audit).
  - *Kartu Profil Sesi*: Menampilkan nama petugas yang sedang aktif, role jabatan, dan tombol logout aman.
- **Relasi**: Mengonsumsi `contexts/AuthContext.tsx` dan `lib/permissions.ts`.

#### `app/dashboard/layanan/page.tsx` — Loket Pemrosesan & Cetak Surat
- **Terkait Apa**: Modul kerja verifikasi permohonan surat warga dan penerbitan dokumen resmi.
- **Fitur Utama**:
  - *Verifikasi Berkas Permohonan*: Peninjauan data NIK, KK, keperluan warga, dan perubahan status surat.
  - *Template Builder DOCX*: Upload file master Word (`.docx`), deteksi otomatis placeholder `{{nama}}`, `{{nik}}`, dll.
  - *Form Generator Mandiri*: Pengaturan form isian yang akan tampil di halaman warga untuk jenis surat tersebut.
  - *Cetak & Unduh Dokumen*: Pengisian placeholder secara otomatis ke dalam template DOCX menjadi berkas surat resmi siap tandatangan dan stempel.
- **Relasi**: Menggunakan `components/letter-print-editor.tsx`, `components/letter-print-document.tsx`, dan `lib/letter-template.ts`.

#### `app/dashboard/penduduk/page.tsx` — Master Database Kependudukan
- **Terkait Apa**: Manajemen data kependudukan per RW dan RT se-Kelurahan Banjar Agung.
- **Fitur Utama**:
  - Pencarian warga berdasarkan NIK, No KK, atau Nama.
  - Filter kependudukan per RW/RT, jenis kelamin, status perkawinan, dan agama.
  - Modal tambah dan edit data kependudukan warga.
- **Relasi**: Berinteraksi dengan `app/api/records/route.ts` pada tabel `residents`.

#### `app/dashboard/berita/page.tsx` — Manajemen Publikasi Berita
- **Terkait Apa**: Kurasi dan pengelolaan artikel berita warta kelurahan.
- **Fitur Utama**: Daftar artikel yang terbit atau draft, monitoring jumlah pembaca artikel, tombol hapus, dan tautan edit.

#### `app/dashboard/berita/tambah/page.tsx` & `[id]/edit/page.tsx` — Form Editor Berita
- **Terkait Apa**: Editor penulisan dan pembaruan artikel warta.
- **Fitur Utama**: Integrasi editor TipTap WYSIWYG, pemformatan teks tebal/miring/heading/bullet, upload gambar sampul berita ke server.
- **Relasi**: Menggunakan `components/berita-editor.tsx` dan `app/api/upload/route.ts`.

#### `app/dashboard/pengaduan/page.tsx` — Penanganan Aduan & Aspirasi Warga
- **Terkait Apa**: Tindak lanjut keluhan dan aspirasi yang dikirimkan warga.
- **Fitur Utama**: Peninjauan foto bukti keluhan, pengubahan status (Diterima, Diproses, Selesai, Ditolak), dan penginputan tanggapan resmi dari pihak kelurahan.
- **Relasi**: Terhubung ke tabel `complaints` dan pencatatan audit log saat status diubah.

#### `app/dashboard/agenda/page.tsx` — Penjadwalan Kegiatan Kelurahan
- **Terkait Apa**: Kalender program kegiatan aparatur dan agenda masyarakat.
- **Fitur Utama**: Penjadwalan program (contoh: Posyandu, Kerja Bakti, Musrenbang, Rapat RT/RW), lokasi, jam mulai, dan status aktif.
- **Relasi**: Terhubung ke tabel `agenda`.

#### `app/dashboard/admins/page.tsx` — Manajemen Akun Petugas (Super Admin)
- **Terkait Apa**: Manajemen kredensial aparatur yang memiliki hak masuk dashboard.
- **Fitur Utama**: Pembuatan akun baru, penggantian password, pembagian role (`superadmin`, `admin`, `operator`), dan pemberian izin akses per modul.
- **Relasi**: Terhubung ke `app/api/admins/route.ts`.

#### `app/dashboard/settings/page.tsx` — Pengaturan Konfigurasi Portal & AI (Super Admin)
- **Terkait Apa**: Pusat konfigurasi global konten website dan parameter AI.
- **Fitur Utama**:
  - Konfigurasi profil kelurahan (nama lurah, telepon, email, jam loket).
  - Manajemen banner hero di setiap halaman.
  - Pengaturan demografi kependudukan agregat.
  - Pengaturan Chatbot AI Arba (model Groq/Gemini, suhu jawaban, prompt sistem, dan batasan topik).
- **Relasi**: Terhubung ke tabel `settings` melalui `lib/site-config.ts` dan `lib/chatbot-config.ts`.

#### `app/dashboard/audit/page.tsx` — Rekam Jejak Keamanan Sistem (Super Admin)
- **Terkait Apa**: Pengawasan aktivitas keamanan dan kepatuhan sistem.
- **Fitur Utama**: Log pencatatan siapa yang login, siapa yang menyetujui surat, siapa yang mengubah berita, beserta alamat IP dan stempel waktu.
- **Relasi**: Membaca data dari tabel `audit_logs` via `app/api/audit/route.ts`.

---

### 2.3 Layer Backend REST API (`app/api/*`)

- **`app/api/auth/route.ts`**: Menangani verifikasi kata sandi admin dengan `bcrypt`, menerbitkan cookie sesi `smartvil_token` berstandar `HttpOnly`, `SameSite=Lax`, dan menghapus cookie saat logout.
- **`app/api/records/route.ts`**: Universal CRUD engine database dengan proteksi whitelist nama tabel resmi (`news`, `residents`, `requests`, `complaints`, `agenda`, dll), sanitasi kolom yang boleh diakses publik, dan pembatasan pagination.
- **`app/api/track/requests/route.ts`**: Endpoint pencarian status permohonan surat warga yang aman PII (Personal Identifiable Information disensor agar tidak bocor ke publik).
- **`app/api/track/complaints/route.ts`**: Endpoint pencarian status aduan warga secara terbuka dan transparan.
- **`app/api/upload/route.ts`**: Handler upload berkas foto dan dokumen dengan validasi Magic Bytes biner (mencegah file berbahaya berekstensi palsu).
- **`app/api/chat/route.ts`**: Engine asisten virtual warga "Arba" berbasis orkestrasi model AI Groq (Llama-3) dan Google Gemini dengan injeksi konteks data resmi Banjar Agung.
- **`app/api/dashboard-stats/route.ts`**: Agregasi data metriks ringkas untuk efisiensi loading halaman overview dashboard.
- **`app/api/admins/route.ts`**: CRUD akun aparatur dengan validasi hak akses superadmin dan hashing password.
- **`app/api/audit/route.ts`**: Pencatatan dan pembacaan riwayat aktivitas administratif aparatur.
- **`app/api/news/views/route.ts`**: Atomic counter untuk menambah jumlah pembaca berita dengan rate limiter agar tidak bisa di-spam.
- **`app/api/seed/route.ts`**: Endpoint inisialisasi basis data dan data contoh awal.

---

### 2.4 Layer Core Library & Utilitas (`lib/*`, `proxy.ts`)

- **`proxy.ts`**: Middleware gateway keamanan yang menyematkan HTTP Security Headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP) dan memverifikasi cookie sesi pada rute `/dashboard`.
- **`lib/db.ts`**: Singleton connection pool MySQL berbasis `mysql2/promise` dengan prepared statement otomatis untuk mencegah SQL Injection.
- **`lib/records.ts`**: Mesin pembatas tabel dan whitelist kolom untuk mencegah akses tidak sah ke database master.
- **`lib/auth-server.ts`**: Logika verifikasi token JWT, hashing kata sandi bcrypt, dan ekstraksi identitas petugas dari cookie request.
- **`lib/rate-limit.ts`**: Sliding-window in-memory limiter untuk mencegah brute-force login dan flood traffic pada endpoint publik.
- **`lib/letter-template.ts`**: Parser berkas Microsoft Word (`.docx`) yang membuka arsip zip, mendeteksi placeholder XML `{{variabel}}`, dan menyuntikkan data warga ke dalam template surat.
- **`lib/letters.ts` & `lib/letter-constants.ts`**: Katalog master jenis surat administrasi kelurahan, status alur kerja tiket, dan aturan format penomoran surat.
- **`lib/permissions.ts`**: Matriks Role-Based Access Control (RBAC) yang memetakan modul dashboard mana saja yang dapat diakses oleh masing-masing jabatan petugas kelurahan.
- **`lib/site-config.ts`**: Tipe data dan penyimpan pengaturan situs resmi kelurahan, jam loket, telepon kantor, dan sebaran demografi.
- **`lib/banners-config.ts`**: Pengaturan visual banner hero di setiap halaman publik kelurahan.
- **`lib/chatbot-config.ts`**: Konfigurasi parameter AI Chatbot Arba (prompt kepribadian, temperatur kreatifitas, model LLM aktif).
- **`lib/audit.ts`**: Utilitas pengiriman log aktivitas petugas dari frontend dashboard ke database audit trail.
- **`lib/api.ts`**: Klien pembantu fetch data di sisi frontend yang menyisipkan token autentikasi secara otomatis.

---

### 2.5 Komponen Antarmuka Pengguna (`components/*`)

- **`components/layout/navbar.tsx`**: Header navigasi atas portal warga, menu layanan, indikator pencarian, dan tombol darurat.
- **`components/layout/footer.tsx`**: Kaki halaman publik berisi identitas kantor kelurahan, jam loket, alamat maps, dan kontak resmi.
- **`components/layout/page-banner.tsx`**: Komponen banner visual di atas setiap halaman publik dengan teks judul dinamis.
- **`components/chatbot/chat-widget.tsx`**: Tombol melayang dan jendela interaktif asisten virtual AI "Arba" untuk memandu warga awam.
- **`components/berita-editor.tsx`**: Editor artikel TipTap WYSIWYG untuk pembuatan dan pengubahan artikel berita di dashboard.
- **`components/letter-print-editor.tsx` & `components/letter-print-document.tsx`**: Pengatur tata letak kop surat resmi kelurahan, batang tubuh, tanda tangan lurah, stempel, dan format cetak kertas F4/A4.
- **`components/letter-simulation-preview.tsx`**: Komponen pratinjau rendering template surat langsung di browser admin.
- **`components/dashboard/banner-management.tsx`**: Antarmuka pengaturan gambar banner di dashboard settings.
- **`components/berita/social-share.tsx`**: Widget tombol berbagi artikel berita ke WhatsApp, Facebook, Twitter, dan salin tautan.
- **`components/ui/*`**: Komponen atomik antarmuka (Button, Card, Input, Label, Select, Tabs, Textarea, Toast).
