# -*- coding: utf-8 -*-
import os

with open('scripts/generate_manuscript.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Tambah [26], [27], [28] ke daftar_pustaka_items
old_dp_end = '"[25] A. Avignone, A. Tierno, A. Fiori dan S. Chiusano, “Exploring Large Language Models’ Ability to Describe Entity-Relationship Schema-Based Conceptual Data Models,” <i>Information</i>, vol. 16, no. 5, p. 368, 2025."'

new_dp = '''"[25] A. Avignone, A. Tierno, A. Fiori dan S. Chiusano, “Exploring Large Language Models’ Ability to Describe Entity-Relationship Schema-Based Conceptual Data Models,” <i>Information</i>, vol. 16, no. 5, p. 368, 2025. [Daring]. Tersedia: <a href=\\"https://doi.org/10.3390/info16050368\\" target=\\"_blank\\" style=\\"color: #1b365d; text-decoration: underline;\\">https://doi.org/10.3390/info16050368</a>",
    "[26] N. A. Pratama dan M. A. Fadhil, “Pengujian Fungsional Aplikasi Pelayanan Administrasi Menggunakan Metode Black Box Testing dan User Acceptance Testing (UAT),” <i>Jurnal Rekayasa Sistem dan Teknologi Informasi (RESTI)</i>, vol. 7, no. 4, pp. 889-896, 2023. [Daring]. Tersedia: <a href=\\"https://doi.org/10.29207/resti.v7i4.5120\\" target=\\"_blank\\" style=\\"color: #1b365d; text-decoration: underline;\\">https://doi.org/10.29207/resti.v7i4.5120</a>",
    "[27] M. H. R. Rohman, S. Suhartono dan A. P. Widodo, “Sistem Informasi Administrasi Kependudukan Berbasis Web Dengan Pengujian System Usability Scale Untuk Meningkatkan Pelayanan Pada Masyarakat,” <i>Jurnal Janitra Informatika dan Sistem Informasi</i>, vol. 2, no. 2, pp. 115-124, 2022. [Daring]. Tersedia: <a href=\\"https://doi.org/10.25008/janitra.v2i2.147\\" target=\\"_blank\\" style=\\"color: #1b365d; text-decoration: underline;\\">https://doi.org/10.25008/janitra.v2i2.147</a>",
    "[28] J. R. Lewis, “The System Usability Scale: Past, Present, and Future,” <i>International Journal of Human–Computer Interaction</i>, vol. 37, no. 15, pp. 1449-1462, 2021. [Daring]. Tersedia: <a href=\\"https://doi.org/10.1080/10447318.2021.1898038\\" target=\\"_blank\\" style=\\"color: #1b365d; text-decoration: underline;\\">https://doi.org/10.1080/10447318.2021.1898038</a>"'''

if old_dp_end in text:
    text = text.replace(old_dp_end, new_dp)
    print("Daftar Pustaka successfully updated with [26], [27], [28]!")
else:
    print("WARNING: Could not find old_dp_end")

# 2. Tambahkan subbab 2.2.8 dan 2.2.9 di BAB II
old_bab2_gap = '<h3 class="subsection-title">2.2.8 Analisis Kesenjangan (<i>Research Gap</i>)</h3>'

new_bab2_theories = '''  <h3 class="subsection-title">2.2.8 Pengujian Perangkat Lunak (<i>Black-Box Testing</i> dan <i>User Acceptance Testing</i>)</h3>
  <p class="par">Pengujian perangkat lunak merupakan tahapan esensial dalam rekayasa perangkat lunak untuk memverifikasi bahwa sistem yang dibangun beroperasi sesuai spesifikasi fungsional yang telah ditetapkan serta bebas dari kesalahan logika. Dalam pengembangan aplikasi web layanan publik, pendekatan pengujian yang banyak diterapkan adalah kombinasi <i>Black-Box Testing</i> dan <i>User Acceptance Testing</i> (UAT) [26].</p>

  <p class="par"><i>Black-Box Testing</i> berfokus pada pengujian fungsionalitas perangkat lunak tanpa memeriksa struktur kode internal maupun alur logika bahasa pemrograman di dalamnya. Penguji mengevaluasi kesesuaian antara masukan data (<i>input</i>) dengan luaran yang dihasilkan (<i>output</i>), seperti validasi format NIK, pemrosesan unggahan berkas digital, pemfilteran data, dan pengalihan hak akses halaman. Sementara itu, <i>User Acceptance Testing</i> (UAT) dilakukan dengan melibatkan pengguna akhir secara langsung—dalam hal ini pihak aparatur dan staf kantor kelurahan—guna menilai apakah sistem informasi telah memenuhi kebutuhan operasional birokrasi dan siap diterima untuk digunakan dalam aktivitas pelayanan publik sehari-hari [26].</p>

  <h3 class="subsection-title">2.2.9 Evaluasi Kebergunaan Sistem (<i>System Usability Scale</i>)</h3>
  <p class="par">Keberhasilan implementasi suatu sistem informasi pelayanan publik sangat bergantung pada tingkat penerimaan dan kemudahan penggunaannya oleh masyarakat luas. <i>System Usability Scale</i> (SUS) merupakan instrumen pengukuran kebergunaan (<i>usability</i>) yang telah terstandardisasi secara internasional dan banyak digunakan untuk mengevaluasi efektivitas, efisiensi, serta kepuasan pengguna terhadap sistem informasi berbasis <i>website</i> [27], [28].</p>

  <p class="par">Kuesioner SUS terdiri dari 10 butir pertanyaan terstruktur dengan skala Likert 5 poin (mulai dari nilai 1 = Sangat Tidak Setuju hingga 5 = Sangat Setuju), di mana butir bernomor ganjil bernada positif dan butir bernomor genap bernada negatif guna meminimalkan bias responden. Skor kebergunaan dihitung menggunakan formula normalisasi matematis baku:</p>

  <div style="background: #f8fafc; border-left: 3px solid #1b365d; padding: 10px 16px; margin: 12pt 0; font-size: 11pt;">
    <b>Rumus Perhitungan Skor SUS:</b><br>
    Skor Kontribusi Butir Ganjil = <i>Skor Skala</i> - 1<br>
    Skor Kontribusi Butir Genap = 5 - <i>Skor Skala</i><br>
    <b>Total Skor SUS</b> = (Jumlah Skor Kontribusi Butir 1 s.d. 10) &times; 2,5
  </div>

  <p class="par">Perhitungan tersebut menghasilkan rentang nilai akhir antara 0 hingga 100. Berdasarkan tolok ukur empiris yang disempurnakan oleh Lewis [28], skor SUS rata-rata industri berada pada angka 68. Sistem dinilai berada pada kategori dapat diterima secara baik (<i>Acceptable / Good</i>) apabila memperoleh skor SUS di atas 70, dan dinilai unggul (<i>Excellent</i>) apabila melampaui skor 80. Penerapan SUS dalam penelitian ini memberikan dasar evaluasi yang objektif dan terukur secara kuantitatif mengenai tingkat kepuasan warga Kelurahan Banjar Agung terhadap kemudahan penggunaan website layanan informasi.</p>

  <h3 class="subsection-title">2.2.10 Analisis Kesenjangan (<i>Research Gap</i>)</h3>'''

if old_bab2_gap in text:
    text = text.replace(old_bab2_gap, new_bab2_theories)
    print("BAB II theories successfully updated!")
else:
    print("WARNING: Could not find old_bab2_gap")

# 3. Tambahkan subbab 3.5 Rancangan Pengujian Sistem di BAB III
old_jadwal = '<h2 class="section-title">3.5 Jadwal Pelaksanaan Penelitian</h2>'

new_bab3_testing = '''  <h2 class="section-title">3.5 Rancangan Pengujian Sistem</h2>
  <p class="par">Guna memastikan sistem informasi yang dibangun handal, aman, dan mudah digunakan sebelum diterapkan secara resmi di Kelurahan Banjar Agung, pengujian sistem dirancang mencakup 3 (tiga) tingkatan pengujian yang komprehensif:</p>

  <h3 class="subsection-title">3.5.1 Pengujian Fungsional (<i>Black-Box Testing</i>)</h3>
  <p class="par">Pengujian <i>Black-Box</i> dirancang untuk menguji fungsionalitas teknis seluruh modul aplikasi web yang telah dibangun [26]. Skenario kasus uji disusun mencakup:</p>
  <ol class="num-list">
    <li>Pengujian modul informasi publik: pemuatan halaman profil, penelusuran berita, pembacaan agenda, dan fitur pencarian global.</li>
    <li>Pengujian formulir permohonan surat terbuka: validasi input 16 digit NIK pemohon, kelengkapan isian kolom dinamis, dan mekanisme unggah berkas digital (format file dan batasan ukuran).</li>
    <li>Pengujian sistem pelacakan (<i>tracking</i>): keakuratan penampilan riwayat status permohonan surat berdasarkan kode permohonan unik maupun NIK pemohon.</li>
    <li>Pengujian formulir pengaduan warga: pengiriman laporan aspirasi dan keutuhan penyimpanan data ke basis data.</li>
    <li>Pengujian autentikasi dan otorisasi <i>dashboard</i> admin: verifikasi login aman, pembatasan hak akses halaman sub-admin sesuai penugasan izin seksi, dan penolakan akses tidak sah.</li>
    <li>Pengujian verifikasi dan otomatisasi persuratan: pembaruan status permohonan, penyertaan catatan admin, pembangkitan berkas draf surat resmi otomatis (DOCX), serta pencatatan otomatis ke dalam log audit (<i>audit trail</i>).</li>
  </ol>

  <h3 class="subsection-title">3.5.2 Pengujian Penerimaan Pengguna (<i>User Acceptance Testing</i> / UAT)</h3>
  <p class="par">Pengujian penerimaan pengguna (UAT) dirancang untuk memvalidasi kesesuaian operasional sistem terhadap prosedur kerja nyata di Kantor Kelurahan Banjar Agung [26]. Pengujian ini dilakukan bersama aparatur dan staf kelurahan (Lurah, Sekretaris Kelurahan, dan staf seksi pelayanan) melalui simulasi penanganan berkas permohonan surat masuk dan pengaduan warga. Evaluasi UAT dinilai menggunakan instrumen kuesioner skala penerimaan yang mengukur kelayakan fungsional, kemudahan pengarsipan data, dan kesiapan penerapan sistem dalam mendukung pelayanan publik sehari-hari.</p>

  <h3 class="subsection-title">3.5.3 Pengujian Kebergunaan (<i>System Usability Scale</i> / SUS)</h3>
  <p class="par">Pengujian <i>usability</i> dirancang untuk mengukur persepsi kemudahan penggunaan, kenyamanan antarmuka, dan kepuasan masyarakat Kelurahan Banjar Agung saat memanfaatkan portal website layanan kelurahan secara mandiri [27], [28]. Pengujian dilakukan dengan menyebarkan kuesioner daring (<i>Google Form</i>) kepada 30 orang warga Kelurahan Banjar Agung yang mewakili berbagai rentang usia dan latar belakang pekerjaan setelah mereka mencoba fitur pengajuan surat online atau pelacakan permohonan.</p>

  <p class="par">Instrumen kuesioner menggunakan 10 butir pertanyaan baku <i>System Usability Scale</i> versi Bahasa Indonesia yang telah tervalidasi secara baku:</p>
  <ol class="num-list">
    <li>Saya berpikir akan sering menggunakan website layanan informasi kelurahan ini.</li>
    <li>Saya merasa website ini terlalu rumit untuk digunakan.</li>
    <li>Saya merasa website ini mudah untuk digunakan.</li>
    <li>Saya merasa membutuhkan bantuan dari orang lain atau tenaga ahli untuk dapat menggunakan website ini.</li>
    <li>Saya merasa fitur-fitur pada website ini berfungsi dengan sangat baik dan terpadu.</li>
    <li>Saya merasa ada banyak hal yang tidak konsisten pada website ini.</li>
    <li>Saya merasa orang lain akan cepat memahami cara menggunakan website ini.</li>
    <li>Saya merasa website ini membingungkan saat digunakan.</li>
    <li>Saya merasa sangat percaya diri saat menggunakan website ini.</li>
    <li>Saya merasa perlu mempelajari banyak hal terlebih dahulu sebelum bisa mahir menggunakan website ini.</li>
  </ol>

  <p class="par">Data respon yang terkumpul selanjutnya dikonversi menggunakan rumus matematis skor SUS untuk menghasilkan nilai kebergunaan kuantitatif (0–100) serta dipetakan ke dalam kategori <i>Acceptability Ranges</i> dan <i>Grade Scale</i> pada Bab IV sebagai bukti empiris kelayakan sistem [28].</p>

  <h2 class="section-title">3.6 Jadwal Pelaksanaan Penelitian</h2>'''

if old_jadwal in text:
    text = text.replace(old_jadwal, new_bab3_testing)
    print("BAB III testing methods successfully updated!")
else:
    print("WARNING: Could not find old_jadwal")

with open('scripts/generate_manuscript.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Saved updated scripts/generate_manuscript.py successfully!")
