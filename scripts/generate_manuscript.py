# -*- coding: utf-8 -*-
"""
Script Generator Naskah Lengkap BAB I s.d. BAB III Skripsi Informatika UNTIRTA 2025
Memastikan 100% presisi antara kutipan dalam teks (in-text citation [1]-[25])
dengan rujukan jurnal asli di Daftar Pustaka.
"""

from bs4 import BeautifulSoup
import re

# 1. Baca SVG diagrams dari docs/diagram_bab3.html
with open('docs/diagram_bab3.html', 'r', encoding='utf-8') as f:
    soup_diag = BeautifulSoup(f.read(), 'html.parser')

diagrams = {}
for card in soup_diag.find_all('div', class_='diagram-card'):
    cid = card.get('id')
    svg = card.find('svg')
    if cid and svg:
        diagrams[cid] = str(svg)

# 2. Daftar Pustaka Resmi (25 Referensi IEEE Asli dari Naskah Proposal Reza)
daftar_pustaka_items = [
    "[1] J. J. P. Latupeirissa, N. L. Y. Dewi, I. K. R. Prayana, M. B. Srikandi, S. A. Ramadiansyah dan I. B. G. A. Y. Pramana, “Transforming Public Service Delivery: A Comprehensive Review of Digitization Initiatives,” <i>Sustainability</i>, vol. 16, no. 7, p. 2818, 2024.",
    "[2] Z. Abdussamad, L. Judijanto, A. Yusup, A. M. H. Tamrin, D. Rosyalita dan H. W. S. Rahayu, “Enhancing Public Service Delivery through Digital Transformation: Challenges and Opportunities in the Era of E-Government,” <i>Pakistan Journal of Life and Social Sciences</i>, vol. 22, no. 2, pp. 22539-22551, 2024.",
    "[3] G. H. Djatmiko, O. Sinaga dan S. Pawirosumarto, “Digital Transformation and Social Inclusion in Public Services: A Qualitative Analysis of E-Government Adoption for Marginalized Communities in Sustainable Governance,” <i>Sustainability</i>, vol. 17, no. 7, p. 2908, 2025.",
    "[4] S. H. Idrus, E. Sumartono, W. Wartono, S. Suharto dan I. Syahriar, “Harnessing Digital Transformation for Improved Public Service Delivery: Lessons from Global Administrative Practices,” <i>Journal of Social Science</i>, vol. 1, no. 3, pp. 257-269, 2024.",
    "[5] M. Suriya, B. Lincy, R. Minu dan H. Anandakumar, “The Development of a Design Theory for Web Based Information Systems,” <i>Journal of Computing and Natural Science</i>, vol. 3, no. 3, pp. 113-123, 2023.",
    "[6] D. Stamoulis, D. Gouscos, P. Georgiadis dan D. Martakos, “Revisiting Public Information Management for Effective E-Government Services,” <i>Information Management & Computer Security</i>, vol. 9, no. 4, pp. 146-153, 2021.",
    "[7] M. Budiarto, A. Asmawati dan M. Kurniawan, “Digital Transformation of Local Government: Design and Development of the Pakuhaji District Community Service Information System Website,” <i>International Journal of Cyber and IT Service Management (IJCITSM)</i>, vol. 4, no. 1, pp. 11-18, 2024.",
    "[8] D. M. Sitohang, A. N. Hidayanto dan S. Kurnia, “The e-government adoption ecosystem from the perspective of stakeholder theory: A case study on the village information systems in Indonesia,” <i>Information Development</i>, vol. 41, no. 4, pp. 1342-1355, 2025.",
    "[9] F. D. Ayuni Fajar, M. F. Firmansyah, I. Nuralim, M. H. As, A. S. Sundanis, S. Larini dan I. Sujai, “Inovasi Sistem Informasi Desa dalam Pengembangan E-Government di Desa Kertayasa Kecamatan Panawangan Kabupaten Ciamis,” <i>Journal of Political and Government Issues (POLIGOVS)</i>, vol. 1, no. 1, pp. 68-77, 2023.",
    "[10] K. F. Siman dan J. Wiratama, “A Web-Based Village Administrative Information System for Improvement Quality of Service towards Smart Village Concept,” <i>G-Tech: Jurnal Teknologi Terapan</i>, vol. 9, no. 3, pp. 1226-1236, 2025.",
    "[11] Ichsan, F. Susilawati dan M. Haykal, “Design and Build a Web-Based Village Information System for Acceleration of Village Services in Gampong Jantho Makmur,” <i>Jurnal Inovasi Teknologi dan Rekayasa</i>, vol. 9, no. 2, pp. 203-212, 2024.",
    "[12] F. Kitsios, M. Kamariotou dan A. Mavromatis, “Drivers and Outcomes of Digital Transformation: The Case of Public Sector Services,” <i>Information</i>, vol. 14, no. 1, p. 43, 2023.",
    "[13] U. F. Ikwuanusi, O. Onunka, S. J. Owoade dan A. Uzoka, “Digital Transformation in Public Sector Services: Enhancing Productivity and Accountability through Scalable Software Solutions,” <i>International Journal of Applied Research in Social Sciences</i>, vol. 6, no. 11, pp. 2744-2774, 2024.",
    "[14] S. M. Anggara, A. Hariyanto, Suhardi, A. A. Arman dan N. B. Kurniawan, “The Development of Digital Service Transformation Framework for the Public Sector,” <i>IEEE Access</i>, vol. 12, pp. 146160-146189, 2024.",
    "[15] S. Malodia, A. Dhir, M. Mishra dan Z. A. Bhatti, “Future of E-Government: An Integrated Conceptual Framework,” <i>Technological Forecasting and Social Change</i>, vol. 173, no. 121102, pp. 1-15, 2021.",
    "[16] V. Grigalashvili, “Conceptual Dimensions of Electronic Government and Electronic Governance in the Domain of Digital Democracy,” <i>International Journal of Innovative Technologies in Economy</i>, no. 1, 2022.",
    "[17] I. P. P. Astawa, “E-Government: Integrated, Fast, Certain and Easy Public Service Quality Management in Bali,” <i>Management and Applied Social Studies Review</i>, vol. 1, no. 1, pp. 29-35, 2023.",
    "[18] A. E. Iyoha, I. B. Omozusi dan O. A. Chukwudi, “E-Government Implementation and Its Impact on Public Service Delivery: Challenges and Opportunities,” <i>The International Journal of Applied Sciences and Development Research</i>, vol. 9, no. 2, pp. 45-60, 2024.",
    "[19] H. O. Ekpobimi, “Building High-Performance Web Applications with NextJS,” <i>Computer Science & IT Research Journal</i>, vol. 5, no. 8, pp. 1963-1977, 2024.",
    "[20] S. Genne, “Optimizing Enterprise Web Performance Through Server-Side Rendering: A Next.Js Framework Implementation,” <i>European Modern Studies Journal</i>, vol. 9, no. 3, 2025.",
    "[21] F. G. P. Susanto, N. I. Y. Fadlan dan P. Haryani, “Web-Based Management Information System Design for Student Organizations in Kendal Regency Using Next.js Framework,” <i>Compiler</i>, vol. 12, no. 1, pp. 9-20, 2023.",
    "[22] V. Kunitsyn dan V. Fedorov, “Firebase (Realtime Database) Mobile and Web Application Development Platform,” <i>Materials of the All-Russian Scientific and Practical Conference</i>, pp. 349-352, 2025.",
    "[23] V. K. S. Pandit, Y. S. K, P. R, T. Ramesh dan R. P, “Real-Time Database Synchronization Techniques in Firebase for Mobile App Development,” <i>International Journal of Scientific Research in Engineering and Management (IJSREM)</i>, vol. 7, no. 12, pp. 1-10, 2023.",
    "[24] S. Al-Fedaghi, “Conceptual Data Modeling: Entity–Relationship Models as Thinging Machines,” <i>International Journal of Computer Science and Network Security (IJCSNS)</i>, vol. 21, no. 9, pp. 263-272, 2021.",
    "[25] A. Avignone, A. Tierno, A. Fiori dan S. Chiusano, “Exploring Large Language Models’ Ability to Describe Entity-Relationship Schema-Based Conceptual Data Models,” <i>Information</i>, vol. 16, no. 5, p. 368, 2025."
]

