import type { LetterType } from "@/lib/letters";

export interface LetterPrintConfig {
  nomorSurat: string;
  pejabatNama: string;
  pejabatJabatan: string;
  pejabatNip: string;
  tanggalSurat: string;
}

export interface LetterPrintRequest {
  nama?: string;
  nik?: string;
  phone?: string;
  keperluan?: string;
  type?: string;
  typeName?: string;
  templateNarrative?: string;
  formData?: Record<string, unknown>;
}

interface Props {
  request: LetterPrintRequest;
  letterTypes: LetterType[];
  printConfig: LetterPrintConfig;
}

export default function LetterPrintDocument({ request, letterTypes, printConfig }: Props) {
  const letterType = letterTypes.find((lt) => lt.code === request.type);

  return (
    <>
      {/* Kop Surat */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingBottom: "12px", borderBottom: "3px double black", marginBottom: "20px" }}>
        {/* Logo placeholder — di surat fisik diisi logo daerah */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          border: "2px solid #c9971c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "8pt",
          color: "#c9971c",
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: "1.2",
          fontFamily: "Georgia, serif",
        }}>
          LOGO
        </div>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "10pt", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}>
            PEMERINTAH KOTA SERANG
          </div>
          <div style={{ fontSize: "10pt", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}>
            KECAMATAN CIPOCOK JAYA
          </div>
          <div style={{ fontSize: "16pt", fontWeight: "900", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>
            KELURAHAN BANJAR AGUNG
          </div>
          <div style={{ fontSize: "8.5pt", color: "#444", fontFamily: "Arial, sans-serif", marginTop: "3px" }}>
            Jl. Syech Nawawi Albantani No. 16, Kota Serang, Banten 42122
          </div>
          <div style={{ fontSize: "8.5pt", color: "#444", fontFamily: "Arial, sans-serif" }}>
            Telp/WA: +62 813-1505-3901 · Email: kel.banjaragung@serangkota.go.id
          </div>
        </div>

        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          border: "2px solid #1b365d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "8pt",
          color: "#1b365d",
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: "1.2",
          fontFamily: "Georgia, serif",
        }}>
          LOGO
        </div>
      </div>

      {/* Judul Surat */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "13pt", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {request.typeName || "SURAT KETERANGAN"}
        </div>
        <div style={{ fontSize: "10pt", fontFamily: "Arial, sans-serif", marginTop: "4px", letterSpacing: "0.02em" }}>
          Nomor: {printConfig.nomorSurat || ".../ .../..."}
        </div>
      </div>

      {/* Isi Surat */}
      <div style={{ textAlign: "justify", lineHeight: "1.8" }}>
        <p style={{ marginBottom: "12px" }}>
          Yang bertanda tangan di bawah ini, Lurah Banjar Agung, Kecamatan Cipocok Jaya, Kota Serang, Provinsi Banten, dengan ini menerangkan bahwa:
        </p>

        {/* Tabel data pemohon */}
        <table style={{ width: "100%", marginBottom: "12px", fontSize: "11pt", fontFamily: "Arial, sans-serif" }}>
          <tbody>
            <DataRow label="Nama Lengkap" value={<strong style={{ textTransform: "uppercase" }}>{request.nama || "—"}</strong>} />
            <DataRow label="NIK (No. KTP)" value={<span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>{request.nik || "—"}</span>} />
            <DataRow label="Nomor Telepon / WA" value={request.phone || "—"} />
            <DataRow
              label="Maksud / Keperluan"
              value={<strong>{request.keperluan || "—"}</strong>}
              alignTop
            />
            {request.formData &&
              Object.entries(request.formData).map(([k, v]) => {
                const def = (letterType?.customFields || []).find((f) => f.key === k);
                return (
                  <DataRow
                    key={k}
                    label={def?.label || k}
                    value={<strong>{String(v) || "—"}</strong>}
                    alignTop={String(v).length > 40}
                  />
                );
              })}
          </tbody>
        </table>

        {letterType?.templateFileUrl && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px", padding: "6px 10px", marginBottom: "12px", fontSize: "9pt", fontFamily: "Arial, sans-serif", color: "#1e40af" }}>
            Surat ini memiliki template DOCX resmi. Gunakan tombol "Unduh DOCX Presisi" untuk hasil cetak 100% sesuai template.
          </div>
        )}

        {/* Narasi */}
        <p style={{ marginBottom: "12px", textIndent: "2em" }}>
          {request.templateNarrative ||
            letterType?.templateNarrative ||
            "Menerangkan bahwa orang tersebut di atas adalah benar warga yang berdomisili sah di Kelurahan Banjar Agung, berkarakter baik, dan tidak sedang terlibat dalam permasalahan hukum maupun sengketa perdata apapun di lingkungan kelurahan."}
        </p>

        <p style={{ textIndent: "2em" }}>
          Demikian surat keterangan ini kami berikan dengan sebenarnya atas dasar keterangan pemohon dan data arsip yang ada, untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
        </p>
      </div>

      {/* Tanda Tangan */}
      <div style={{ marginTop: "40px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", width: "220px" }}>
          <div style={{ fontSize: "11pt", fontFamily: "Arial, sans-serif" }}>
            Banjar Agung, {printConfig.tanggalSurat || "..."}
          </div>
          <div style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>
            {printConfig.pejabatJabatan || "Lurah"}
          </div>

          {/* QR / Stempel area */}
          <div style={{ margin: "12px auto", width: "76px", height: "76px", border: "1.5px dashed #9ca3af", borderRadius: "4px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px" }}>
            <div style={{ fontSize: "7pt", color: "#9ca3af", fontFamily: "Arial, sans-serif", textAlign: "center", lineHeight: "1.4" }}>
              <div>[ QR CODE ]</div>
              <div style={{ fontSize: "6pt" }}>VALIDASI RESMI</div>
            </div>
          </div>

          <div style={{ fontSize: "11pt", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}>
            {printConfig.pejabatNama || "—"}
          </div>
          <div style={{ fontSize: "9.5pt", color: "#444", fontFamily: "monospace", marginTop: "2px" }}>
            NIP. {printConfig.pejabatNip || "—"}
          </div>
        </div>
      </div>
    </>
  );
}

function DataRow({
  label,
  value,
  alignTop = false,
}: {
  label: string;
  value: React.ReactNode;
  alignTop?: boolean;
}) {
  const vAlign = alignTop ? "top" : "middle";
  return (
    <tr>
      <td style={{ width: "180px", paddingTop: "3px", paddingBottom: "3px", color: "#555", verticalAlign: vAlign }}>
        {label}
      </td>
      <td style={{ width: "16px", paddingTop: "3px", paddingBottom: "3px", verticalAlign: vAlign }}>:</td>
      <td style={{ paddingTop: "3px", paddingBottom: "3px", verticalAlign: vAlign }}>{value}</td>
    </tr>
  );
}
