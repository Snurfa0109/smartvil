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
      <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
        <h4 className="font-bold text-sm tracking-wider uppercase">PEMERINTAH KOTA SERANG</h4>
        <h4 className="font-bold text-sm tracking-wider uppercase">KECAMATAN CIPOCOK JAYA</h4>
        <h2 className="font-black text-xl tracking-widest uppercase">KANTOR KELURAHAN BANJAR AGUNG</h2>
        <p className="text-[9pt] font-sans mt-0.5 text-gray-700">
          Jl. Syech Nawawi Albantani No. 16, Kota Serang, Banten 42122 | Telp/WA: +62 813-1505-3901
        </p>
      </div>

      <div className="text-center mb-6">
        <h3 className="font-bold text-base underline uppercase tracking-wide">
          {request.typeName || "SURAT KETERANGAN DESA"}
        </h3>
        <p className="text-[10pt] font-sans mt-0.5 font-mono">
          Nomor: {printConfig.nomorSurat}
        </p>
      </div>

      <div className="space-y-3.5 text-justify">
        <p>
          Yang bertanda tangan di bawah ini, Lurah Banjar Agung, Kec. Cipocok Jaya, Kota Serang, Banten, dengan ini menerangkan bahwa:
        </p>

        <table className="w-full my-3 font-sans text-xs ml-4">
          <tbody>
            <tr>
              <td className="w-44 py-1 text-gray-700">Nama Lengkap</td>
              <td className="w-4">:</td>
              <td className="font-bold uppercase text-black">{request.nama}</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-700">NIK (No. KTP)</td>
              <td>:</td>
              <td className="font-mono font-semibold">{request.nik}</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-700">Nomor Telepon / WA</td>
              <td>:</td>
              <td>{request.phone || "-"}</td>
            </tr>
            <tr>
              <td className="py-1 align-top text-gray-700">Maksud / Keperluan</td>
              <td className="align-top">:</td>
              <td className="font-semibold text-black">{request.keperluan}</td>
            </tr>
            {request.formData && Object.entries(request.formData).map(([k, v]) => {
              const def = (letterType?.customFields || []).find((f) => f.key === k);
              return (
                <tr key={k}>
                  <td className="py-1 align-top text-gray-700">{def?.label || k}</td>
                  <td className="align-top">:</td>
                  <td className="font-semibold text-black">{String(v) || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {letterType?.templateFileUrl && (
          <p className="text-[9pt] font-sans text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-1">
            Surat ini memiliki template DOCX resmi — gunakan tombol “Download DOCX Presisi” agar hasil cetak 100% sama dengan template.
          </p>
        )}

        <p>
          {request.templateNarrative ||
            letterType?.templateNarrative ||
            "Menerangkan bahwa orang tersebut di atas adalah benar warga yang berdomisili sah di Kelurahan Banjar Agung, berkarakter baik, dan tidak sedang terlibat dalam permasalahan hukum maupun sengketa perdata apapun di lingkungan desa."}
        </p>

        <p>
          Demikian surat keterangan ini kami berikan dengan sebenarnya atas dasar keterangan pemohon dan data arsip yang ada, untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
        </p>
      </div>

      <div className="mt-10 flex justify-end">
        <div className="text-center w-64">
          <p className="text-xs font-sans">Kelurahan Banjar Agung, {printConfig.tanggalSurat}</p>
          <p className="font-bold text-xs mt-1 uppercase">{printConfig.pejabatJabatan}</p>

          <div className="h-20 flex flex-col items-center justify-center my-2">
            <div className="w-16 h-16 border border-dashed border-gray-400 rounded flex flex-col items-center justify-center text-[8pt] text-gray-400 font-sans">
              <span>[ QR CODE ]</span>
              <span className="text-[6pt]">VALIDASI RESMI</span>
            </div>
          </div>

          <p className="font-bold underline uppercase text-xs">{printConfig.pejabatNama}</p>
          <p className="text-[9pt] font-sans text-gray-600 font-mono">NIP. {printConfig.pejabatNip}</p>
        </div>
      </div>
    </>
  );
}