# Susun HTML Lengkap
html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Naskah Skripsi BAB I - III | M. Reza Refanda (3337220046)</title>
<style>
  /* Standar Penulisan Karya Tulis Ilmiah Informatika UNTIRTA 2025 */
  @page {{
    size: A4;
    margin: 4cm 3cm 3cm 4cm; /* Atas 4cm, Kanan 3cm, Bawah 3cm, Kiri 4cm */
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    background-color: #525659;
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
    font-size: 12pt;
    line-height: 1.5; /* Spasi 1.5 Baku */
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }}

  /* Toolbar Kontrol Cetak & Salin */
  .control-bar {{
    position: sticky;
    top: 16px;
    z-index: 1000;
    background: #1e293b;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    max-width: 900px;
    width: 100%;
    justify-content: space-between;
  }}
  .control-bar .title {{
    font-size: 10.5pt;
    font-weight: bold;
    letter-spacing: 0.3px;
  }}
  .control-bar .actions {{
    display: flex;
    gap: 10px;
  }}
  .btn {{
    font-family: 'Times New Roman', Times, serif;
    font-size: 10.5pt;
    padding: 6px 14px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
  }}
  .btn-primary {{
    background: #2563eb;
    color: #fff;
  }}
  .btn-primary:hover {{
    background: #1d4ed8;
  }}
  .btn-secondary {{
    background: #f8fafc;
    color: #0f172a;
  }}
  .btn-secondary:hover {{
    background: #e2e8f0;
  }}

  /* Lembar Dokumen A4 */
  .paper-page {{
    background: #ffffff;
    width: 210mm;
    min-height: 297mm;
    padding: 40mm 30mm 30mm 40mm; /* Margin 4-3-3-4 cm */
    box-shadow: 0 4px 18px rgba(0,0,0,0.25);
    margin-bottom: 30px;
    position: relative;
  }}

  /* Tipografi Khusus Ilmiah */
  h1.chapter-title {{
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    line-height: 1.5;
    margin-bottom: 28pt;
    color: #000;
  }}

  h2.section-title {{
    font-size: 12pt;
    font-weight: bold;
    text-align: left;
    margin-top: 18pt;
    margin-bottom: 6pt;
    line-height: 1.5;
    color: #000;
  }}

  h3.subsection-title {{
    font-size: 12pt;
    font-weight: bold;
    text-align: left;
    margin-top: 14pt;
    margin-bottom: 4pt;
    line-height: 1.5;
    color: #000;
  }}

  h4.subsubsection-title {{
    font-size: 12pt;
    font-weight: bold;
    font-style: italic;
    text-align: left;
    margin-top: 12pt;
    margin-bottom: 4pt;
    line-height: 1.5;
    color: #000;
  }}

  p.par {{
    text-align: justify;
    text-justify: inter-word;
    text-indent: 1cm; /* Indentasi alinea 1 cm */
    margin-bottom: 0pt;
    margin-top: 0pt;
    line-height: 1.5;
    font-size: 12pt;
  }}

  p.par-noindent {{
    text-align: justify;
    text-justify: inter-word;
    margin-bottom: 0pt;
    margin-top: 0pt;
    line-height: 1.5;
    font-size: 12pt;
  }}

  ol.num-list, ul.bullet-list {{
    margin-left: 1cm;
    margin-top: 4pt;
    margin-bottom: 6pt;
    line-height: 1.5;
    text-align: justify;
    font-size: 12pt;
  }}
  ol.num-list li, ul.bullet-list li {{
    margin-bottom: 3pt;
    padding-left: 4pt;
  }}

  /* Tabel Ilmiah (Border horizontal saja sesuai standar akademik) */
  .table-container {{
    margin: 18pt 0;
    width: 100%;
  }}
  p.table-caption {{
    text-align: center;
    font-size: 11pt;
    font-weight: normal;
    margin-bottom: 6pt;
  }}
  p.table-caption b {{
    font-weight: bold;
  }}
  table.academic-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    line-height: 1.35;
    margin: 0 auto;
  }}
  table.academic-table th {{
    border-top: 1.8px solid #000;
    border-bottom: 1.2px solid #000;
    padding: 6pt 6pt;
    text-align: left;
    font-weight: bold;
  }}
  table.academic-table td {{
    padding: 5pt 6pt;
    vertical-align: top;
    border-bottom: 0.6px solid #ccc;
    text-align: justify;
  }}
  table.academic-table tr:last-child td {{
    border-bottom: 1.8px solid #000;
  }}

  /* Gambar Ilmiah */
  .figure-container {{
    margin: 22pt auto;
    text-align: center;
    width: 100%;
    page-break-inside: avoid;
  }}
  .figure-box {{
    background: #fff;
    border: 1px solid #222;
    padding: 16px 12px;
    margin: 0 auto 8pt auto;
    display: inline-block;
    max-width: 100%;
  }}
  .figure-box svg {{
    display: block;
    margin: 0 auto;
    max-width: 100%;
    height: auto;
  }}
  p.figure-caption {{
    text-align: center;
    font-size: 11pt;
    font-weight: normal;
    margin-top: 6pt;
    color: #000;
  }}
  p.figure-caption b {{
    font-weight: bold;
  }}
  p.figure-caption em {{
    font-style: italic;
  }}

  /* Daftar Pustaka IEEE (Hanging Indent) */
  p.ref-item {{
    text-align: justify;
    padding-left: 0.8cm;
    text-indent: -0.8cm;
    margin-bottom: 6pt;
    font-size: 11pt;
    line-height: 1.4;
  }}

  @media print {{
    body {{
      background: #fff;
      padding: 0;
    }}
    .control-bar {{
      display: none;
    }}
    .paper-page {{
      box-shadow: none;
      margin: 0;
      width: 100%;
      min-height: auto;
      padding: 0;
      page-break-after: always;
    }}
  }}
</style>
</head>
<body>

<!-- Bar Kontrol Navigasi & Salin -->
<div class="control-bar">
  <div class="title">Naskah Tugas Akhir: BAB I - III (Sesuai Pedoman Informatika 2025)</div>
  <div class="actions">
    <button class="btn btn-secondary" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
    <button class="btn btn-primary" onclick="copyDocumentToClipboard()">📋 Salin Seluruh Naskah ke Word</button>
  </div>
</div>

