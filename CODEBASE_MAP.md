# Peta Arsitektur & Basis Kode (Codebase Map)
## SmartVil — Sistem Informasi & Pelayanan Terpadu Kelurahan Banjar Agung

---

## Daftar Isi
1. [Ringkasan Eksekutif & Arsitektur Sistem](#1-ringkasan-eksekutif--arsitektur-sistem)
   - 1.1 [Gambaran Umum Sistem](#11-gambaran-umum-sistem)
   - 1.2 [Spesifikasi Tumpukan Teknologi (Tech Stack)](#12-spesifikasi-tumpukan-teknologi-tech-stack)
   - 1.3 [Prinsip Desain & Pola Arsitektur](#13-prinsip-desain--pola-arsitektur)
   - 1.4 [Pemisahan Peran Pengguna (Role Separation)](#14-pemisahan-peran-pengguna-role-separation)
2. [Pemetaan Layer & Folder (High-Level Taxonomy)](#2-pemetaan-layer--folder-high-level-taxonomy)
   - 2.1 [Diagram Struktur Direktori](#21-diagram-struktur-direktori)
   - 2.2 [Tabel Tanggung Jawab Layer](#22-tabel-tanggung-jawab-layer)
3. [Detail Layer 1: Frontend Warga / Publik (`app/(public)/*`)](#3-detail-layer-1-frontend-warga--publik-apppublic)
   - 3.1 [Struktur Halaman Publik](#31-struktur-halaman-publik)
   - 3.2 [Aliran Data & Integrasi Layanan](#32-aliran-data--integrasi-layanan)
   - 3.3 [Asisten Virtual AI "Arba" (Chatbot Widget)](#33-asisten-virtual-ai-arba-chatbot-widget)
4. [Detail Layer 2: Frontend Admin Dashboard (`app/dashboard/*`)](#4-detail-layer-2-frontend-admin-dashboard-appdashboard)
   - 4.1 [Modul-Modul Dashboard](#41-modul-modul-dashboard)
   - 4.2 [Role-Based Access Control (RBAC) & Matriks Otorisasi](#42-role-based-access-control-rbac--matriks-otorisasi)
5. [Detail Layer 3: Backend API & Microservices (`app/api/*`)](#5-detail-layer-3-backend-api--microservices-appapi)
   - 5.1 [Katalog Endpoint API](#51-katalog-endpoint-api)
   - 5.2 [Endpoint Khusus & Mekanisme Keamanan](#52-endpoint-khusus--mekanisme-keamanan)
6. [Detail Layer 4: Core Engine, Security & Libraries (`lib/*`, `proxy.ts`)](#6-detail-layer-4-core-engine-security--libraries-lib-proxyts)
   - 6.1 [Arsitektur Otentikasi & Sesi](#61-arsitektur-otentikasi--sesi)
   - 6.2 [Engine Database & Whitelist CRUD](#62-engine-database--whitelist-crud)
   - 6.3 [Sistem Rate Limiting & Resolusi Klien](#63-sistem-rate-limiting--resolusi-klien)
   - 6.4 [Engine Template Surat Dinamis (DOCX/XML)](#64-engine-template-surat-dinamis-docxxml)
   - 6.5 [Engine Audit Log & CMS Config Store](#65-engine-audit-log--cms-config-store)
7. [Tabel Ringkasan Pemetaan Seluruh File Proyek](#7-tabel-ringkasan-pemetaan-seluruh-file-proyek)

---

## 1. Ringkasan Eksekutif & Arsitektur Sistem

### 1.1 Gambaran Umum Sistem
**SmartVil** adalah platform tata kelola pemerintahan desa/kelurahan digital yang dikembangkan khusus untuk **Kelurahan Banjar Agung, Kecamatan Cipocok Jaya, Kota Serang, Banten**. Platform ini menjembatani dua kebutuhan fundamental:
1. **Layanan Mandiri Warga (Public Portal)**: Akses informasi publik, permohonan surat keterangan digital berbasis form mandiri, kanal aduan dan aspirasi warga secara real-time, transparansi demografi kependudukan, serta bantuan interaktif berbasis kecerdasan buatan (AI Chatbot Arba).
2. **Pusat Komando Aparatur (Admin Dashboard)**: Sistem manajemen administrasi terpadu untuk perangkat kelurahan guna memvalidasi surat, mencetak draf dokumen resmi berbasis template Microsoft Word (.docx), mengelola data penduduk per RW/RT, menindaklanjuti keluhan warga, mempublikasikan agenda dan warta kelurahan, serta memonitor audit log keamanan.

```
+---------------------------------------------------------------------------------------+
|                                    KLIEN / BROWSER                                    |
+-------------------------------------------+-------------------------------------------+
|               PORTAL WARGA                |              ADMIN DASHBOARD              |
|        (Publik, Mobile-Responsive)        |          (Perangkat Kelurahan)            |
+-------------------------------------------+-------------------------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------------+
|                            GATEWAY & PROXY LAYER (proxy.ts)                           |
|       - HTTP Security Headers (HSTS, CSP, X-Frame-Options, Sniff, Referrer)          |
|       - Dashboard Route Guard (Validasi HttpOnly Cookie 'smartvil_token')             |
+---------------------------------------------------------------------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------------+
|                         APPLICATION ENGINE (Next.js 16 App Router)                    |
|  +---------------------------+  +--------------------------------------------------+  |
|  |     REACT SERVER/CLIENT   |  |                  API ROUTES                      |  |
|  | - Server Components (SSR) |  | - /api/auth       - /api/records                 |  |
|  | - Client Island (Forms)   |  | - /api/track/*    - /api/upload                  |  |
|  | - TipTap / Docx Preview   |  | - /api/chat (AI)  - /api/admins /audit /stats    |  |
|  +---------------------------+  +--------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+---------------------------------+             +---------------------------------+
|     CORE ENGINE & LIBS (lib/*)  |             |      STORAGE & INTEGRASI        |
| - auth-server.ts (JWT & Bcrypt) |             | - Local Uploads (public/uploads)|
| - records.ts (Safe CRUD Engine) |             | - AI Providers (Groq / Gemini)  |
| - rate-limit.ts (Memory Limiter)|             | - MySQL / TiDB Database Pool    |
| - letter-template.ts (Docx Zip) |             +---------------------------------+
+---------------------------------+
```

### 1.2 Spesifikasi Tumpukan Teknologi (Tech Stack)
| Komponen | Teknologi | Versi | Peran & Catatan Teknis |
|---|---|---|---|
| **Framework Utama** | Next.js (App Router) | `16.1.6` | Arsitektur React Server Components (RSC) dengan Node.js runtime terintegrasi |
| **Frontend Library** | React & React DOM | `19.2.3` | Rendering antarmuka reaktif modern, hooks, dan context |
| **Bahasa Pemrograman** | TypeScript | `^5.x` | Static typing menyeluruh untuk payload, skema database, dan kontrak API |
| **Styling & UI** | Tailwind CSS & PostCSS | `v4` (`@tailwindcss/postcss`) | Utilitas CSS modern performa tinggi dengan tema terstandarisasi |
| **Desain Ikon** | Lucide React | `^0.563.0` | Ikonografi SVG konsisten di seluruh portal publik dan dashboard |
| **Editor Konten (WYSIWYG)** | TipTap Editor | `^3.20.0` | Editor teks kaya (Rich Text) untuk berita dan artikel kelurahan |
| **Template Engine Surat** | Docxtemplater & PizZip | `3.71.0` / `3.3.0` | Manipulasi dokumen `.docx` berbasis XML placeholder (`{{variabel}}`) |
| **Pratinjau Dokumen** | docx-preview | `^0.4.1` | Rendering dokumen Word langsung di dalam peramban web sisi klien |
| **Database Driver** | MySQL2 / Promise | `^3.24.5` | Connection pooling cerdas menuju MySQL / TiDB Cloud |
| **Keamanan Kredensial** | bcryptjs & jsonwebtoken | `3.0.3` / `9.0.3` | Hashing password 12-round salt & penerbitan token JWT stateless |
| **Sanitasi HTML** | DOMPurify & JSDOM | `3.4.17` / `30.1.2` | Pencegahan Cross-Site Scripting (XSS) pada konten publikasi dinamis |
| **AI LLM Gateway** | Groq & Google Gemini | REST API | Multi-provider AI dengan model fallback (Llama 3.3, OSS-20B, Gemini 2.0 Flash) |

### 1.3 Prinsip Desain & Pola Arsitektur
1. **Defense-in-Depth (Keamanan Berlapis)**:
   - Lapisan terluar: `proxy.ts` menginjeksi security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) dan menolak akses unauthenticated ke rute dashboard.
   - Lapisan kedua: Rate limiting sliding-window pada endpoint publik (`/api/auth`, `/api/chat`, `/api/upload`).
   - Lapisan ketiga: Validasi sesi backend di `lib/auth-server.ts` melalui JWT signature dan verifikasi status aktif di database.
   - Lapisan data: Engine `lib/records.ts` menggunakan *whitelist table & column protection* guna mencegah injeksi arbitrary SQL.
2. **Zero-Trust Tracking / PII Masking**:
   - Endpoint pencarian berkas mandiri (`/api/track/*`) hanya mengembalikan atribut status publik (`SAFE_FIELDS`), menyembunyikan identitas sensitif seperti alamat detail, tanggal lahir, dan isi form permohonan.
3. **Template Engine Isomorfik**:
   - Sistem permohonan surat memisahkan definisi metadata surat (`letter_types`) dengan template berkas fisik `.docx`. Form input dinamis dihasilkan otomatis dari pemindaian placeholder `{{...}}` di dalam template Word.

### 1.4 Pemisahan Peran Pengguna (Role Separation)
1. **Publik (Warga Banjar Agung / Tamu)**:
   - Hak akses anonim.
   - Mampu melihat profil, warta, agenda, data kependudukan agregat.
   - Dapat mengajukan permohonan surat administrasi dan pengaduan masyarakat.
   - Dapat melacak progres tiket secara real-time.
   - Berinteraksi dengan Chatbot AI Arba.
2. **Operator (Petugas Loket Pelayanan / Staf Khusus)**:
   - Terautentikasi (memerlukan login).
   - Diberikan izin parsial sesuai penugasan tugas kerja harian (misal: hanya modul `layanan` untuk verifikasi berkas atau modul `pengaduan`).
3. **Admin (Perangkat Kelurahan / Kepala Seksi)**:
   - Terautentikasi (memerlukan login).
   - Mengelola modul operasional harian: Validasi dan pencetakan surat, penerbitan berita, agenda, pengaduan warga, pemutakhiran data kependudukan.
4. **Super Admin (Lurah / Administrator Sistem)**:
   - Kontrol hierarki tertinggi.
   - Hak eksklusif untuk manajemen akun aparatur (`/dashboard/admins`), audit trail forensik (`/dashboard/audit`), eksekusi migrasi database (`/api/seed`), dan penghapusan data kritis.
5. **Sistem / Service Internal**:
   - Task background otomatis: pembersihan in-memory rate limiter per menit, deduplikasi penghitung pembaca berita (`/api/news/views`), dan penjagaan integritas pool database.

---

## 2. Pemetaan Layer & Folder (High-Level Taxonomy)

### 2.1 Diagram Struktur Direktori
```
smartvil/
├── app/
│   ├── (auth)/login/             # Portal Otentikasi Admin
│   ├── (public)/                 # Layer 1: Portal Layanan Warga
│   │   ├── berita/               # Warta kelurahan & detail artikel
│   │   ├── cari/                 # Mesin pencarian global situs
│   │   ├── data/                 # Statistik & demografi kependudukan
│   │   ├── layanan/              # Permohonan & pelacakan surat mandiri
│   │   ├── pengaduan/            # Form pengaduan & pelacakan tiket
│   │   └── profil/               # Sejarah, aparatur, visi misi, fasilitas
│   ├── dashboard/                # Layer 2: Pusat Administrasi Aparatur
│   │   ├── admins/               # Kelola pengguna sistem (Super Admin)
│   │   ├── agenda/               # Manajemen kalender kegiatan
│   │   ├── audit/                # Log audit keamanan (Super Admin)
│   │   ├── berita/               # Penulisan & kurasi berita (TipTap)
│   │   ├── layanan/              # Verifikasi, builder template, & cetak surat
│   │   ├── penduduk/             # Master database penduduk (RW/RT)
│   │   ├── pengaduan/            # Respon aduan & eskalasi keluhan
│   │   └── settings/             # Konfigurasi CMS, Banner, AI Chatbot
│   └── api/                      # Layer 3: Backend REST API
│       ├── admins/               # Endpoint akun aparatur
│       ├── audit/                # Endpoint penulisan log aktivitas
│       ├── auth/                 # Endpoint login & logout
│       ├── chat/                 # AI Assistant Engine (Groq/Gemini)
│       ├── dashboard-stats/      # Agregasi data metriks overview
│       ├── news/views/           # Atomic counter view berita
│       ├── records/              # Universal Whitelist CRUD Engine
│       ├── seed/                 # Database schema & initial data seeder
│       ├── track/                # Endpoint pelacakan publik aman (PII safe)
│       └── upload/               # Verifikator berkas & Magic Bytes
├── components/                   # UI & Reusable Component Library
│   ├── berita/                   # Social share widget
│   ├── chatbot/                  # Floating Chatbot Arba
│   ├── dashboard/                # Banner management UI
│   ├── layout/                   # Navbar, Footer, PageBanner
│   ├── search/                   # Modal pencarian cepat (Ctrl+K)
│   └── ui/                       # Atom primitives (Button, Card, Input, Tabs, dll)
├── contexts/                     # React Context (AuthContext)
├── hooks/                        # Custom React Hooks (use-polling)
├── lib/                          # Layer 4: Core Engine, Security & Utils
├── mysql/                        # Skema DDL Database (schema.sql)
└── public/                       # Aset Statis & Folder Upload
    ├── images/                   # Foto resmi wilayah Banjar Agung
    └── uploads/                  # Media tersimpan (berita, template docx, dll)
```

### 2.2 Tabel Tanggung Jawab Layer
| Layer Direktori | Tanggung Jawab Utama | Lingkungan Eksekusi | Hak Akses Default |
|---|---|---|---|
| `app/(public)/*` | Antarmuka interaksi warga, transparansi informasi, pengajuan mandiri | React Client/Server (RSC) | **Publik / Anonim** |
| `app/dashboard/*` | Antarmuka kerja aparatur kelurahan, pemrosesan data, manajemen CMS | React Client (Protected) | **Admin / Operator / Superadmin** |
| `app/api/*` | Gerbang layanan data RESTful, verifikasi transaksi, orkestrasi AI | Node.js Runtime (Server-side) | **Tergantung Endpoint** |
| `lib/*` | Pustaka logika inti, database pooling, otentikasi JWT, engine DOCX | Server & Client Shared | **Internal Kernel** |
| `components/*` | Komponen visual modular, atomik UI, widget interaktif | React Client Component | **Shared UI** |
| `contexts/*` | Penyimpan status sesi klien, otentikasi, dan evaluasi RBAC | React Client (Context API) | **Client State** |

---

## 3. Detail Layer 1: Frontend Warga / Publik (`app/(public)/*`)

Layer ini dirancang dengan pendekatan *mobile-first*, aksesibilitas tinggi, dan navigasi ramah warga awam.

### 3.1 Struktur Halaman Publik
1. **Beranda (`/`)**:
   - Menampilkan Hero Banner dinamis dengan kutipan kearifan lokal.
   - Papan Pengumuman cepat & jalan pintas 4 pilar layanan utama.
   - Cuplikan berita terkini & kalender agenda terdekat (misal: program *Rabu Asri* dan *Posyandu*).
   - Peta digital wilayah terpadu dan kontak darurat kelurahan.
2. **Profil Kelurahan (`/profil`)**:
   - Visi & Misi Kelurahan Banjar Agung.
   - Sejarah perkembangan wilayah (dari pemekaran hingga pembangunan infrastruktur Jembatan Aria Wangsakara).
   - Struktur Organisasi dan Galeri Aparatur Kelurahan (Lurah, Sekretaris, Kasi Pemerintahan, Kasi Ekbang, Kasi Trantibum, Staf).
   - Daftar fasilitas umum (sarana ibadah, kesehatan, pendidikan, ruang terbuka publik) dan tautan eksternal resmi (Kota Serang & Pemprov Banten).
   - Batas geografis wilayah (Utara, Selatan, Timur, Barat) dan peta interaktif.
3. **Layanan Mandiri Surat (`/layanan`)**:
   - Katalog jenis surat administrasi (SKTM, Keterangan Usaha/SKU, Keterangan Domisili, Pengantar KTP/KK, Keterangan Kelahiran, Keterangan Kematian).
   - Formulir permohonan cerdas: Mengisi NIK, nama lengkap, kontak WhatsApp, keperluan, dan field kustom yang relevan.
   - Fitur **Pelacakan Surat**: Cek status berkas menggunakan Kode Tiket unik (contoh: `SRT-20261025-XXXX`), NIK, atau nomor HP.
4. **Pengaduan & Aspirasi Warga (`/pengaduan`)**:
   - Portal *Lapor Kelurahan Banjar Agung*: Kategori infrastruktur, kebersihan & sampah, ketertiban umum, pelayanan aparatur, atau bantuan sosial.
   - Upload bukti foto kondisi lapangan dengan validasi tipe berkas otomatis.
   - Opsi pelapor anonim / terjaga kerahasiaannya.
   - Fitur **Pelacakan Pengaduan**: Pantau disposisi dan tanggapan resmi aparatur secara terbuka.
5. **Warta & Berita (`/berita` & `/berita/[id]`)**:
   - Tabulasi kategori: Berita Pembangunan, Pengumuman Resmi, Kegiatan Sosial, Program Pemuda/PKK.
   - Pencarian artikel instan.
   - Halaman detail berita: Konten bebas XSS yang disanitasi DOMPurify, jumlah pembaca unik (*view count*), tanggal rilis, dan tombol bagikan media sosial (WhatsApp, Facebook, Twitter, Salin Tautan).
6. **Data & Statistik Demografi (`/data`)**:
   - Visualisasi kartu statistik kependudukan: Total warga, jumlah kepala keluarga (KK), komposisi laki-laki vs perempuan.
   - Piramida / rentang umur: Anak-anak (0–17 tahun), Usia Produktif (18–59 tahun), Lansia (60+ tahun).
   - Sebaran mata pencaharian, status perkawinan, dan distribusi warga per rukun warga (RW).
7. **Pencarian Global (`/cari`)**:
   - Mesin pencari komprehensif yang memindai artikel berita, jenis permohonan surat, agenda kegiatan, dan fasilitas profil sekaligus.

### 3.2 Aliran Data & Integrasi Layanan
```
[Warga Mengisi Form Surat / Aduan]
                │
                ▼
[Validasi Sisi Klien (Format NIK, Nomor HP, Ukuran Berkas)]
                │
                ├──────────────────────────────────────────┐
                │                                          │
       (Jika Ada Berkas Foto)                     (Payload Data Teks)
                │                                          │
                ▼                                          ▼
     POST /api/upload                           POST /api/records
     (MIME & Magic Bytes Check)                 (Tabel: requests / complaints)
                │                                          │
                └─────────────────┬────────────────────────┘
                                  │
                                  ▼
                [Penyimpanan Database MySQL / TiDB]
                                  │
                                  ▼
                 [Penerbitan Kode Tiket Pelacakan]
                                  │
                                  ▼
                [Warga Memantau via /api/track/*]
```

### 3.3 Asisten Virtual AI "Arba" (Chatbot Widget)
- Tersemat pada berkas `components/chatbot/chat-widget.tsx` dan aktif di sudut kanan bawah setiap halaman publik.
- **Karakter & Persona**: Dinamai **"Arba"** (representasi Banjar Agung Ramah, Bijak, dan Adaptif). Menyapa dengan kesantunan budaya Banten (*"Sugeng rawuh! Saya Arba, asisten virtual Kelurahan Banjar Agung"*).
- **Fitur Cerdas**:
  - Secara proaktif mendeteksi kebutuhan warga: Jika warga menanyakan pengaduan jalan rusak, Arba memberikan jawaban prosedural sekaligus memunculkan tombol jalan pintas langsung menuju `/pengaduan`.
  - Jika warga bertanya tentang syarat SKTM atau KTP, Arba mengarahkan ke modul `/layanan`.
  - Terkoneksi dengan konfigurasi admin di dashboard: Admin dapat mengganti provider AI, mengatur topik yang dilarang, mengubah teks penolakan, serta memasukkan API Key secara mandiri.

---

## 4. Detail Layer 2: Frontend Admin Dashboard (`app/dashboard/*`)

Dashboard dirancang sebagai portal terpusat operasional harian aparatur kelurahan dengan proteksi otentikasi ketat.

### 4.1 Modul-Modul Dashboard
1. **Overview Metriks (`/dashboard`)**:
   - Ringkasan statistik real-time: Total Warga Terdaftar, Total Berita Terbit, Pengaduan Tertunda (*Pending*), dan Permohonan Surat Masuk.
   - Pengelompokan status surat: *Menunggu (Pending)*, *Diproses (In Process)*, *Siap Diambil (Ready)*, dan *Selesai (Completed)*.
   - Feed aktivitas cepat: 6 pengaduan terbaru dan 6 permohonan surat terkini dengan status interaktif.
2. **Manajemen Pelayanan Surat (`/dashboard/layanan`)**:
   - **Loket Pelayanan**: Verifikasi berkas warga, pembaruan status permohonan (*update status*), catatan disposisi staf kelurahan.
   - **Katalog Jenis Surat**: Konfigurasi jenis surat pengantar, syarat berkas, dan narasi pengantar.
   - **Template & Custom Field Builder**: Pengunggahan file master `.docx`, pemindaian variabel placeholder secara otomatis, pengaturan tipe input (teks, angka, tanggal, dropdown pilihan).
   - **Simulasi & Cetak Surat**: Editor cetak terintegrasi (`letter-print-editor.tsx`), pratinjau dokumen sebelum dicetak (`letter-simulation-preview.tsx`), penomoran surat resmi, dan export draf dokumen siap tanda tangan lurah.
3. **Master Kependudukan (`/dashboard/penduduk`)**:
   - Pencarian warga berdasarkan NIK, Nama, dan alamat RW/RT.
   - Penyaringan berdasarkan jenis kelamin, status kependudukan (Tetap / Pindah / Meninggal), status perkawinan, dan agama.
   - Operasi penambahan, penyuntingan data biodata kependudukan secara aman.
4. **Manajemen Pengaduan Warga (`/dashboard/pengaduan`)**:
   - Peninjauan bukti foto pengaduan warga.
   - Penetapan status: *Pending*, *Sedang Ditangani*, *Tuntas*, atau *Ditolak*.
   - Pemberian respon resmi aparatur yang langsung dapat dilihat warga di portal pelacakan publik.
5. **Publikasi Berita & Warta (`/dashboard/berita`, `/tambah`, `/[id]/edit`)**:
   - Editor konten kaya berbasis TipTap dengan fitur pemformatan teks, heading, kutipan, daftar angka/bullet, dan penyematan gambar ilustrasi.
   - Manajemen cover thumbnail berita dan penghitung pembaca organik.
6. **Agenda Kegiatan Kelurahan (`/dashboard/agenda`)**:
   - Pengelolaan kalender aktivitas rutin: Tanggal/waktu mulai dan selesai, lokasi spesifik, kategori acara (Rapat, Posyandu, Gotong Royong, Peringatan Hari Besar), dan status publikasi.
7. **Pengaturan CMS Situs (`/dashboard/settings`)**:
   - **Profil Umum**: Nama kelurahan, alamat kantor, email resmi, nomor WhatsApp pelayanan, tautan media sosial.
   - **Banner Per Halaman**: Mengatur gambar latar belakang, judul banner, dan tombol aksi per halaman publik (Beranda, Profil, Data, Layanan, Pengaduan, Berita).
   - **Statistik Demografi**: Pemutakhiran manual angka monografi kependudukan untuk tampilan publik.
   - **Konfigurasi Chatbot Arba**: Pemilihan engine LLM (`auto`, `groq`, `gemini`), model model name, suhu kreativitas (*temperature*), batas topik, serta kunci API khusus.
8. **Manajemen Akun Aparatur (`/dashboard/admins`) — [Super Admin Only]**:
   - Pendaftaran akun staf/kasi baru dengan kata sandi terenkripsi minimal 12 karakter.
   - Penentuan peran (*Role*): `superadmin`, `admin`, atau `operator`.
   - Konfigurasi izin modular berbasis fitur per akun.
   - Fitur aktivasi / penonaktifan akun staf yang mutasi atau berhenti bertugas.
9. **Rekam Jejak Audit Keamanan (`/dashboard/audit`) — [Super Admin Only]**:
   - Rekam jejak seluruh operasi sensitif: `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, dan `AKSES_DITOLAK`.
   - Menampilkan detail aktor (Nama, Email, Role), modul terdampak, timestamp presisi, serta modal peninjau detail perubahan data.

### 4.2 Role-Based Access Control (RBAC) & Matriks Otorisasi

Sistem menerapkan prinsip *Least Privilege* di mana akses staf dibatasi sesuai tugas pokok dan fungsinya.

| Modul Dashboard | Kode Izin (*Feature Key*) | Super Admin | Admin (Kasi/Staf) | Operator (Loket) | Warga / Publik |
|---|---|:---:|:---:|:---:|:---:|
| Ringkasan Statistik | `dashboard` | Full (Read/Write) | Berdasarkan Izin | Read Only | No Access |
| Layanan & Surat | `layanan` | Full (Read/Write) | Berdasarkan Izin | Validasi Loket | Tracking Only |
| Data Kependudukan | `penduduk` | Full (Read/Write) | Berdasarkan Izin | Read Only | Statistik Agregat |
| Pengaduan Masuk | `pengaduan` | Full (Read/Write) | Berdasarkan Izin | Disposisi | Input & Track |
| Berita & Artikel | `berita` | Full (Read/Write) | Berdasarkan Izin | No Access | Read Only |
| Agenda Kegiatan | `agenda` | Full (Read/Write) | Berdasarkan Izin | No Access | Read Only |
| Profil & Konten Web | `settings` | Full (Read/Write) | Berdasarkan Izin | No Access | Read Only |
| Manajemen Akun Admin | *(Eksklusif Superadmin)* | Full (Read/Write) | No Access | No Access | No Access |
| Rekam Jejak Audit | *(Eksklusif Superadmin)* | Full (Read/Write) | No Access | No Access | No Access |

---

## 5. Detail Layer 3: Backend API & Microservices (`app/api/*`)

Semua rute backend berada pada folder `app/api/*` dan dieksekusi dalam konteks Node.js Serverless/Server Runtime.

### 5.1 Katalog Endpoint API
| Endpoint | Method | Hak Akses | Deskripsi & Payload Utama | Respon Standar |
|---|---|---|---|---|
| `/api/auth` | `POST` | Public (Rate-Limited) | Autentikasi email & password admin | `{ token, profile }` + Set-Cookie |
| `/api/auth` | `DELETE` | Terautentikasi | Logout & pembersihan cookie sesi | `{ ok: true }` + Clear Cookie |
| `/api/records` | `GET` | Public / Admin | Mengambil data tabel yang diizinkan (filter query `table`, `op`, `id`, `orderBy`) | `{ data: [...] }` / `{ count: n }` |
| `/api/records` | `POST` | Anon / Admin | Menambah data baru (`table`, `row`) | `{ data: { id, ... } }` |
| `/api/records` | `PUT` | Admin Only | Memperbarui data yang ada (`table`, `id`, `patch`) | `{ ok: true }` |
| `/api/records` | `DELETE` | Admin Only | Menghapus record secara permanen (`table`, `id`) | `{ ok: true }` |
| `/api/track/requests` | `GET` | Public | Pelacakan surat warga via param `q` (min. 5 char) | `{ data: [SAFE_FIELDS] }` |
| `/api/track/complaints` | `GET` | Public | Pelacakan pengaduan warga via param `q` (min. 5 char) | `{ data: [SAFE_FIELDS] }` |
| `/api/chat` | `POST` | Public (Rate-Limited) | Komunikasi asisten AI Arba (`message`, `history`) | `{ reply: "...", actions: [...] }` |
| `/api/upload` | `POST` | Admin / Public | Upload berkas & foto dengan validasi Magic Byte | `{ url: "/uploads/folder/name" }` |
| `/api/dashboard-stats` | `GET` | Admin / Operator | Agregasi metriks penghitung data dashboard | `{ stats, requestBreakdown, ... }` |
| `/api/news/views` | `POST` | Public | Atomic increment jumlah pembaca artikel | `{ ok: true }` |
| `/api/admins` | `GET` | Super Admin | Mengambil daftar seluruh aparatur kelurahan | `[ { id, email, display_name, ... } ]` |
| `/api/admins` | `POST` | Super Admin | Mendaftarkan akun admin/operator baru | `{ ok: true, id }` |
| `/api/admins` | `PUT` | Super Admin | Memperbarui profil, password, atau hak akses staf | `{ ok: true }` |
| `/api/admins` | `DELETE` | Super Admin | Menghapus akun admin tertentu | `{ ok: true }` |
| `/api/audit` | `POST` | Admin Only | Mencatat rekam jejak aksi ke tabel `audit_logs` | `{ ok: true }` |
| `/api/seed` | `POST` | Super Admin | Inisialisasi skema tabel & data master awal | `{ logs: [...], at: "..." }` |

### 5.2 Endpoint Khusus & Mekanisme Keamanan

#### A. Proteksi Data Pribadi (PII) pada `/api/track/*`
Permintaan pelacakan publik dirancang agar tidak membocorkan data kependudukan warga lainnya:
- **Validasi Input**: Panjang query pencarian minimal 5 karakter guna mencegah *brute-force enumerasi*.
- **Field Whitelist (PII Masking)**:
  - Pada surat (`/api/track/requests`): Hanya mengembalikan `ticket_code, type_name, nama, status, admin_notes, created_at`. Data sensitif seperti `nik`, `form_data` (isi biodata lengkap), dan berkas lampiran **dihilangkan dari payload respon**.
  - Pada pengaduan (`/api/track/complaints`): Mengembalikan `ticket_code, nama, phone, category, title, message, photo_url, status, admin_response, created_at`.

#### B. Whitelist CRUD Engine pada `/api/records`
Endpoint generic CRUD mengeliminasi celah manipulasi objek langsung (*Mass Assignment* & *Arbitrary Table Injection*):
- **Tabel Resmi**: Hanya 9 tabel yang diizinkan (`profiles`, `residents`, `news`, `complaints`, `requests`, `letter_types`, `agenda`, `settings`, `audit_logs`). Permintaan pada tabel di luar daftar ini langsung ditolak dengan status HTTP 400.
- **Izin Baca Publik**: Hanya tabel `news`, `letter_types`, `agenda`, dan `settings` yang dapat dibaca tanpa autentikasi.
- **Izin Sisip Anonim**: Warga publik hanya diizinkan melakukan insert ke tabel `requests` dan `complaints` dengan pembatasan kolom yang ketat (`ANON_ALLOWED_FIELDS`).
- **Penyuntingan & Penghapusan**: Memerlukan validasi sesi profil JWT dan verifikasi izin RBAC per tabel (`TABLE_PERMISSION`).
- **Redaksi Kunci Sensitif**: Nilai pada tabel `settings` yang mengandung string `key`, `secret`, atau `password` secara otomatis disamarkan (*redacted*) jika diakses selain oleh Super Admin.

#### C. Multi-Provider AI Engine pada `/api/chat`
Arsitektur perutean AI Chatbot Arba memiliki kapabilitas failover multi-tingkat:
1. **Penyaringan Rate Limiter**: Klien dibatasi maksimal 10 panggilan pesan per menit per IP untuk mencegah eksploitasi kuota API.
2. **Dynamic Live Context**: Sistem secara otomatis mengambil informasi mutakhir profil Kelurahan Banjar Agung (nama lurah, alamat kantor, jam loket pelayanan, nomor kontak resmi WhatsApp) dari tabel `settings` dan menginjeksinya ke dalam *system prompt*.
3. **Penyedia AI & Model Fallback**:
   - **Mode Groq**: Memprioritaskan model utama (misal: `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`). Jika model pertama mengalami *rate limit* atau error HTTP 5xx, algoritma secara transparan mencoba model berikutnya dalam daftar kandidat.
   - **Mode Gemini**: Memprioritaskan `gemini-2.0-flash`, kemudian *failover* ke `gemini-1.5-flash` dan `gemini-1.5-flash-8b`.
4. **Guardrail Keamanan**: System instruction secara ketat melarang pemberian nasehat medis, pandangan politik praktis, instruksi pemrograman, atau percakapan di luar konteks pelayanan kelurahan, serta memiliki kekebalan terhadap teknik *prompt injection* / *jailbreak*.
5. **Action Intent Detection**: Mesin mengenali maksud percakapan pengguna (misal: keluhan selokan mampet atau permohonan surat domisili) dan menyematkan tombol navigasi langsung (*Direct Action Buttons*) di bawah balon obrolan.

#### D. Verifikasi Magic Bytes pada `/api/upload`
Untuk menangkal serangan *File Upload Vulnerability* dan *Polyglot Web Shell*:
- Pemeriksaan ekstensi ganda dan pemblokiran ekstensi berbahaya (`.svg`, `.html`, `.htm`, `.php`, `.sh`).
- Verifikasi header biner (*Magic Bytes*) dari buffer berkas:
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47`
  - GIF: `47 49 46 38`
  - WebP: Header format `RIFF`
  - PDF: `%PDF` (`25 50 44 46`)
  - DOCX: Format ZIP PK (`50 4B 03 04`)
- Berkas yang diunggah diberi nama acak berbasis timestamp dan UUID (`${Date.now()}_${UUID}_${SafeName}`) untuk menghindari benturan nama berkas dan serangan path traversal.

---

## 6. Detail Layer 4: Core Engine, Security & Libraries (`lib/*`, `proxy.ts`)

Layer ini merupakan fondasi operasional dan keamanan dari seluruh ekosistem SmartVil.

### 6.1 Arsitektur Otentikasi & Sesi
- **Penyimpanan Kredensial**: Password disimpan di tabel `profiles` menggunakan algoritma *Bcrypt* dengan cost factor 12 salt rounds (`lib/auth-server.ts`).
- **Penerbitan Token**: Token JWT dibuat dengan secret environment `JWT_SECRET` dan memiliki masa berlaku (*Time-to-Live*) selama **4 jam**.
- **Penyimpanan Sisi Klien**: Token disimpan ganda:
  1. Di dalam **HttpOnly Cookie** bernama `smartvil_token` dengan konfigurasi `SameSite: Lax`, `Path: /`, dan `Secure` pada mode produksi. Hal ini mencegah pembajakan token via JavaScript (Cross-Site Scripting).
  2. Di dalam `localStorage` untuk kemudahan injeksi header `Authorization: Bearer <token>` pada pemanggilan API asinkron dari browser.
- **Middleware Proxy Guard (`proxy.ts`)**:
  - Berfungsi sebagai reverse proxy filter di Next.js App Router.
  - Memeriksa setiap rute yang berawalan `/dashboard`. Jika cookie `smartvil_token` tidak ditemukan atau tanda tangan JWT tidak valid, klien secara instan dialihkan (*redirect*) ke halaman `/login`.

### 6.2 Engine Database & Whitelist CRUD
- **Koneksi Database Pool (`lib/db.ts`)**:
  - Dikelola sebagai pola desain *Singleton Connection Pool* menggunakan driver `mysql2/promise`.
  - Mendukung enkripsi SSL (`rejectUnauthorized: true`) untuk koneksi aman ke penyedia cloud seperti TiDB Cloud atau AWS RDS.
  - Mengaktifkan fitur `enableKeepAlive` untuk mengurangi *latency overhead* pembukaan koneksi TCP baru.
- **Keamanan Query**: Semua query eksekusi menggunakan *Parameterized Statements* (`?`), menjamin sistem kebal terhadap teknik serangan *SQL Injection*.

### 6.3 Sistem Rate Limiting & Resolusi Klien
- **Sliding-Window Limiter (`lib/rate-limit.ts`)**:
  - Pelacak frekuensi permintaan berbasis memori internal (*in-memory Map*).
  - Menyediakan mekanisme *garbage collection* otomatis setiap 60 detik melalui timer `unref()` agar tidak membebani memori RAM server.
- **Resolusi Alamat IP (`clientIp`)**:
  - Mampu mendeteksi alamat IP pengguna asli secara akurat di balik arsitektur Reverse Proxy atau Cloudflare melalui evaluasi header bertingkat: `x-real-ip` -> `x-forwarded-for` (elemen pertama) -> fallback string `"unknown"`.

### 6.4 Engine Template Surat Dinamis (DOCX/XML)
- **Modul `lib/letter-template.ts` & `lib/letter-constants.ts`**:
  - Membuka berkas dokumen Word (`.docx`) sebagai struktur ZIP menggunakan `PizZip`.
  - Mengurai berkas `word/document.xml` untuk mencari pola placeholder biner `{{variabel}}`.
  - Mampu menebak tipe field formulir secara otomatis (`guessFieldType`): jika nama placeholder mengandung "tanggal" dijadikan input date picker, "alamat" dijadikan textarea, dan "agama/status" dijadikan dropdown pilihan standar.
  - **Injeksi Data Dinamis**: Menggantikan placeholder dengan data yang dimasukkan warga, menambahkan nomor surat resmi kelurahan, narasi pengantar, tanggal penerbitan, serta identitas pejabat penandatangan.
  - **Pratinjau Langsung**: Menggunakan pustaka `docx-preview` dengan stylesheet khusus (`lib/docx-preview-styles.ts`) sehingga staf kelurahan dapat melihat hasil draf sebelum proses pencetakan fisik.

### 6.5 Engine Audit Log & CMS Config Store
- **Audit Logger (`lib/audit.ts`)**:
  - Setiap tindakan mutasi data oleh admin secara otomatis diposkan ke tabel `audit_logs` dengan informasi akun yang bersangkutan, modul aplikasi, tipe aksi, dan keterangan perubahan.
- **Penyimpanan Pengaturan Terpusat (`lib/settings-store.ts`)**:
  - Menyediakan fungsi generik `getSetting<T>` dan `saveSetting` yang beroperasi pada tabel `settings` berbasis format JSON terstruktur.
  - Menjadi landasan modul konfigurasi profil kelurahan (`site-config.ts`), manajemen banner (`banners-config.ts`), dan asisten virtual (`chatbot-config.ts`).

---

## 7. Tabel Ringkasan Pemetaan Seluruh File Proyek

Tabel di bawah ini memetakan seluruh file di dalam repositori SmartVil Kelurahan Banjar Agung:

| Jalur File (`Path`) | Layer / Kategori | Hak Akses (`Access`) | Peran & Fungsi Utama |
|---|---|---|---|
| `package.json` | Konfigurasi Proyek | Developer / Server | Metadata dependensi, skrip build, versi library Next.js 16, React 19, TipTap, MySQL2 |
| `next.config.ts` | Konfigurasi Proyek | Developer / Server | Konfigurasi build Next.js, optimasi gambar, dan pengaturan kompilator |
| `proxy.ts` | Security & Middleware | Server-side Only | Injeksi security headers dan proteksi akses rute `/dashboard` berbasis validasi JWT |
| `Dockerfile` | Kontainerisasi | DevOps / Server | Definisi pembuatan image Docker multi-stage build untuk deployment produksi |
| `docker-compose.yml` | Kontainerisasi | DevOps / Server | Konfigurasi orkestrasi kontainer aplikasi SmartVil dan database lokal |
| `DEPLOY.md` | Dokumentasi Teknis | Developer / SysAdmin | Panduan deployment VPS, Nginx reverse proxy, PM2, dan konfigurasi environment |
| `eslint.config.mjs` | Konfigurasi Linting | Developer | Konfigurasi aturan pengecekan kualitas kode TypeScript dan standar Next.js |
| `tidb-schema-import.sql` | Database DDL | Database Admin | Salinan skema SQL untuk inisialisasi basis data pada layanan TiDB Cloud |
| `mysql/schema.sql` | Database DDL | Database Admin | Skema lengkap tabel MySQL (`profiles`, `residents`, `news`, `complaints`, `requests`, dll) |
| **`app/layout.tsx`** | Layout Induk | Public | Root layout aplikasi, memuat font Inter, provider autentikasi, dan CSS global |
| `app/globals.css` | Styling Global | Public | Konfigurasi tema Tailwind CSS v4, variabel warna resmi kelurahan, dan utility |
| `app/letter-print.module.css`| Styling Khusus | Admin Only | Aturan CSS media cetak `@media print` untuk format presisi surat resmi A4/F4 |
| `app/(auth)/login/page.tsx` | Frontend (Auth) | Public (Admin Portal) | Antarmuka formulir login perangkat kelurahan dengan penanganan brute-force |
| **`app/(public)/layout.tsx`** | Frontend (Public) | Public | Layout portal warga, menyematkan Navbar, Footer, dan Widget Chatbot Arba |
| `app/(public)/page.tsx` | Frontend (Public) | Public | Beranda resmi Kelurahan Banjar Agung, hero banner, layanan kilat, berita, agenda |
| `app/(public)/profil/page.tsx`| Frontend (Public) | Public | Profil kelurahan: Sejarah, visi misi, daftar aparatur, fasilitas publik, peta batas |
| `app/(public)/layanan/page.tsx`| Frontend (Public) | Public | Portal permohonan surat administrasi mandiri warga dan fitur pelacakan tiket surat |
| `app/(public)/pengaduan/page.tsx`| Frontend (Public)| Public | Portal pengaduan dan aspirasi warga (Lapor Kelurahan) serta fitur pelacakan aduan |
| `app/(public)/berita/page.tsx`| Frontend (Public) | Public | Katalog warta berita, kategori pengumuman kelurahan, dan pencarian artikel |
| `app/(public)/berita/[id]/page.tsx`| Frontend (Public)| Public | Halaman detail artikel berita lengkap, counter pembaca, dan tombol share media sosial |
| `app/(public)/data/page.tsx` | Frontend (Public) | Public | Infografis data statistik kependudukan, demografi usia, gender, dan sebaran wilayah |
| `app/(public)/cari/page.tsx` | Frontend (Public) | Public | Halaman hasil pencarian terpadu lintas berita, agenda, layanan, dan profil |
| **`app/dashboard/layout.tsx`**| Frontend (Admin) | Admin / Operator | Layout dashboard admin, navigasi sidebar modular, validasi sesi, status user login |
| `app/dashboard/page.tsx` | Frontend (Admin) | Admin / Operator | Ringkasan dashboard: kartu indikator utama, grafik status surat, feed laporan warga |
| `app/dashboard/layanan/page.tsx`| Frontend (Admin) | Admin (Layanan) | Loket pemrosesan surat, upload master .docx, builder form dinamis, & cetak surat |
| `app/dashboard/penduduk/page.tsx`| Frontend (Admin) | Admin (Penduduk) | Master database kependudukan RW/RT, filter demografi, penambahan & edit biodata |
| `app/dashboard/pengaduan/page.tsx`| Frontend (Admin)| Admin (Pengaduan) | Pengelolaan aduan warga, peninjauan bukti foto, update status, dan input tanggapan |
| `app/dashboard/berita/page.tsx`| Frontend (Admin) | Admin (Berita) | Daftar artikel berita kelurahan, analitik pembaca, status tayang, opsi hapus/edit |
| `app/dashboard/berita/tambah/page.tsx`| Frontend (Admin)| Admin (Berita) | Formulir publikasi berita baru menggunakan rich-text editor TipTap & upload cover |
| `app/dashboard/berita/[id]/edit/page.tsx`| Frontend (Admin)| Admin (Berita) | Formulir penyuntingan artikel berita yang sudah terbit beserta penggantian berkas gambar |
| `app/dashboard/agenda/page.tsx`| Frontend (Admin) | Admin (Agenda) | Pengelolaan jadwal kalender kelurahan (Rabu Asri, Posyandu, Rapat RT/RW) |
| `app/dashboard/settings/page.tsx`| Frontend (Admin)| Admin (Settings) | Pengaturan CMS: Profil kelurahan, kontak, banner per seksi, & konfigurasi AI Arba |
| `app/dashboard/admins/page.tsx`| Frontend (Admin) | Super Admin | Manajemen akun aparatur, penetapan peran (superadmin/admin/operator), & izin modul |
| `app/dashboard/audit/page.tsx`| Frontend (Admin) | Super Admin | Peninjau rekam jejak audit keamanan, pemfilteran aksi sistem, & modal detail histori |
| **`app/api/auth/route.ts`** | Backend (API) | Public / Terautentikasi | Otentikasi login admin, penerbitan JWT HttpOnly Cookie, dan penanganan logout |
| `app/api/records/route.ts` | Backend (API) | Public / Admin | Universal CRUD engine dengan proteksi whitelist tabel, sanitasi kolom, & RBAC |
| `app/api/track/requests/route.ts`| Backend (API) | Public (Safe PII) | Pelacakan status surat warga tanpa membocorkan identitas pribadi pelapor |
| `app/api/track/complaints/route.ts`| Backend (API) | Public (Safe PII) | Pelacakan status tindak lanjut aduan warga secara transparan dan aman |
| `app/api/chat/route.ts` | Backend (API) | Public (Rate-Limited) | Mesin asisten AI Arba berbasis Groq / Gemini dengan failover multi-model cerdas |
| `app/api/upload/route.ts` | Backend (API) | Public / Admin | Pengunggahan file & foto dengan validasi ekstensi, MIME type, dan Magic Bytes |
| `app/api/dashboard-stats/route.ts`| Backend (API) | Admin / Operator | Agregasi data statistik kependudukan, warta, pengaduan, dan surat untuk overview |
| `app/api/news/views/route.ts`| Backend (API) | Public | Atomic counter penambahan jumlah pembaca artikel berita dengan proteksi flood IP |
| `app/api/admins/route.ts` | Backend (API) | Super Admin | Endpoint CRUD data akun aparatur kelurahan dan hashing kata sandi aman |
| `app/api/audit/route.ts` | Backend (API) | Admin Only | Pencatatan rekam jejak aktivitas aparatur ke tabel audit_logs basis data |
| `app/api/seed/route.ts` | Backend (API) | Super Admin | Inisialisasi skema tabel otomatis dan penyemaian data contoh awal (*seeding*) |
| `components/berita-editor.tsx`| Component | Admin Only | Rich text editor berbasis TipTap dengan tombol pemformatan, heading, list, dan link |
| `components/letter-print-editor.tsx`| Component | Admin Only | Editor draf cetak surat dengan pratinjau styling dokumen resmi sebelum diproses |
| `components/letter-print-document.tsx`| Component | Admin Only | Komponen layout kop surat resmi, batang tubuh, tanda tangan, dan stempel kelurahan |
| `components/letter-simulation-preview.tsx`| Component | Admin Only | Pratinjau interaktif hasil konversi dokumen docx langsung pada peramban web |
| `components/dashboard/banner-management.tsx`| Component | Admin Only | Panel manajemen visual banner per seksi halaman publik |
| `components/chatbot/chat-widget.tsx`| Component | Public | Widget melayang chatbot interaktif Arba di portal publik warga |
| `components/search/global-search-modal.tsx`| Component | Public | Modal dialog pencarian instan dengan shortcut keyboard (Ctrl+K / Cmd+K) |
| `components/berita/social-share.tsx`| Component | Public | Widget tombol berbagi artikel berita ke platform media sosial |
| `components/layout/navbar.tsx`| Component | Public | Navigasi atas portal publik dengan tautan menu, status aktif, dan tombol darurat |
| `components/layout/footer.tsx`| Component | Public | Kaki halaman publik berisi identitas kantor kelurahan, peta lokasi, dan kontak resmi |
| `components/layout/page-banner.tsx`| Component | Public | Komponen banner seragam di bagian atas halaman-halaman portal publik |
| `components/ui/button.tsx` | Component (UI) | Shared | Komponen tombol atomik dengan berbagai varian styling (primary, outline, ghost) |
| `components/ui/card.tsx` | Component (UI) | Shared | Komponen kontainer kartu atomik dengan header, content, dan footer terstandarisasi |
| `components/ui/input.tsx` | Component (UI) | Shared | Elemen input formulir atomik dengan styling fokus dan penanganan error |
| `components/ui/label.tsx` | Component (UI) | Shared | Elemen label teks pendamping input formulir |
| `components/ui/select.tsx` | Component (UI) | Shared | Komponen pemilih dropdown atomik |
| `components/ui/tabs.tsx` | Component (UI) | Shared | Komponen tabulasi navigasi konten horizontal |
| `components/ui/textarea.tsx` | Component (UI) | Shared | Elemen textarea atomik untuk input teks multi-baris |
| `components/ui/toast.tsx` | Component (UI) | Shared | Notifikasi toast mengambang untuk umpan balik sukses/gagal operasi pengguna |
| `contexts/AuthContext.tsx` | Context | Client-side Only | React Context penyedia status user terautentikasi, profil peran, dan fungsi `canAccess` |
| `hooks/use-polling.ts` | Custom Hook | Client-side Only | Hook polling berkala untuk pembaruan data real-time pada dashboard |
| `lib/db.ts` | Core / Library | Server-side Only | Konfigurasi connection pool MySQL2 / TiDB Cloud dan fungsi eksekusi query |
| `lib/records.ts` | Core / Library | Server-side Only | Engine CRUD data master dengan pembatasan tabel resmi, whitelist kolom, & filter |
| `lib/auth-server.ts` | Core / Library | Server-side Only | Verifikasi JWT server-side, hashing kata sandi bcrypt, dan penjaga Super Admin |
| `lib/api.ts` | Core / Library | Client-side Only | Wrapper fetch sisi klien terpadu untuk pemanggilan endpoint `/api/records` & token |
| `lib/rate-limit.ts` | Core / Library | Server-side Only | Sliding-window in-memory rate limiter untuk membatasi frekuensi request per klien IP |
| `lib/permissions.ts` | Core / Library | Shared | Definisi daftar fitur sistem yang dapat diatur izinnya (`MANAGEABLE_FEATURES`) |
| `lib/audit.ts` | Core / Library | Shared | Helper penulisan log aktivitas audit keamanan dari sisi frontend ke backend |
| `lib/settings-store.ts` | Core / Library | Server & Client | Penyimpan nilai konfigurasi modular berbasis JSON pada tabel `settings` |
| `lib/site-config.ts` | Core / Library | Shared | Definisi tipe data profil kelurahan, data aparatur, fasilitas, dan kontak resmi |
| `lib/banners-config.ts` | Core / Library | Shared | Definisi konfigurasi teks, gambar, dan tombol banner per halaman publik |
| `lib/chatbot-config.ts` | Core / Library | Shared | Pengaturan default, model, suhu, topik larangan, dan store konfigurasi AI Arba |
| `lib/letters.ts` | Core / Library | Shared | Helper data katalog jenis surat permohonan administrasi warga |
| `lib/letter-constants.ts` | Core / Library | Shared | Konstanta field bawaan, dropdown standar kependudukan, dan pemetaan placeholder |
| `lib/letter-template.ts` | Core / Library | Shared | Parser berkas template DOCX, detektor variabel placeholder, dan generator dokumen |
| `lib/docx-preview-styles.ts`| Core / Library | Client-side Only | Definisi styling CSS internal untuk rendering pratinjau dokumen Word di browser |
| `lib/calendar.ts` | Core / Library | Shared | Utilitas pemformatan tanggal Indonesia dan integrasi jadwal agenda kelurahan |
| `lib/uploadImage.ts` | Core / Library | Client-side Only | Helper pengiriman form data berkas gambar ke endpoint `/api/upload` |
| `lib/utils.ts` | Core / Library | Shared | Fungsi utilitas penggabungan class CSS Tailwind (`clsx` dan `twMerge`) |
| `deploy/nginx.conf` | Deployment | SysAdmin | Konfigurasi reverse proxy Nginx, kompresi Gzip, SSL termination, & caching |
| `deploy/setup-vps.sh` | Deployment | SysAdmin | Skrip shell otomatisasi instalasi Node.js, PM2, Nginx, dan firewall di server Linux |
| `scripts/seed_berita_agenda.js`| Script | Developer | Skrip Node.js mandiri untuk menyuntikkan data berita dan agenda awal |
| `scripts/init-db.js` | Script | Developer | Skrip pengujian koneksi database dan inisialisasi tabel |
| `scripts/seed-supabase.mjs` | Script | Developer | Skrip migrasi opsional untuk lingkungan Supabase |
| `scripts/migrate-to-supabase.mjs`| Script | Developer | Skrip sinkronisasi data relasional menuju database sekunder |
| `scripts/inject_testing.py` | Script Testing | QA / Tester | Skrip pengujian otomatis injeksi data uji untuk validasi form |
| `scripts/generate_manuscript.py`| Script Generator| Developer | Generator naskah dokumentasi teknis sistem |

---

*Dokumen ini diperbarui secara berkala sesuai dengan evolusi arsitektur dan pemutakhiran basis kode SmartVil Kelurahan Banjar Agung.*