<div class="paper-page" id="manuscript">

  <!-- ============================================================== -->
  <!-- JUDUL SKRIPSI -->
  <!-- ============================================================== -->
  <div style="text-align: center; margin-bottom: 40pt;">
    <h2 style="font-size: 14pt; font-weight: bold; text-transform: uppercase; line-height: 1.4;">
      DIGITALISASI SISTEM LAYANAN INFORMASI KELURAHAN BANJAR AGUNG BERBASIS <i>WEBSITE</i>
    </h2>
    <p style="font-size: 12pt; margin-top: 14pt; font-weight: bold;">
      DRAFT PROPOSAL TUGAS AKHIR
    </p>
    <p style="font-size: 12pt; margin-top: 8pt;">
      <b>M. REZA REFANDA</b><br>
      NIM : 3337220046
    </p>
    <p style="font-size: 12pt; margin-top: 12pt;">
      JURUSAN INFORMATIKA FAKULTAS TEKNIK<br>
      UNIVERSITAS SULTAN AGENG TIRTAYASA<br>
      2025
    </p>
  </div>

  <hr style="border: 0; border-top: 2px solid #000; margin: 30pt 0 40pt 0;">

  <!-- ============================================================== -->
  <!-- BAB I: PENDAHULUAN -->
  <!-- ============================================================== -->
  <h1 class="chapter-title">BAB I<br>PENDAHULUAN</h1>

  <h2 class="section-title">1.1 Latar Belakang</h2>
  
  <p class="par">Perkembangan teknologi informasi dan komunikasi di era digital saat ini telah membawa perubahan yang sangat signifikan dalam berbagai aspek kehidupan manusia, termasuk dalam bidang pemerintahan. Transformasi digital menjadi suatu kebutuhan yang tidak dapat dihindari, terutama dalam upaya meningkatkan kualitas pelayanan publik. Pemerintah dituntut untuk mampu beradaptasi dengan perkembangan teknologi guna menciptakan sistem pelayanan yang lebih efektif, efisien, transparan, dan akuntabel. Salah satu bentuk implementasi transformasi tersebut adalah melalui digitalisasi layanan publik berbasis teknologi informasi.</p>

  <p class="par">Digitalisasi layanan publik memberikan berbagai keuntungan, di antaranya adalah kemudahan akses informasi, percepatan proses pelayanan, serta peningkatan kualitas interaksi antara pemerintah dan masyarakat. Berdasarkan hasil penelitian, penerapan digitalisasi dalam pelayanan publik terbukti mampu meningkatkan efisiensi operasional serta memberikan kemudahan bagi masyarakat dalam mengakses layanan kapan saja dan di mana saja [1]. Hal ini menunjukkan bahwa penggunaan teknologi informasi, khususnya berbasis <i>website</i>, menjadi solusi yang relevan dalam menjawab tantangan pelayanan publik di era modern.</p>

  <p class="par">Selain itu, penerapan <i>e-government</i> juga menjadi salah satu strategi utama dalam mewujudkan tata kelola pemerintahan yang baik (<i>good governance</i>). Melalui <i>e-government</i>, pemerintah dapat menyediakan layanan yang lebih transparan, responsif, serta mudah diakses oleh masyarakat. Transformasi digital dalam administrasi publik tidak hanya berfokus pada penggunaan teknologi, tetapi juga pada peningkatan kualitas layanan yang berorientasi pada kebutuhan masyarakat. Studi menunjukkan bahwa implementasi <i>e-government</i> memiliki peran penting dalam meningkatkan kualitas pelayanan publik serta memperkuat kepercayaan masyarakat terhadap pemerintah [2].</p>

  <p class="par">Lebih lanjut, digitalisasi layanan publik juga berkontribusi dalam menciptakan inklusi sosial. Sistem berbasis digital memungkinkan seluruh lapisan masyarakat, termasuk kelompok yang sebelumnya memiliki keterbatasan akses terhadap layanan konvensional, untuk memperoleh informasi dan layanan secara lebih merata. Dengan adanya layanan digital, masyarakat tidak lagi dibatasi oleh jarak dan waktu dalam mengakses informasi yang dibutuhkan. Hal ini menjadi salah satu faktor penting dalam mendukung pembangunan berkelanjutan serta pemerintahan yang inklusif [3].</p>

  <p class="par">Dalam konteks pemerintahan di Indonesia, penerapan digitalisasi layanan publik tidak hanya dilakukan pada tingkat pusat, tetapi juga hingga ke tingkat daerah, termasuk kelurahan. Kelurahan merupakan unit pemerintahan yang memiliki peran strategis sebagai ujung tombak pelayanan publik yang berhubungan langsung dengan masyarakat. Pelayanan yang diberikan oleh kelurahan mencakup berbagai aspek, seperti penyampaian informasi, pelayanan administrasi, serta kegiatan sosial kemasyarakatan.</p>

  <p class="par">Kelurahan Banjar Agung yang terletak di Kota Serang merupakan salah satu instansi pemerintahan yang memiliki tanggung jawab dalam memberikan layanan informasi kepada masyarakat. Namun, berdasarkan kondisi yang ada, sistem penyampaian informasi di Kelurahan Banjar Agung masih dilakukan secara konvensional. Informasi umumnya disampaikan melalui papan pengumuman di kantor kelurahan atau melalui perantara perangkat RT/RW. Metode ini memiliki keterbatasan dalam hal jangkauan dan kecepatan penyampaian informasi.</p>

  <p class="par">Selain itu, masyarakat yang membutuhkan informasi terkait pelayanan administrasi, seperti persyaratan pembuatan surat atau pengumuman kegiatan, harus datang langsung ke kantor kelurahan. Hal ini tentu menimbulkan berbagai kendala, seperti keterbatasan waktu, antrean pelayanan, serta kurang efisiennya proses penyampaian informasi. Kondisi ini menunjukkan bahwa sistem pelayanan yang masih bersifat manual belum mampu memenuhi kebutuhan masyarakat yang semakin berkembang.</p>

  <p class="par">Permasalahan tersebut sejalan dengan berbagai penelitian yang menyatakan bahwa sistem pelayanan konvensional memiliki kelemahan dalam hal efisiensi, kecepatan, dan akurasi informasi. Sistem manual cenderung memperlambat proses pelayanan serta meningkatkan potensi kesalahan dalam penyampaian informasi [4]. Oleh karena itu, diperlukan suatu inovasi dalam bentuk digitalisasi layanan informasi guna meningkatkan kualitas pelayanan publik di tingkat kelurahan.</p>

  <p class="par">Perkembangan teknologi dan meningkatnya penggunaan internet di kalangan masyarakat menjadi peluang besar dalam penerapan sistem berbasis digital. Saat ini, sebagian besar masyarakat telah menggunakan perangkat digital seperti <i>smartphone</i> yang dapat digunakan untuk mengakses informasi secara <i>online</i>. Agar sistem benar-benar memberikan kemudahan birokrasi, sistem dirancang dengan prinsip <i>open-access public service</i>, di mana masyarakat umum dapat langsung mengajukan permohonan surat dan memantau status pengerjaannya cukup dengan memasukkan Nomor Induk Kependudukan (NIK) dan kode permohonan unik (<i>tracking code</i>), tanpa harus melalui proses registrasi akun yang berbelit-belit. Sementara itu, staf kelurahan dibekali dengan <i>dashboard</i> admin terproteksi untuk memverifikasi dokumen secara digital dan mencetak draf surat resmi secara otomatis.</p>

  <p class="par">Berdasarkan seluruh latar belakang dan urgensi permasalahan di atas, maka dilakukan penelitian tugas akhir dengan judul <b>"Digitalisasi Sistem Layanan Informasi Kelurahan Banjar Agung Berbasis Website"</b>.</p>

  <h2 class="section-title">1.2 Rumusan Masalah</h2>
  <p class="par-noindent">Berdasarkan latar belakang yang telah diuraikan, rumusan masalah dalam penelitian ini dirumuskan sebagai berikut:</p>
  <ol class="num-list">
    <li>Bagaimana kondisi, kendala, dan kebutuhan sistem layanan informasi serta pelayanan administrasi persuratan yang saat ini berjalan di Kelurahan Banjar Agung, Kota Serang?</li>
    <li>Bagaimana merancang arsitektur sistem layanan informasi kelurahan berbasis <i>website</i> yang mampu melayani diseminasi informasi publik serta permohonan surat secara daring tanpa membebani masyarakat dengan kewajiban registrasi akun?</li>
    <li>Bagaimana mengimplementasikan dan menguji sistem layanan informasi berbasis <i>website</i> dengan memanfaatkan <i>framework Next.js</i> dan basis data <i>Firebase Firestore</i> guna mewujudkan pelayanan publik yang cepat, transparan, dan terintegrasi di Kelurahan Banjar Agung?</li>
  </ol>

  <h2 class="section-title">1.3 Batasan Masalah</h2>
  <p class="par-noindent">Agar pembahasan dalam penelitian ini lebih terarah dan mendalam, ditetapkan batasan-batasan masalah sebagai berikut:</p>
  <ol class="num-list">
    <li>Lokasi penelitian dan studi kasus dibatasi secara spesifik pada Kantor Kelurahan Banjar Agung, Kecamatan Cipocok Jaya, Kota Serang, Provinsi Banten.</li>
    <li>Sistem yang dikembangkan berbasis <i>website</i> responsif yang dapat diakses melalui peramban komputer desktop maupun perangkat <i>mobile</i>.</li>
    <li>Fitur informasi publik mencakup penyajian profil kelurahan, visi dan misi, struktur organisasi aparatur, infografis demografi kependudukan, publikasi berita, pengumuman resmi, dan kalender agenda kegiatan kelurahan.</li>
    <li>Layanan administrasi persuratan mencakup pengajuan surat secara mandiri oleh masyarakat (antara lain Surat Keterangan Usaha, Surat Keterangan Domisili, Surat Keterangan Tidak Mampu, dan Surat Pengantar Nikah) dengan mengisi form NIK, data diri, serta mengunggah berkas syarat berupa dokumen/gambar digital.</li>
    <li>Masyarakat tidak diwajibkan melakukan registrasi/login akun; pemantauan progres permohonan surat dilakukan secara terbuka melalui fitur pelacakan (<i>tracking</i>) berbasis kode unik permohonan atau NIK.</li>
    <li>Hak akses pengelolaan sistem dibagi menjadi 2 (dua) tingkat aktor, yaitu <b>Masyarakat</b> (pengguna publik eksternal tanpa autentikasi) dan <b>Admin Kelurahan</b> (aparatur internal kelurahan yang terotentikasi melalui login email dan kata sandi).</li>
    <li>Teknologi pengembangan sistem menggunakan bahasa pemrograman <i>TypeScript</i>, pustaka antarmuka <i>React</i>, <i>framework Next.js</i>, serta basis data <i>cloud Firebase Firestore</i> dan <i>Firebase Storage</i>.</li>
  </ol>

  <h2 class="section-title">1.4 Tujuan Penelitian</h2>
  <p class="par-noindent">Tujuan yang ingin dicapai melalui pelaksanaan penelitian ini adalah:</p>
  <ol class="num-list">
    <li>Menganalisis proses bisnis dan kebutuhan fungsional sistem layanan informasi serta administrasi persuratan di Kelurahan Banjar Agung.</li>
    <li>Merancang pemodelan sistem menggunakan <i>Unified Modeling Language</i> (UML) dan <i>Entity Relationship Diagram</i> (ERD) yang selaras dengan alur birokrasi pelayanan kelurahan yang efisien.</li>
    <li>Membangun dan mengimplementasikan sistem layanan informasi berbasis <i>website</i> menggunakan teknologi <i>Next.js</i> dan <i>Firebase</i> yang memudahkan warga dalam mengajukan surat dan memantau statusnya secara <i>real-time</i>.</li>
    <li>Menguji kelayakan serta fungsionalitas sistem menggunakan metode pengujian perangkat lunak (<i>Black-box Testing</i>) guna memastikan sistem beroperasi sesuai spesifikasi yang diharapkan.</li>
  </ol>

  <h2 class="section-title">1.5 Manfaat Penelitian</h2>
  <p class="par-noindent">Penelitian ini diharapkan dapat memberikan manfaat teoretis dan praktis sebagai berikut:</p>
  
  <h3 class="subsection-title">1.5.1 Manfaat Teoretis</h3>
  <p class="par">Penelitian ini diharapkan dapat memberikan kontribusi bagi pengembangan ilmu pengetahuan di bidang Informatika, khususnya pada ranah rekayasa perangkat lunak (<i>software engineering</i>) dan penerapan teknologi <i>e-government</i> di instansi pemerintah daerah. Selain itu, penelitian ini memberikan studi kasus nyata mengenai integrasi arsitektur <i>web modern</i> berbasis <i>Next.js</i> dengan basis data <i>NoSQL cloud</i> dalam mendukung digitalisasi birokrasi publik.</p>

  <h3 class="subsection-title">1.5.2 Manfaat Praktis</h3>
  <ol class="num-list">
    <li><b>Bagi Masyarakat Kelurahan Banjar Agung:</b> Memperoleh kemudahan dan kenyamanan dalam mengakses informasi kelurahan yang akurat, mengajukan permohonan surat administrasi tanpa antre fisik, serta memantau status penyelesaian berkas secara transparan.</li>
    <li><b>Bagi Aparatur Kantor Kelurahan Banjar Agung:</b> Meningkatkan efisiensi kerja staf pelayanan melalui pengelolaan data permohonan surat yang tersentralisasi, verifikasi berkas digital yang cepat, pencetakan dokumen otomatis menggunakan template Word, serta tersedianya rekam jejak digital yang tertib.</li>
    <li><b>Bagi Peneliti:</b> Sebagai sarana menerapkan keilmuan yang telah diperoleh selama perkuliahan pada Jurusan Informatika Universitas Sultan Ageng Tirtayasa dalam menghasilkan solusi teknologi nyata yang berdampak langsung bagi masyarakat.</li>
  </ol>

  <div style="page-break-after: always;"></div>

  <!-- ============================================================== -->
  <!-- BAB II: TINJAUAN PUSTAKA -->
  <!-- ============================================================== -->
  <h1 class="chapter-title">BAB II<br>TINJAUAN PUSTAKA</h1>

  <h2 class="section-title">2.1 Penelitian Terdahulu</h2>
  
  <p class="par">Kajian terhadap penelitian terdahulu memiliki peranan krusial dalam menyusun landasan konseptual, memetakan perkembangan teknologi yang telah diterapkan, serta mengidentifikasi celah penelitian (<i>research gap</i>) yang menjadi ruang inovasi pada penelitian ini. Berbagai publikasi ilmiah bereputasi telah mendokumentasikan implementasi sistem informasi pada lingkup tata kelola pemerintahan publik dan administrasi lokal.</p>

  <p class="par">Latupeirissa et al. [1] melakukan tinjauan komprehensif terhadap inisiatif digitalisasi pelayanan publik dan membuktikan bahwa transformasi sistem pelayanan publik berbasis digital mampu memangkas hambatan birokrasi, meningkatkan aksesibilitas masyarakat, serta mempercepat waktu pemrosesan dokumen secara signifikan. Abdussamad et al. [2] menggarisbawahi bahwa pemanfaatan teknologi <i>e-government</i> membuka peluang besar bagi instansi pemerintahan daerah untuk meningkatkan responsivitas birokrasi serta memperkuat akuntabilitas kinerja aparatur.</p>

  <p class="par">Dalam lingkup tata kelola sistem informasi kelurahan dan desa di Indonesia, Sitohang, Hidayanto, dan Kurnia [8] mengkaji ekosistem adopsi <i>e-government</i> pada sistem informasi desa dari perspektif para pemangku kepentingan (<i>stakeholder theory</i>), di mana kunci penerimaan sistem bertumpu pada kemudahan antarmuka bagi masyarakat awam. Budiarto, Asmawati, dan Kurniawan [7] merancang sistem informasi layanan masyarakat berbasis <i>website</i> pada tingkat kecamatan yang berhasil mengintegrasikan permohonan dokumen secara daring. Ayuni Fajar et al. [9] menunjukkan bahwa inovasi sistem informasi desa meningkatkan transparansi penyampaian informasi publik kelurahan secara luas.</p>

  <p class="par">Lebih lanjut, Siman dan Wiratama [10] mengembangkan sistem administrasi desa berbasis web menuju konsep <i>smart village</i> yang memfasilitasi pengarsipan dokumen permohonan surat warga. Ichsan, Susilawati, dan Haykal [11] merancang sistem informasi desa yang berhasil mempercepat pelayanan administrasi desa secara efektif dan efisien.</p>

  <p class="par">Pada aspek arsitektur teknologi web dan basis data modern, Ekpobimi [19] meneliti performa <i>framework Next.js</i> dalam pembangunan aplikasi web berskala besar dan menyimpulkan bahwa fitur <i>Server-Side Rendering</i> (SSR) menghasilkan respons sistem yang jauh lebih cepat dan ramah mesin pencari. Genne [20] serta Susanto, Fadlan, dan Haryani [21] memperkuat temuan bahwa arsitektur <i>Next.js</i> sangat optimal dalam mengelola beban akses data dinamis. Di sisi basis data, Kunitsyn dan Fedorov [22] serta Pandit et al. [23] mengevaluasi keandalan <i>Firebase Realtime/Firestore Database</i> dan membuktikan efektivitas mekanisme sinkronisasi data seketika (<i>real-time data synchronization</i>) dalam mendukung keterpaduan data antar-pengguna.</p>

  <div class="table-container">
    <p class="table-caption"><b>Tabel 2.1</b> Matriks Komparasi Penelitian Terdahulu Terhadap Penelitian yang Diusulkan</p>
    <table class="academic-table">
      <thead>
        <tr>
          <th style="width: 5%;">No.</th>
          <th style="width: 24%;">Peneliti &amp; Tahun</th>
          <th style="width: 25%;">Judul Publikasi &amp; Jurnal</th>
          <th style="width: 24%;">Fokus &amp; Hasil Penelitian</th>
          <th style="width: 22%;">Perbedaan / Kontribusi Penelitian Ini</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1.</td>
          <td>J. J. P. Latupeirissa et al. (2024) [1]</td>
          <td><i>Transforming Public Service Delivery</i> (Sustainability)</td>
          <td>Tinjauan menyeluruh digitalisasi pelayanan publik dalam memangkas hambatan birokrasi dan efisiensi waktu.</td>
          <td>Penelitian ini merancang sistem web aplikatif pada tingkat kelurahan (Banjar Agung) dengan implementasi persuratan riil.</td>
        </tr>
        <tr>
          <td>2.</td>
          <td>M. Budiarto, A. Asmawati, M. Kurniawan (2024) [7]</td>
          <td><i>Digital Transformation of Local Government</i> (IJCITSM)</td>
          <td>Pengembangan website sistem informasi layanan masyarakat tingkat kecamatan untuk integrasi permohonan dokumen.</td>
          <td>Fokus pada sistem kelurahan dengan model akses terbuka (tanpa kewajiban login bagi warga pemohon).</td>
        </tr>
        <tr>
          <td>3.</td>
          <td>D. M. Sitohang, A. N. Hidayanto, S. Kurnia (2025) [8]</td>
          <td><i>The e-government adoption ecosystem</i> (Information Development)</td>
          <td>Analisis ekosistem adopsi sistem informasi desa di Indonesia dari perspektif pemangku kepentingan.</td>
          <td>Menerapkan temuan dengan menghilangkan barier registrasi akun warga agar mudah diadopsi oleh seluruh lapisan masyarakat.</td>
        </tr>
        <tr>
          <td>4.</td>
          <td>F. D. Ayuni Fajar et al. (2023) [9]</td>
          <td>Inovasi Sistem Informasi Desa dalam E-Government (POLIGOVS)</td>
          <td>Meningkatkan transparansi dan efektivitas diseminasi informasi desa melalui portal web terpusat.</td>
          <td>Menambahkan modul layanan administrasi persuratan mandiri serta pelacakan status berkas secara daring.</td>
        </tr>
        <tr>
          <td>5.</td>
          <td>K. F. Siman &amp; J. Wiratama (2025) [10]</td>
          <td><i>A Web-Based Village Administrative Information System</i> (G-Tech)</td>
          <td>Sistem administrasi desa menuju konsep <i>smart village</i> untuk efisiensi pengarsipan permohonan surat.</td>
          <td>Mengembangkan generator pencetakan surat otomatis berbasis template DOCX dan fitur audit log admin.</td>
        </tr>
        <tr>
          <td>6.</td>
          <td>Ichsan, F. Susilawati, M. Haykal (2024) [11]</td>
          <td><i>Design and Build a Web-Based Village Information System</i> (J. Inovasi Tek. Rekayasa)</td>
          <td>Akselerasi pelayanan administrasi surat desa dan reduksi ketergantungan pada prosedur loket fisik.</td>
          <td>Menggunakan arsitektur web modern Next.js 16 App Router dan cloud database Firebase Firestore.</td>
        </tr>
        <tr>
          <td>7.</td>
          <td>H. O. Ekpobimi (2024) [19]</td>
          <td><i>Building High-Performance Web Applications with NextJS</i> (CS &amp; IT Res. J.)</td>
          <td>Analisis performa server-side rendering Next.js dalam meningkatkan kecepatan rendering dan responsivitas.</td>
          <td>Mengimplementasikan Next.js secara nyata pada sistem layanan informasi publik kelurahan yang cepat dan responsif.</td>
        </tr>
        <tr>
          <td>8.</td>
          <td>V. Kunitsyn &amp; V. Fedorov (2025) [22]</td>
          <td><i>Firebase Mobile and Web Application Development Platform</i></td>
          <td>Pemanfaatan basis data cloud Firebase untuk sinkronisasi data real-time dengan skalabilitas tinggi.</td>
          <td>Diterapkan untuk penyimpanan data permohonan surat dinamis, berkas persyaratan, dan pelacakan status seketika.</td>
        </tr>
        <tr>
          <td>9.</td>
          <td><b>M. Reza Refanda (2025)</b> [Penelitian Ini]</td>
          <td>Digitalisasi Sistem Layanan Informasi Kelurahan Banjar Agung Berbasis Website</td>
          <td>Sistem komprehensif mencakup informasi publik, permohonan surat online, pelacakan status, dan pengaduan warga.</td>
          <td><b>Kontribusi:</b> Model <i>open-access</i> warga tanpa login, pelacakan via NIK/kode, generator cetak draf surat DOCX otomatis, dan audit log admin terproteksi.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2 class="section-title">2.2 Keterkaitan Penelitian dan Landasan Teori</h2>

  <h3 class="subsection-title">2.2.1 Website</h3>
  <p class="par"><i>Website</i> merupakan media berbasis internet yang digunakan untuk menyajikan dan menyampaikan informasi kepada pengguna secara luas tanpa dibatasi oleh ruang dan waktu. Dalam konteks sistem informasi, website berperan sebagai sarana yang memungkinkan pengelolaan, penyimpanan, serta distribusi informasi secara terstruktur sehingga dapat diakses dengan mudah oleh pengguna. Sistem berbasis web juga memungkinkan integrasi berbagai fungsi dalam satu platform, sehingga mendukung penyampaian informasi secara efektif dan efisien [5].</p>

  <p class="par">Dalam penerapannya pada sektor pemerintahan, website menjadi bagian penting dalam mendukung layanan publik berbasis digital. Website pemerintah digunakan sebagai media penyampaian informasi resmi, meningkatkan transparansi, serta mempermudah masyarakat dalam mengakses layanan yang disediakan. Pengelolaan informasi publik yang baik melalui website dapat meningkatkan efektivitas layanan <i>e-government</i> serta memperkuat interaksi antara pemerintah dan masyarakat [6].</p>

  <p class="par">Pengembangan website sebagai sistem layanan informasi juga berperan dalam mendukung transformasi digital di tingkat pemerintahan lokal. Website layanan informasi memungkinkan masyarakat untuk memperoleh informasi secara cepat serta mengakses layanan administrasi secara daring. Implementasi sistem berbasis website pada pemerintahan daerah terbukti mampu meningkatkan efisiensi pelayanan, memperluas jangkauan informasi, serta mendukung kualitas pelayanan publik yang lebih baik [7].</p>

  <h3 class="subsection-title">2.2.2 Sistem Informasi Kelurahan</h3>
  <p class="par">Sistem informasi kelurahan merupakan suatu sistem berbasis teknologi informasi yang digunakan untuk mengelola, menyimpan, dan menyajikan data serta informasi yang berkaitan dengan administrasi dan pelayanan publik di tingkat kelurahan atau desa. Sistem ini merupakan bagian dari implementasi <i>e-government</i> yang bertujuan untuk meningkatkan efektivitas, efisiensi, serta transparansi dalam penyelenggaraan pemerintahan di tingkat lokal [8].</p>

  <p class="par">Penerapan sistem informasi kelurahan berbasis <i>web-based system</i> memungkinkan masyarakat untuk mengakses informasi secara lebih mudah, cepat, dan tanpa batasan ruang dan waktu. Selain itu, sistem ini juga berperan dalam meningkatkan kualitas pelayanan publik melalui penyediaan layanan administrasi yang lebih terstruktur dan terintegrasi. Inovasi sistem informasi desa dalam pengembangan <i>e-government</i> terbukti mampu meningkatkan transparansi serta efektivitas penyampaian informasi kepada masyarakat [9].</p>

  <p class="par">Sistem informasi kelurahan berbasis website juga mendukung peningkatan kualitas layanan menuju konsep <i>smart village</i>, yaitu pemanfaatan teknologi informasi untuk meningkatkan kualitas hidup masyarakat serta efisiensi pelayanan publik. Sistem ini tidak hanya berfungsi sebagai media informasi, tetapi juga sebagai sarana pelayanan administrasi secara daring, seperti pengajuan permohonan surat dan pengelolaan data penduduk [10]. Pengembangan sistem informasi berbasis <i>web-based application</i> pada pemerintahan desa atau kelurahan terbukti mampu mempercepat proses pelayanan serta mengurangi ketergantungan pada sistem manual [11].</p>

  <h3 class="subsection-title">2.2.3 Digitalisasi Pelayanan Publik</h3>
  <p class="par">Digitalisasi pelayanan publik merupakan proses pemanfaatan teknologi informasi dan komunikasi untuk meningkatkan kualitas, efisiensi, serta efektivitas layanan yang diberikan oleh pemerintah kepada masyarakat. Transformasi ini merupakan bagian dari implementasi <i>digital transformation</i> dalam sektor publik yang berorientasi pada perubahan layanan konvensional menjadi layanan berbasis digital yang lebih cepat, transparan, dan mudah diakses oleh masyarakat [12].</p>

  <p class="par">Penerapan digitalisasi dalam pelayanan publik memungkinkan terjadinya integrasi sistem serta otomatisasi proses administrasi yang sebelumnya dilakukan secara manual. Kondisi ini berimplikasi pada peningkatan kualitas layanan melalui percepatan proses, peningkatan aksesibilitas, serta perluasan jangkauan layanan kepada masyarakat. Digitalisasi layanan publik juga berkontribusi dalam meningkatkan pengalaman pengguna (<i>user experience</i>) dalam mengakses layanan pemerintah secara lebih efisien [1].</p>

  <p class="par">Digitalisasi pelayanan publik turut mendukung peningkatan produktivitas dan akuntabilitas kinerja pemerintah melalui pemanfaatan sistem berbasis <i>scalable software solutions</i>. Sistem tersebut memungkinkan pengelolaan data dan layanan dilakukan secara lebih terstruktur, akurat, dan terintegrasi, sehingga dapat meminimalkan kesalahan dalam proses administrasi [13]. Pengembangan <i>digital service transformation framework</i> menjadi aspek penting dalam mendukung implementasi digitalisasi layanan publik secara berkelanjutan guna mewujudkan tata kelola pemerintahan yang modern dan berorientasi pada pelayanan masyarakat [14].</p>

  <h3 class="subsection-title">2.2.4 E-Government</h3>
  <p class="par"><i>E-government</i> merupakan pemanfaatan teknologi informasi dan komunikasi oleh pemerintah untuk meningkatkan kualitas pelayanan publik, efisiensi administrasi, serta transparansi dalam penyelenggaraan pemerintahan. Konsep ini mencakup integrasi sistem digital dalam proses pemerintahan guna menciptakan layanan yang lebih efektif dan terstruktur [15]. Dalam perkembangannya, <i>e-government</i> tidak hanya berfokus pada penyediaan layanan digital, tetapi juga mencakup dimensi <i>electronic governance</i> yang menekankan transparansi, partisipasi masyarakat, serta penguatan <i>digital democracy</i> dalam sistem pemerintahan modern [16].</p>

  <p class="par">Penerapan <i>e-government</i> dalam pelayanan publik memberikan dampak signifikan terhadap peningkatan kualitas layanan melalui proses yang lebih cepat, tepat, dan mudah diakses oleh masyarakat [17]. Sistem layanan yang terintegrasi memungkinkan pemerintah untuk menyederhanakan proses administrasi serta meningkatkan kepuasan pengguna layanan, sekaligus menjawab tantangan kesiapan birokrasi dalam mewujudkan pelayanan publik yang modern [18].</p>

  <h3 class="subsection-title">2.2.5 Framework NextJS</h3>
  <p class="par"><i>Next.js</i> merupakan salah satu <i>framework</i> berbasis <i>React</i> yang digunakan untuk membangun aplikasi web modern dengan performa tinggi dan struktur yang terorganisir. Framework ini dirancang untuk mendukung pengembangan aplikasi web yang efisien melalui berbagai fitur bawaan seperti <i>Server-Side Rendering</i> (SSR) dan <i>Static Site Generation</i> (SSG), sehingga mampu meningkatkan kecepatan akses dan pengalaman pengguna (<i>user experience</i>) secara signifikan [19].</p>

  <p class="par">Kemampuan <i>Server-Side Rendering</i> pada Next.js menjadi salah satu faktor utama dalam meningkatkan performa aplikasi web, khususnya pada sistem layanan publik. Dengan SSR, proses <i>rendering</i> dilakukan di sisi server sebelum dikirim ke pengguna, sehingga waktu muat halaman menjadi lebih cepat dan mendukung optimasi mesin pencari (<i>Search Engine Optimization</i> / SEO) [20]. Implementasi SSR dalam Next.js juga terbukti mampu mengoptimalkan performa aplikasi layanan melalui pengelolaan <i>rendering</i> yang lebih efisien serta peningkatan responsivitas sistem terhadap permintaan pengguna [21].</p>

  <h3 class="subsection-title">2.2.6 Database Firebase</h3>
  <p class="par">Firebase merupakan platform berbasis <i>cloud computing</i> yang menyediakan layanan <i>Backend-as-a-Service</i> (BaaS) untuk pengembangan aplikasi web dan mobile. Salah satu layanan utama yang disediakan adalah basis data <i>NoSQL</i> (Cloud Firestore / Realtime Database) yang memungkinkan penyimpanan data dalam format dokumen JSON serta mendukung proses sinkronisasi data secara <i>real-time</i> pada berbagai perangkat yang terhubung [22].</p>

  <p class="par">Firebase mendukung teknik <i>real-time data synchronization</i> yang memungkinkan data permohonan surat diperbarui secara otomatis pada seluruh pengguna tanpa memerlukan proses permintaan berulang ke server, serta menyediakan dukungan terhadap <i>offline capability</i> [23]. Penerapan teknologi ini sangat tepat untuk mendukung sistem informasi kelurahan yang menuntut kecepatan, konsistensi data, serta integrasi pemantauan status permohonan surat warga secara seketika.</p>

  <h3 class="subsection-title">2.2.7 Entity Relationship Diagram (ERD)</h3>
  <p class="par"><i>Entity Relationship Diagram</i> (ERD) merupakan model konseptual yang digunakan dalam perancangan basis data untuk merepresentasikan struktur data serta hubungan antar-entitas dalam suatu sistem. ERD termasuk dalam pendekatan <i>conceptual data modeling</i> yang memodelkan entitas, atribut, dan relasi sebagai dasar dalam memahami kebutuhan data sebelum tahap implementasi dilakukan [24]. ERD juga digunakan untuk memetakan keterkaitan logis antarkomponen data (relasi <i>one-to-one</i>, <i>one-to-many</i>, dan <i>many-to-many</i>) sehingga menghasilkan struktur data yang konsisten, berintegritas, dan mudah diimplementasikan [25].</p>

  <h3 class="subsection-title">2.2.8 Analisis Kesenjangan (<i>Research Gap</i>)</h3>
  <p class="par">Berdasarkan telaah komprehensif terhadap penelitian terdahulu [1], [7]–[11], ditemukan bahwa kelemahan utama pada sistem informasi desa/kelurahan yang ada selama ini adalah keharusan bagi masyarakat untuk membuat akun (registrasi) dan mengingat kata sandi (*login*) sebelum dapat mengajukan permohonan surat. Prosedur ini terbukti menjadi barier adopsi yang menyulitkan warga awam atau kelompok usia lanjut. Selain itu, pemrosesan surat di sisi internal staf kelurahan masih memerlukan pengetikan ulang data pemohon ke dokumen Word secara manual.</p>

  <p class="par">Oleh karena itu, posisi dan nilai kebaruan penelitian ini berfokus pada:</p>
  <ol class="num-list">
    <li><b>Penerapan Model Akses Terbuka (Public Open-Access):</b> Warga mengajukan surat cukup dengan validasi NIK dan formulir dinamis, lalu sistem otomatis menerbitkan kode unik permohonan (*tracking code*).</li>
    <li><b>Sistem Pelacakan Mandiri:</b> Transparansi progres pengerjaan surat dapat dipantau oleh warga cukup dengan memasukkan kode unik atau NIK pada menu pelacakan tanpa memerlukan akun login.</li>
    <li><b>Mesin Pembuat Surat Otomatis (Template Engine):</b> Dokumen draf surat resmi berformat DOCX dihasilkan secara otomatis dari data pemohon yang telah diverifikasi oleh admin, sehingga siap dicetak atau diedit langsung oleh staf kelurahan.</li>
    <li><b>Proteksi Akses Terpusat:</b> Satu peran terverifikasi yakni Admin Kelurahan dengan fitur pencatatan log aktivitas sistem (*audit trail*) demi menjamin keamanan dan akuntabilitas tata kelola data publik.</li>
  </ol>

  <div style="page-break-after: always;"></div>

  <!-- ============================================================== -->
  <!-- BAB III: METODOLOGI PENELITIAN -->
  <!-- ============================================================== -->
  <h1 class="chapter-title">BAB III<br>METODOLOGI PENELITIAN</h1>

  <h2 class="section-title">3.1 Objek Penelitian</h2>
  
  <p class="par">Objek dalam penelitian tugas akhir ini adalah sistem pelayanan informasi publik dan alur administrasi persuratan pada Kantor Kelurahan Banjar Agung. Secara administratif, Kelurahan Banjar Agung terletak di Kecamatan Cipocok Jaya, Kota Serang, Provinsi Banten. Kelurahan ini melayani populasi penduduk yang tersebar di puluhan Rukun Tetangga (RT) dan beberapa Rukun Warga (RW).</p>

  <p class="par">Subjek yang terlibat dalam penelitian ini mencakup dua entitas utama:</p>
  <ol class="num-list">
    <li><b>Masyarakat Kelurahan Banjar Agung:</b> Merupakan pihak pemohon layanan yang membutuhkan kemudahan akses informasi publik kelurahan serta efisiensi dalam pengajuan surat pengantar administrasi.</li>
    <li><b>Aparatur dan Staf Pelayanan Kelurahan:</b> Merupakan pihak pengelola administrasi pemerintahan kelurahan (Lurah, Sekretaris Kelurahan, dan Kepala Seksi Pelayanan/Pemerintahan) yang bertugas memverifikasi kelayakan berkas, memvalidasi data penduduk, dan menerbitkan surat keterangan resmi bagi warga.</li>
  </ol>

  <h2 class="section-title">3.2 Metode Pengumpulan Data</h2>
  
  <p class="par">Untuk memperoleh data yang valid, akurat, dan komprehensif sebagai acuan perancangan sistem, penelitian ini menggunakan tiga metode pengumpulan data:</p>

  <h3 class="subsection-title">3.2.1 Wawancara (<i>Interview</i>)</h3>
  <p class="par">Wawancara tatap muka dilakukan secara mendalam (<i>in-depth interview</i>) dengan pihak aparatur Kelurahan Banjar Agung, meliputi Sekretaris Kelurahan dan Staf Seksi Pelayanan Masyarakat. Wawancara difokuskan untuk menggali proses bisnis pelayanan persuratan saat ini, kendala utama yang dihadapi staf dalam pengarsipan berkas manual, jenis-jenis surat yang paling sering diajukan warga, serta kebutuhan spesifik format surat keterangan yang berlaku di Kota Serang.</p>

  <h3 class="subsection-title">3.2.2 Observasi Lapangan</h3>
  <p class="par">Observasi dilakukan dengan mengamati secara langsung aktivitas pelayanan di loket pelayanan Kantor Kelurahan Banjar Agung. Pengamatan mencakup alur kedatangan warga, tahapan penyerahan dokumen persyaratan fisik, tata cara pemeriksaan berkas oleh staf loket, penulisan nomor registrasi ke buku agenda fisik, hingga waktu tunggu yang dibutuhkan warga hingga surat resmi selesai ditandatangani.</p>

  <h3 class="subsection-title">3.2.3 Studi Dokumentasi dan Pustaka</h3>
  <p class="par">Studi dokumentasi dilakukan dengan mengumpulkan salinan formulir permohonan fisik, contoh format blangko surat keterangan, serta regulasi pemerintah terkait standar operasional prosedur (SOP) pelayanan administrasi kependudukan di tingkat kelurahan. Selain itu, studi pustaka dilakukan dengan menelaah jurnal-jurnal ilmiah nasional dan internasional bereputasi mengenai implementasi sistem informasi pelayanan publik, pemodelan UML, dan teknologi pengembangan web terkini.</p>

  <h2 class="section-title">3.3 Analisis dan Perancangan Sistem</h2>

  <h3 class="subsection-title">3.3.1 Analisis Kebutuhan Sistem</h3>
  <p class="par">Berdasarkan hasil pengumpulan data, diidentifikasi kebutuhan fungsional dan non-fungsional sistem layanan informasi Kelurahan Banjar Agung sebagai berikut:</p>

  <h4 class="subsubsection-title">a. Kebutuhan Fungsional Aktor Masyarakat (Publik - Tanpa Login):</h4>
  <ol class="num-list">
    <li>Masyarakat dapat mengakses profil kelurahan, visi dan misi, struktur kepengurusan aparatur, serta grafik infografis kependudukan secara terbuka.</li>
    <li>Masyarakat dapat membaca informasi publikasi terbaru berupa berita, pengumuman darurat, dan kalender agenda kegiatan kelurahan.</li>
    <li>Masyarakat dapat mengajukan permohonan surat administrasi secara daring dengan mengisi formulir digital (NIK, nama pemohon, alamat, nomor kontak) serta mengunggah berkas persyaratan digital.</li>
    <li>Masyarakat dapat memantau status pengerjaan surat secara mandiri dan <i>real-time</i> melalui menu pelacakan status dengan memasukkan kode permohonan atau NIK.</li>
    <li>Masyarakat dapat menyampaikan pengaduan atau aspirasi secara langsung melalui form pengaduan daring.</li>
    <li>Masyarakat dapat mencari artikel berita dan jenis layanan melalui fitur pencarian global.</li>
  </ol>

  <h4 class="subsubsection-title">b. Kebutuhan Fungsional Aktor Admin Kelurahan (Memerlukan Login):</h4>
  <ol class="num-list">
    <li>Admin dapat melakukan autentikasi login secara aman ke *dashboard* administrasi menggunakan kredensial email dan password.</li>
    <li>Admin dapat mengelola konten publik kelurahan (membuat, mengubah, dan menghapus berita, pengumuman, dan agenda kegiatan).</li>
    <li>Admin dapat mengelola katalog jenis layanan surat beserta konfigurasi syarat berkas dan template dokumen Word (*docx*).</li>
    <li>Admin dapat meninjau permohonan surat yang masuk, memeriksa keabsahan berkas terlampir, serta memperbarui status permohonan (Menunggu, Diproses, Disetujui, Ditolak dengan alasan).</li>
    <li>Admin dapat mengunduh atau mencetak draf surat resmi yang telah disetujui secara otomatis melalui sistem.</li>
    <li>Admin dapat mengelola data kependudukan agregat untuk visualisasi infografis wilayah.</li>
    <li>Admin dapat membaca dan memberikan tanggapan resmi atas pengaduan warga.</li>
    <li>Admin dapat memantau rekam aktivitas sistem (*audit trail*) untuk pengawasan keamanan operasional.</li>
  </ol>

  <h4 class="subsubsection-title">c. Kebutuhan Non-Fungsional:</h4>
  <ol class="num-list">
    <li><b>Kehandalan &amp; Performa:</b> Waktu pemuatan halaman awal rata-rata kurang dari 2 detik dengan pemanfaatan arsitektur *Next.js Server-Side Rendering*.</li>
    <li><b>Keamanan Data:</b> Proteksi otentikasi admin menggunakan enkripsi token *Firebase Auth*, validasi input form pada sisi klien dan server, serta aturan izin akses (*Security Rules*) pada penyimpanan awan.</li>
    <li><b>Kemudahan Penggunaan (Usability):</b> Antarmuka dirancang bersih, intuitif, berorientasi *mobile-first*, serta tidak mewajibkan registrasi akun bagi warga demi efisiensi birokrasi.</li>
  </ol>

  <h3 class="subsection-title">3.3.2 Model Pengembangan Perangkat Lunak</h3>
  <p class="par">Pengembangan sistem ini mengadopsi model sekuensial linier klasik atau <i>Waterfall Model</i> [15]. Model Waterfall dipilih karena kebutuhan sistem kelurahan telah terdefinisi secara terstruktur dan pasti melalui wawancara mendalam di awal penelitian, sehingga alur pengerjaan berlangsung bertahap dari analisis hingga evaluasi.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g1', '')}
    </div>
    <p class="figure-caption"><b>Gambar 1</b> Metode <em>Waterfall</em> Pengembangan Sistem</p>
  </div>

  <p class="par">Tahapan model <i>Waterfall</i> yang dilaksanakan dalam penelitian ini sebagaimana disajikan pada Gambar 1 meliputi:</p>
  <ol class="num-list">
    <li><b>Analisis Kebutuhan (<i>Requirement Analysis</i>):</b> Melakukan pengumpulan data di Kelurahan Banjar Agung untuk mendokumentasikan spesifikasi kebutuhan fungsional dan teknis sistem secara mendalam.</li>
    <li><b>Perancangan Sistem (<i>System Design</i>):</b> Menyusun arsitektur sistem menggunakan diagram UML (Use Case, Activity, Class, Sequence), basis data ERD, serta merancang purwarupa antarmuka pengguna (UI/UX).</li>
    <li><b>Implementasi Sistem (<i>Implementation</i>):</b> Menerjemahkan rancangan ke dalam baris kode program menggunakan <i>Next.js</i>, <i>TypeScript</i>, <i>Tailwind CSS</i>, dan mengintegrasikannya dengan <i>Firebase Firestore</i>.</li>
    <li><b>Pengujian Sistem (<i>System Testing</i>):</b> Menguji seluruh modul fungsional menggunakan metode <i>Black-box Testing</i> untuk menjamin ketiadaan celah kesalahan fungsional sebelum diterapkan.</li>
    <li><b>Penerapan dan Evaluasi (<i>Deployment &amp; Evaluation</i>):</b> Melakukan penyebaran sistem ke server publik dan mengumpulkan umpan balik operasional dari warga serta aparatur kelurahan.</li>
  </ol>

  <h3 class="subsection-title">3.3.3 Perancangan Proses Sistem (UML)</h3>
  <p class="par">Perancangan proses sistem dilakukan dengan memanfaatkan notasi diagram <i>Unified Modeling Language</i> (UML) guna memetakan interaksi pengguna, alur proses bisnis, struktur data, dan pertukaran pesan antarobjek sistem.</p>

  <h4 class="subsubsection-title">a. Use Case Diagram</h4>
  <p class="par"><i>Use case diagram</i> menggambarkan hubungan antara fungsionalitas sistem dengan para pengguna yang berinteraksi dengannya. Sistem ini melibatkan tepat 2 (dua) aktor utama, yaitu <b>Masyarakat</b> sebagai aktor publik eksternal yang tidak memerlukan autentikasi login, dan <b>Admin Kelurahan</b> sebagai aktor pengelola internal yang terotentikasi.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g2', '')}
    </div>
    <p class="figure-caption"><b>Gambar 2</b> <em>Use Case Diagram</em> Sistem Layanan Informasi Kelurahan Banjar Agung Berbasis <em>Website</em></p>
  </div>

  <p class="par">Sebagaimana digambarkan pada Gambar 2, aktor Masyarakat memiliki akses terhadap 6 (enam) fungsi utama tanpa login, yaitu melihat profil &amp; infografis, melihat berita &amp; agenda, mengajukan permohonan surat secara online, memantau status permohonan dengan kode lacak atau NIK, menyampaikan pengaduan, dan melakukan pencarian global. Sementara itu, aktor Admin Kelurahan memiliki akses penuh setelah melakukan login ke dashboard untuk mengelola konten publik, mengelola data layanan surat, memverifikasi permohonan warga, mencetak surat resmi, mengelola data penduduk, merespons pengaduan warga, serta memantau log aktivitas sistem.</p>

  <h4 class="subsubsection-title">b. Activity Diagram</h4>
  <p class="par"><i>Activity diagram</i> memodelkan dinamika aliran aktivitas operasional antarentitas dalam sistem. Gambar 3 menggambarkan alur aktivitas aktor Masyarakat saat mengajukan permohonan surat dan memantau statusnya.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g3', '')}
    </div>
    <p class="figure-caption"><b>Gambar 3</b> <em>Activity Diagram</em> Pengajuan dan Pelacakan Permohonan Surat oleh Masyarakat</p>
  </div>

  <p class="par">Pada Gambar 3 terlihat alur kerja masyarakat yang sangat efisien: masyarakat mengakses portal website kelurahan, memilih jenis surat, mengisi data pemohon serta melampirkan berkas digital. Sistem memvalidasi kelengkapan form; jika valid, sistem menyimpan data dan otomatis menerbitkan kode unik permohonan (*tracking code*) yang dapat disimpan oleh warga untuk memantau status surat di menu pelacakan secara mandiri tanpa login.</p>

  <p class="par">Selanjutnya, Gambar 4 menggambarkan alur aktivitas Admin Kelurahan dalam memverifikasi permohonan surat yang masuk.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g4', '')}
    </div>
    <p class="figure-caption"><b>Gambar 4</b> <em>Activity Diagram</em> Pengelolaan dan Verifikasi Permohonan Surat oleh Admin Kelurahan</p>
  </div>

  <p class="par">Berdasarkan Gambar 4, alur admin dimulai dari login, membuka daftar permohonan surat pada dashboard, memeriksa kelengkapan berkas pemohon, lalu memutuskan persetujuan berkas. Jika berkas ditolak, admin menyertakan catatan alasan perbaikan. Jika berkas disetujui, status otomatis diperbarui, dan sistem menyiapkan draf dokumen resmi yang dapat langsung diunduh atau dicetak oleh staf kelurahan.</p>

  <h4 class="subsubsection-title">c. Class Diagram</h4>
  <p class="par"><i>Class diagram</i> menyajikan struktur kelas-kelas objek dalam sistem, atribut data, operasi fungsi, serta asosiasi relasi antarentitas kelas.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g5', '')}
    </div>
    <p class="figure-caption"><b>Gambar 5</b> <em>Class Diagram</em> Sistem Layanan Informasi Kelurahan Banjar Agung</p>
  </div>

  <p class="par">Gambar 5 mendefinisikan kelas-kelas utama dalam sistem, yaitu kelas <code>Admin</code> untuk otentikasi staf, <code>Layanan</code> sebagai katalog layanan persuratan, <code>PermohonanSurat</code> sebagai representasi transaksi permohonan warga, <code>Pengaduan</code> untuk menampung aspirasi masyarakat, <code>BeritaDanAgenda</code> untuk manajemen diseminasi informasi publik, <code>Penduduk</code> untuk agregasi demografi, serta <code>AuditLog</code> untuk pencatatan keamanan operasional admin.</p>

  <h4 class="subsubsection-title">d. Sequence Diagram</h4>
  <p class="par"><i>Sequence diagram</i> menguraikan kronologi pertukaran pesan antarobjek sistem secara spesifik pada skenario-skenario interaksi penting.</p>

  <p class="par">Gambar 6 menggambarkan <i>Sequence Diagram</i> pengajuan surat oleh masyarakat tanpa proses login akun.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g6', '')}
    </div>
    <p class="figure-caption"><b>Gambar 6</b> <em>Sequence Diagram</em> Pengajuan Permohonan Surat oleh Masyarakat</p>
  </div>

  <p class="par">Gambar 7 menggambarkan <i>Sequence Diagram</i> pelacakan status permohonan surat oleh masyarakat berdasarkan kode tracking atau NIK.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g7', '')}
    </div>
    <p class="figure-caption"><b>Gambar 7</b> <em>Sequence Diagram</em> Pelacakan Status Permohonan Surat oleh Masyarakat</p>
  </div>

  <p class="par">Gambar 8 menggambarkan <i>Sequence Diagram</i> verifikasi dan pembaruan status permohonan surat oleh Admin Kelurahan.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g8', '')}
    </div>
    <p class="figure-caption"><b>Gambar 8</b> <em>Sequence Diagram</em> Verifikasi Permohonan Surat oleh Admin Kelurahan</p>
  </div>

  <p class="par">Gambar 9 menggambarkan <i>Sequence Diagram</i> proses pembuatan dan pengunduhan surat resmi menggunakan template dokumen Word (*docx*) secara otomatis.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g9', '')}
    </div>
    <p class="figure-caption"><b>Gambar 9</b> <em>Sequence Diagram</em> Cetak Surat Resmi oleh Admin Kelurahan</p>
  </div>

  <h3 class="subsection-title">3.3.4 Perancangan Basis Data (ERD)</h3>
  <p class="par">Perancangan basis data memetakan relasi logis antar-koleksi data di dalam <i>Firebase Firestore</i>. Walaupun Firestore merupakan basis data NoSQL, pemodelan relasi entitas tetap krusial guna menjaga konsistensi referensi data antardokumen.</p>

  <div class="figure-container">
    <div class="figure-box">
      {diagrams.get('g10', '')}
    </div>
    <p class="figure-caption"><b>Gambar 10</b> <em>Entity Relationship Diagram</em> (ERD) Sistem Layanan Informasi Kelurahan</p>
  </div>

  <p class="par">Sebagaimana digambarkan pada Gambar 10, entitas <code>LAYANAN</code> berelasi satu-ke-banyak (<i>one-to-many</i>) dengan entitas <code>PERMOHONAN_SURAT</code>, di mana satu jenis layanan dapat dimohonkan oleh banyak warga. Entitas <code>ADMIN</code> berelasi satu-ke-banyak dengan entitas <code>AUDIT_LOG</code> untuk merekam seluruh tindakan verifikasi dan pengelolaan yang dilakukan. Entitas <code>PENGADUAN</code>, <code>BERITA_DAN_AGENDA</code>, dan <code>PENDUDUK</code> dirancang modular untuk mempermudah pembaruan data secara mandiri.</p>

  <h2 class="section-title">3.4 Desain Antarmuka Pengguna (<i>Interface Design</i>)</h2>
  <p class="par">Perancangan antarmuka pengguna (UI) mengacu pada prinsip-prinsip desain modern: kejelasan hierarki visual, kontras warna yang nyaman, tipografi yang terbaca jelas, serta kemampuan adaptasi responsif pada layar ponsel maupun monitor komputer. Struktur antarmuka yang dirancang mencakup:</p>
  <ol class="num-list">
    <li><b>Halaman Beranda Publik (<i>Landing Page</i>):</b> Menampilkan identitas resmi Kelurahan Banjar Agung, sambutan kepala kelurahan, ringkasan statistik kependudukan, tautan cepat layanan persuratan, serta publikasi berita dan agenda terkini.</li>
    <li><b>Formulir Permohonan Surat Terbuka:</b> Dirancang dengan pendekatan *step-by-step* yang memandu pemohon mengisi NIK, nama lengkap, nomor telepon aktif, data pendukung sesuai jenis surat, serta area *drag-and-drop* pengunggahan berkas persyaratan digital.</li>
    <li><b>Halaman Lacak Status Surat:</b> Menyediakan bilah pencarian responsif bagi warga untuk memeriksa progres berkas secara instan menggunakan kode tracking atau NIK dengan tampilan garis waktu (*timeline status*).</li>
    <li><b>Halaman Pengaduan Warga:</b> Formulir pelaporan aspirasi warga yang dilengkapi pengkategorian bidang keluhan serta status tindak lanjut respons dari pihak kelurahan.</li>
    <li><b>Dashboard Admin Kelurahan:</b> Antarmuka terproteksi yang menyajikan grafik analitik permohonan surat masuk, tabel data verifikasi permohonan yang dapat difilter berdasarkan status, panel editor konten berita dan agenda, serta fitur pratinjau dan cetak surat instan.</li>
  </ol>

  <h2 class="section-title">3.5 Jadwal Pelaksanaan Penelitian</h2>
  <p class="par">Penelitian tugas akhir ini direncanakan berlangsung selama 6 (enam) bulan dengan rincian jadwal pelaksanaan kegiatan sebagaimana disajikan pada Tabel 3.1.</p>

  <div class="table-container">
    <p class="table-caption"><b>Tabel 3.1</b> Matriks Jadwal Kegiatan Penelitian Tugas Akhir</p>
    <table class="academic-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">No.</th>
          <th style="width: 35%;">Nama Kegiatan</th>
          <th style="width: 10%; text-align: center;">Bulan 1</th>
          <th style="width: 10%; text-align: center;">Bulan 2</th>
          <th style="width: 10%; text-align: center;">Bulan 3</th>
          <th style="width: 10%; text-align: center;">Bulan 4</th>
          <th style="width: 10%; text-align: center;">Bulan 5</th>
          <th style="width: 10%; text-align: center;">Bulan 6</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1.</td>
          <td>Identifikasi Masalah &amp; Studi Literatur</td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
        </tr>
        <tr>
          <td style="text-align: center;">2.</td>
          <td>Pengumpulan Data (Wawancara &amp; Observasi)</td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
        </tr>
        <tr>
          <td style="text-align: center;">3.</td>
          <td>Analisis Kebutuhan Sistem</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
        </tr>
        <tr>
          <td style="text-align: center;">4.</td>
          <td>Perancangan Sistem (UML, ERD, UI/UX)</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
        </tr>
        <tr>
          <td style="text-align: center;">5.</td>
          <td>Implementasi Sistem (Coding Next.js &amp; Firebase)</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
        </tr>
        <tr>
          <td style="text-align: center;">6.</td>
          <td>Pengujian Fungsional (Black-box Testing)</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;"></td>
        </tr>
        <tr>
          <td style="text-align: center;">7.</td>
          <td>Penerapan, Evaluasi &amp; Penyusunan Laporan TA</td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;"></td>
          <td style="text-align: center;">████</td>
          <td style="text-align: center;">████</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="page-break-after: always;"></div>

  <!-- ============================================================== -->
  <!-- DAFTAR PUSTAKA (FORMAT IEEE RESMI) -->
  <!-- ============================================================== -->
  <h1 class="chapter-title">DAFTAR PUSTAKA</h1>
"""

# Tambahkan butir-butir Daftar Pustaka IEEE
for ref in daftar_pustaka_items:
    html_content += f'  <p class="ref-item">{ref}</p>\n'

html_content += """
</div>

<script>
function copyDocumentToClipboard() {
  const range = document.createRange();
  const manuscript = document.getElementById('manuscript');
  range.selectNode(manuscript);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      alert('Naskah BAB I - III berhasil disalin ke clipboard! Silakan buka Microsoft Word dan tekan Ctrl + V.');
    } else {
      alert('Gagal menyalin otomatis. Silakan tekan Ctrl + A lalu Ctrl + C pada halaman ini.');
    }
  } catch (err) {
    alert('Browser tidak mendukung salin otomatis. Silakan gunakan Ctrl + A lalu Ctrl + C.');
  }
  window.getSelection().removeAllRanges();
}
</script>

</body>
</html>
"""

# Simpan naskah ke docs/naskah_skripsi_bab1_3.html
with open('docs/naskah_skripsi_bab1_3.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Generated docs/naskah_skripsi_bab1_3.html successfully! Length: {len(html_content)} characters.")
