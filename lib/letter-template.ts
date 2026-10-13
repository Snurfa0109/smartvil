import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { DROPDOWN_FIELDS, ADMIN_ONLY_FIELDS, NARRATIVE_LABEL_KEYS } from "./letter-constants";

export { BUILTIN_FIELDS } from "./letter-constants";

export type CustomFieldType = "text" | "number" | "date" | "textarea" | "select";

export interface LetterCustomField {
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

const TNR_FONTS = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>`;

export function prettifyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function guessFieldType(key: string): CustomFieldType {
  const k = key.toLowerCase();
  if (getDropdownOptions(k)) return "select";
  if (k.includes("tempat") && (k.includes("lahir") || k.includes("tgl"))) return "text";
  if (k.includes("tanggal") || k.includes("tgl") || k.includes("date"))
    return "date";
  if (k.includes("alamat") || k.includes("keperluan") || k.includes("keterangan") || k.includes("alasan"))
    return "textarea";
  return "text";
}

export function getDropdownOptions(key: string): string[] | null {
  const k = key.toLowerCase().replace(/_?(suami|istri|ayah|ibu|anak|pemohon|2|3|4|5)$/g, "").replace(/_+$/, "");
  for (const [pattern, options] of Object.entries(DROPDOWN_FIELDS)) {
    if (k === pattern || k.endsWith(`_${pattern}`) || k.includes(pattern)) {
      return options;
    }
  }
  return null;
}

export async function extractPlaceholdersFromDocx(file: File | ArrayBuffer): Promise<string[]> {
  const buf =
    file instanceof ArrayBuffer
      ? file
      : await (file as File).arrayBuffer();
  const zip = new PizZip(buf);
  const partNames = Object.keys(zip.files).filter((n) =>
    /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)
  );
  const parts = partNames.length > 0 ? partNames : ["word/document.xml"];
  const found = new Set<string>();
  for (const name of parts) {
    const xml = zip.file(name)?.asText() ?? "";
    PLACEHOLDER_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PLACEHOLDER_REGEX.exec(xml)) !== null) {
      found.add(m[1].trim());
    }
  }
  return [...found].sort();
}

export function stripPlaceholdersFromDocx(buf: ArrayBuffer): ArrayBuffer {
  const zip = new PizZip(buf);
  let xml = zip.file("word/document.xml")?.asText() ?? "";

  xml = xml.replace(
    /<w:r\b[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>\s*\{\{([a-zA-Z0-9_]+)\}\}\s*<\/w:t>\s*<\/w:r>/g,
    (_full: string, key: string) => {
      const k = key.toLowerCase();
      // Signer zone fields need fill text restored so re-scanning can detect them
      if (k.includes("nama_pejabat")) {
        return _full.replace(/\{\{[^}]+\}\}/, "NAMA LENGKAP PEJABAT");
      }
      return "";
    }
  );

  // Restore fill dots after stripping so re-scanning can detect the field
  xml = xml.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (_full: string, attrs: string, text: string) => {
    if (!text.includes("{{")) return _full;
    const cleaned = text.replace(/\s*\{\{[a-zA-Z0-9_]+\}\}/g, "").trimEnd();
    if (!cleaned) return "";
    const restored = /[,:.]$/.test(cleaned)
      ? `${cleaned} ..........`
      : cleaned;
    return `<w:t${attrs}>${restored}</w:t>`;
  });

  xml = xml.replace(/<w:r\b[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>\s*<\/w:t>\s*<\/w:r>/g, "");
  xml = xml.replace(/<w:r\b[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<\/w:r>/g, "");

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "arraybuffer" }) as ArrayBuffer;
}

function normalizeLabelToKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "field";
}

function paragraphTexts(docXml: string): string[] {
  const paras = docXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  return paras.map((pa) => {
    const runs = [...pa.matchAll(/<w:t[^>]*>([^<]*?)<\/w:t>/g)].map((x) => x[1]);
    return runs.join("");
  });
}


export async function smartTemplateFromStaticDocx(
  file: File | ArrayBuffer
): Promise<{ buffer: ArrayBuffer; placeholders: string[]; injected: { label: string; key: string; defaultValue?: string }[] }> {
  const buf =
    file instanceof ArrayBuffer ? file.slice(0) : await (file as File).arrayBuffer();
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml")?.asText() ?? "";
  const paraMatches = docXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const texts = paragraphTexts(docXml);

  const injected: { label: string; key: string; defaultValue?: string }[] = [];
  const usedKeys = new Set<string>();
  const duplicateLabels = findDuplicateLabelSections(texts);

  const uniqueKey = (base: string) => {
    let k = base;
    let i = 2;
    while (usedKeys.has(k)) {
      k = `${base}_${i}`;
      i++;
    }
    usedKeys.add(k);
    return k;
  };

  const signerZoneStart = findSignerZoneStart(texts);

  const newParas = paraMatches.map((paraXml, idx) => {
    const text = texts[idx] || "";
    const trimmed = text.trim();
    if (!trimmed) return paraXml;

    const existingRpr = paraXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] || "";
    const rprTag = existingRpr
      ? `<w:rPr>${existingRpr}</w:rPr>`
      : `<w:rPr>${TNR_FONTS}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;

    if (/nomor\s*:/i.test(trimmed) && trimmed.length < 80) {
      const key = uniqueKey("nomor_surat");
      injected.push({ label: "Nomor Surat", key });
      const nomorPrefix = trimmed.match(/^(.*?nomor\s*:\s*)/i)?.[1] || "Nomor: ";
      return replaceAllRuns(paraXml, rprTag, `${nomorPrefix}{{${key}}}`);
    }

    if (idx >= signerZoneStart) {
      if (/^[A-Za-z]+\s*,\s*[._\u2026\s]*$/i.test(trimmed) || /^[A-Za-z]+\s*,\s*\d/i.test(trimmed)) {
        const commaIdx = trimmed.indexOf(",");
        const cityName = trimmed.slice(0, commaIdx).trim();
        const key = uniqueKey("tanggal_surat");
        injected.push({ label: "Tanggal Surat", key });
        return replaceAllRuns(paraXml, rprTag, `${cityName}, {{${key}}}`);
      }
      if (/^nip[\s.:]/i.test(trimmed)) {
        const key = uniqueKey("nip_pejabat");
        injected.push({ label: "NIP Pejabat", key });
        return replaceAllRuns(paraXml, rprTag, `NIP. {{${key}}}`);
      }
      // ALL CAPS name that isn't a title/role prefix — likely the pejabat name
      if (/^[A-Z][A-Z\s.,]+$/.test(trimmed) && trimmed.length >= 5 && trimmed.length < 40
          && !/^(AN\.|A\.N\.|LURAH|CAMAT|KEPALA|SEKRETARIS|PLT|PLH|MENGETAHUI|DIKETAHUI|HORMAT|TEMBUSAN)/i.test(trimmed)) {
        const key = uniqueKey("nama_pejabat");
        injected.push({ label: "Nama Pejabat", key });
        return replaceAllRuns(paraXml, rprTag, `{{${key}}}`);
      }
      return paraXml;
    }
    if (trimmed.length > 80) return paraXml;
    if (isNarrativeLine(trimmed)) return paraXml;
    if (isHeaderOrTitle(trimmed)) return paraXml;

    const label = extractLabel(trimmed);
    if (label && label.length >= 2 && label.length <= 45) {
      let base = normalizeLabelToKey(label);
      if (NARRATIVE_LABEL_KEYS.has(base)) return paraXml;
      const sectionSuffix = duplicateLabels.get(base)?.[idx];
      if (sectionSuffix) base = `${base}_${sectionSuffix}`;
      const key = uniqueKey(base);
      const prettyLabel = sectionSuffix ? `${label} (${sectionSuffix})` : label;
      injected.push({ label: prettyLabel, key });
      return appendRun(paraXml, rprTag, key);
    }

    return paraXml;
  });

  const newXml = docXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, () => newParas.shift() as string);
  zip.file("word/document.xml", newXml);
  const outBuffer = zip.generate({ type: "arraybuffer" }) as ArrayBuffer;
  const placeholders = injected.map((i) => i.key).sort();
  return { buffer: outBuffer, placeholders, injected };
}

function appendRun(paraXml: string, rprTag: string, key: string): string {
  return paraXml.replace(/<\/w:p>\s*$/, `<w:r>${rprTag}<w:t xml:space="preserve"> {{${key}}}</w:t></w:r></w:p>`);
}

function replaceAllRuns(paraXml: string, rprTag: string, newText: string): string {
  const runMatches = [...paraXml.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g)];
  if (runMatches.length === 0) {
    return paraXml.replace(/<\/w:p>\s*$/, `<w:r>${rprTag}<w:t xml:space="preserve">${newText}</w:t></w:r></w:p>`);
  }
  let firstReplaced = false;
  let result = paraXml;
  for (const rm of runMatches) {
    const runXml = rm[0];
    if (!firstReplaced) {
      const newRun = runXml.replace(/<w:t[^>]*>[^<]*<\/w:t>/g, () => {
        if (!firstReplaced) {
          firstReplaced = true;
          return `<w:t xml:space="preserve">${newText}</w:t>`;
        }
        return `<w:t xml:space="preserve"></w:t>`;
      });
      result = result.replace(runXml, newRun);
    } else {
      const cleared = runXml.replace(/<w:t[^>]*>[^<]*<\/w:t>/g, '<w:t xml:space="preserve"></w:t>');
      result = result.replace(runXml, cleared);
    }
  }
  return result;
}

function extractLabel(trimmed: string): string | null {
  const m =
    trimmed.match(/^(.+?)\s*:\s*$/) ||
    trimmed.match(/^(.+?)\s*:\s+[._\u2026]{2,}\s*$/) ||
    trimmed.match(/^(.+?)\s+[._\u2026]{3,}\s*$/) ||
    trimmed.match(/^(.+?)\s{2,}[._\u2026]{2,}\s*$/);
  if (!m) return null;
  return m[1].replace(/\s+/g, " ").replace(/[._\u2026\s]+$/, "").trim();
}

function isNarrativeLine(trimmed: string): boolean {
  if (/^(yang\s|demikian\s|dengan\s|bahwa\s|benar\s|menerangkan\s|dikeluarkan\s|berdasarkan\s|sebagaimana\s|menimbang\s|mengingat\s|memperhatikan\s|adalah\s+benar|adapun\s|selanjutnya\s|sehubungan\s|bersama\s+ini\s|untuk\s+itu\s)/i.test(trimmed)) return true;
  if (/^(surat\s+keterangan\s+ini\s+dipergunakan|dipergunakan\s+untuk|digunakan\s+untuk|guna\s+keperluan|untuk\s+keperluan|keperluan\s*:|kebutuhan\s*:|maksud\s+dan\s+tujuan|tujuan\s*:)/i.test(trimmed)) return true;
  return false;
}

function isHeaderOrTitle(trimmed: string): boolean {
  if (/^(an\.\s|a\.n\.\s|sekretaris|lurah\s|kepala\s|camat\s|plt\.\s|plh\.\s)/i.test(trimmed)) return true;
  if (/^nip[\s.:]/i.test(trimmed)) return true;
  if (/^surat\s+(keterangan|pengantar|pernyataan|izin|rekomendasi|tugas|perintah|kuasa|undangan|pemberitahuan)/i.test(trimmed) && !/[._\u2026]{3,}/.test(trimmed)) return true;
  if (/^pemerintah\s/i.test(trimmed)) return true;
  if (/^(kecamatan|kelurahan|desa|kabupaten|kota|provinsi)\s/i.test(trimmed)) return true;
  if (/^(jl\.|jalan\s|telp|email|website|fax)/i.test(trimmed)) return true;
  if (/^(hormat\s+kami|tertanda|diketahui|mengetahui|tembusan)/i.test(trimmed)) return true;
  // Section headers like "DATA SUAMI" or "I. SUAMI" are not fillable fields
  if (/^(data\s+\w+|[IVX]+\.\s*[A-Z])/i.test(trimmed) && trimmed.length < 30 && !/[.:_\u2026]{3,}/.test(trimmed)) return true;
  const upper = trimmed.replace(/\s+/g, "");
  if (upper.length > 4 && upper === upper.toUpperCase() && !/[.:_\u2026]/.test(upper)) return true;
  return false;
}

function findSignerZoneStart(texts: string[]): number {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i].trim().toLowerCase();
    if (/^(yang\s+bertanda|yang\s+menerangkan|menerangkan|benar\s+nama|demikian)/.test(t) && t.length > 40) {
      return i + 1;
    }
  }
  const lastThird = Math.floor(texts.length * 0.65);
  for (let i = texts.length - 1; i >= lastThird; i--) {
    const t = texts[i].trim().toLowerCase();
    if (/^(an\.\s|a\.n\.\s|sekretaris|lurah\s|kepala\s|camat\s|plt[\s.]|plh[\s.]|hormat|tertanda|mengetahui|diketahui)/i.test(t)) {
      for (let j = i - 1; j >= lastThird; j--) {
        const prev = texts[j].trim();
        if (prev.length > 0) return j;
      }
      return i;
    }
  }
  return texts.length;
}

function findDuplicateLabelSections(texts: string[]): Map<string, Record<number, string>> {
  const result = new Map<string, Record<number, string>>();
  const labelPositions = new Map<string, number[]>();

  for (let i = 0; i < texts.length; i++) {
    const trimmed = texts[i].trim();
    const label = extractLabel(trimmed);
    if (!label || label.length < 2 || label.length > 45) continue;
    const key = normalizeLabelToKey(label);
    const positions = labelPositions.get(key) || [];
    positions.push(i);
    labelPositions.set(key, positions);
  }

  const duplicateKeys = [...labelPositions.entries()].filter(([, pos]) => pos.length > 1);
  if (duplicateKeys.length === 0) return result;

  const sectionHeaders: Array<{ idx: number; name: string }> = [];
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i].trim();
    const mNama = t.match(/^nama\s+(.+?)\s*:?\s*$/i);
    if (mNama && mNama[1].length <= 20) {
      sectionHeaders.push({ idx: i, name: normalizeLabelToKey(mNama[1]) });
      continue;
    }
    const mData = t.match(/^data\s+(.+?)\s*:?\s*$/i);
    if (mData && mData[1].length <= 20) {
      sectionHeaders.push({ idx: i, name: normalizeLabelToKey(mData[1]) });
      continue;
    }
    const mRoman = t.match(/^[IVX]+\.\s*(.+?)\s*$/i);
    if (mRoman && mRoman[1].length <= 20 && /^[A-Z]/.test(mRoman[1])) {
      sectionHeaders.push({ idx: i, name: normalizeLabelToKey(mRoman[1]) });
    }
  }

  if (sectionHeaders.length >= 2) {
    for (const [key, positions] of duplicateKeys) {
      const mapping: Record<number, string> = {};
      for (const pos of positions) {
        let closest = sectionHeaders[0];
        for (const h of sectionHeaders) {
          if (h.idx <= pos) closest = h;
        }
        mapping[pos] = closest.name;
      }
      result.set(key, mapping);
    }
  }

  return result;
}


export function placeholdersToCustomFields(
  placeholders: string[],
  existing: LetterCustomField[] = [],
  injected: { key: string; label: string; defaultValue?: string }[] = []
): LetterCustomField[] {
  const existingMap = new Map(existing.map((f) => [f.key, f]));
  const injectedMap = new Map(injected.map((i) => [i.key, i]));
  return placeholders
    .filter((p) => {
      const k = p.toLowerCase();
      return !ADMIN_ONLY_FIELDS.has(k) && !k.startsWith("paragraf_");
    })
    .map((key) => {
      const prev = existingMap.get(key);
      const inj = injectedMap.get(key);
      const type = prev?.type ?? guessFieldType(key);
      const options = type === "select" ? (prev?.options ?? getDropdownOptions(key) ?? []) : undefined;
      const defaultValue = prev?.defaultValue ?? inj?.defaultValue;
      return {
        key,
        label: prev?.label ?? inj?.label ?? prettifyKey(key),
        type,
        required: prev?.required ?? true,
        ...(options ? { options } : {}),
        ...(defaultValue ? { defaultValue } : {}),
      };
    });
}

export function buildSampleData(
  placeholders: string[],
  customFields: { key: string; label: string }[] = []
): Record<string, string> {
  const labelMap = new Map(customFields.map((f) => [f.key, f.label]));
  const data: Record<string, string> = {};
  for (const key of placeholders) {
    const k = key.toLowerCase();
    if (k.includes("nomor_surat") || k === "no_surat" || k === "nomorsurat")
      data[key] = "470 / 042 / KEL / II / 2026";
    else if (k.includes("tanggal_surat") || k === "tanggal")
      data[key] = "27 Februari 2026";
    else if (k.includes("nama_suami")) data[key] = "CONTOH NAMA SUAMI";
    else if (k.includes("nama_istri")) data[key] = "CONTOH NAMA ISTRI";
    else if (k.includes("nama_ayah")) data[key] = "CONTOH NAMA AYAH";
    else if (k.includes("nama_ibu")) data[key] = "CONTOH NAMA IBU";
    else if (k.includes("nama_anak")) data[key] = "CONTOH NAMA ANAK";
    else if (k.includes("nama_pemohon")) data[key] = "CONTOH NAMA PEMOHON";
    else if (k.includes("nama_jenazah") || k.includes("nama_almarhum")) data[key] = "CONTOH NAMA ALMARHUM";
    else if (k === "nama" || k === "nama_lengkap") data[key] = "CONTOH NAMA LENGKAP";
    else if (k.includes("nama_pejabat")) data[key] = "NAMA PEJABAT";
    else if (k.includes("bin") || k.includes("binti")) data[key] = "NAMA ORANG TUA";
    else if (k.includes("nik")) data[key] = "3673050101010001";
    else if (k.includes("no_kk") || k.includes("kk")) data[key] = "3673050101010002";
    else if (k.includes("tempat") && k.includes("lahir")) data[key] = "Serang, 12 Mei 1990";
    else if (k.includes("tgl") || k.includes("lahir") || k.includes("tanggal")) data[key] = "12 Mei 1990";
    else if (k.includes("kelamin")) data[key] = "Laki-laki";
    else if (k.includes("bangsa") || k.includes("agama")) data[key] = "Indonesia / Islam";
    else if (k.includes("pekerjaan")) data[key] = "Wiraswasta";
    else if (k.includes("penghasilan") || k.includes("pendapatan") || k.includes("gaji")) data[key] = "Rp 2.500.000,-";
    else if (k.includes("alamat_tujuan") || k.includes("tujuan_pindah")) data[key] = "Jl. Tujuan RT 03 RW 04, Kec. Baru, Kota Serang";
    else if (k.includes("alamat")) data[key] = "Jl. Contoh RT 01 RW 02, Kel. Banjar Agung, Kec. Cipocok Jaya, Kota Serang";
    else if (k.includes("status")) data[key] = "Kawin";
    else if (k.includes("kewarganegaraan") || k.includes("warganegara")) data[key] = "WNI";
    else if (k.includes("pendidikan")) data[key] = "SMA/Sederajat";
    else if (k.includes("phone") || k.includes("hp") || k.includes("wa")) data[key] = "08123456789";
    else if (k.includes("rt")) data[key] = "01";
    else if (k.includes("rw")) data[key] = "02";
    else if (k.includes("usaha") && k.includes("jenis")) data[key] = "Warung Sembako";
    else if (k.includes("usaha") && k.includes("nama")) data[key] = "Toko Makmur";
    else if (k.includes("usaha") && k.includes("alamat")) data[key] = "Jl. Usaha No. 12, Kel. Banjar Agung";
    else if (k.includes("alasan")) data[key] = "Keperluan pekerjaan dan keluarga";
    else if (k.includes("sebab") && k.includes("kematian")) data[key] = "Sakit";
    else if (k.includes("tempat") && k.includes("meninggal")) data[key] = "Rumah Sakit Umum Daerah Serang";
    else if (k.includes("keperluan")) data[key] = "Keperluan administrasi";
    else if (k.includes("nip")) data[key] = "19780512 200501 1 004";
    else if (k.includes("jabatan")) data[key] = "Lurah";
    else data[key] = `Contoh ${labelMap.get(key) || prettifyKey(key)}`;
  }
  return data;
}

export async function generateSampleFilledDocx(
  templateBuffer: ArrayBuffer,
  placeholders: string[],
  customFields: { key: string; label: string }[] = []
): Promise<Blob> {
  const data = buildSampleData(placeholders, customFields);
  return generateFilledDocx(templateBuffer, data);
}

export function buildTemplateData(
  request: Record<string, unknown>,
  printConfig: {
    nomorSurat?: string;
    tanggalSurat?: string;
    pejabatNama?: string;
    pejabatJabatan?: string;
    pejabatNip?: string;
  }
): Record<string, string> {
  const r = request as unknown as Record<string, string>;
  const rawForm = (request as unknown as { formData?: Record<string, string> }).formData;
  const data: Record<string, string> = { ...(rawForm ?? {}) };
  data.nama = r.nama ?? data.nama ?? "";
  data.nik = r.nik ?? data.nik ?? "";
  data.phone = r.phone ?? data.phone ?? "";
  data.keperluan = r.keperluan ?? data.keperluan ?? "";
  data.dipergunakan_untuk = r.keperluan ?? data.dipergunakan_untuk ?? data.keperluan ?? "";
  data.surat_keterangan_ini_dipergunakan_untuk = r.keperluan ?? data.surat_keterangan_ini_dipergunakan_untuk ?? data.keperluan ?? "";
  data.tujuan = r.keperluan ?? data.tujuan ?? data.keperluan ?? "";
  data.nomor_surat = printConfig.nomorSurat ?? "";
  data.nomorSurat = printConfig.nomorSurat ?? "";
  data.no_surat = printConfig.nomorSurat ?? "";
  data.tanggal_surat = printConfig.tanggalSurat ?? "";
  data.tanggalSurat = printConfig.tanggalSurat ?? "";
  data.tanggal = printConfig.tanggalSurat ?? "";
  data.nama_pejabat = printConfig.pejabatNama ?? "";
  data.jabatan_pejabat = printConfig.pejabatJabatan ?? "";
  data.nip_pejabat = printConfig.pejabatNip ?? "";
  if (!data.no_hp) data.no_hp = data.phone;
  if (!data.whatsapp) data.whatsapp = data.phone;
  return data;
}

export async function generateFilledDocx(
  templateBuffer: ArrayBuffer,
  data: Record<string, string>
): Promise<Blob> {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
    delimiters: { start: "{{", end: "}}" },
    errorLogging: false,
  });
  try {
    doc.render(data);
  } catch (err: unknown) {
    const details = (err as { properties?: { errors?: Array<{ message: string }> } })?.properties?.errors
      ?.map((e) => e.message)
      .join(", ");
    throw new Error(details ? `Template error: ${details}` : "Gagal render template DOCX.");
  }

  const renderedZip = doc.getZip();
  patchSignerZone(renderedZip, data);

  return renderedZip.generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function patchSignerZone(zip: PizZip, data: Record<string, string>) {
  let docXml = zip.file("word/document.xml")?.asText() ?? "";
  const paras = docXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const texts = paras.map((pa) => {
    const runs = [...pa.matchAll(/<w:t[^>]*>([^<]*?)<\/w:t>/g)].map((x) => x[1]);
    return runs.join("");
  });

  const tanggal = data.tanggal_surat || data.tanggalSurat || data.tanggal || "";
  const nipPejabat = data.nip_pejabat || "";
  const namaPejabat = data.nama_pejabat || "";

  let changed = false;

  for (let i = 0; i < texts.length; i++) {
    const t = texts[i].trim();
    if (!t) continue;

    if (tanggal && /^[A-Za-z]+\s*,\s*[._\u2026\s]*$/i.test(t)) {
      const commaIdx = t.indexOf(",");
      const cityName = t.slice(0, commaIdx).trim();
      const newText = `${cityName}, ${tanggal}`;
      const patched = patchParaText(paras[i], newText);
      if (patched !== paras[i]) {
        docXml = docXml.replace(paras[i], patched);
        changed = true;
      }
    }

    if (nipPejabat && /^nip[\s.:]/i.test(t) && /[._\u2026]{3,}/.test(t)) {
      const patched = patchParaText(paras[i], `NIP. ${nipPejabat}`);
      if (patched !== paras[i]) {
        docXml = docXml.replace(paras[i], patched);
        changed = true;
      }
    }

    if (namaPejabat && /^[._\u2026\s]{4,}$/.test(t.replace(/\s/g, "")) && i > texts.length * 0.6) {
      const patched = patchParaText(paras[i], namaPejabat);
      if (patched !== paras[i]) {
        docXml = docXml.replace(paras[i], patched);
        changed = true;
      }
    }
  }

  if (changed) {
    zip.file("word/document.xml", docXml);
  }
}

function patchParaText(paraXml: string, newText: string): string {
  const runs = [...paraXml.matchAll(/<w:t[^>]*>([^<]*?)<\/w:t>/g)];
  if (runs.length === 0) return paraXml;
  let firstDone = false;
  return paraXml.replace(/<w:t([^>]*)>[^<]*<\/w:t>/g, (_m, attrs) => {
    if (!firstDone) {
      firstDone = true;
      return `<w:t${attrs}>${escapeXml(newText)}</w:t>`;
    }
    return `<w:t${attrs}></w:t>`;
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const res = await fetch(dataUrl);
  return res.arrayBuffer();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function extractNarrativesFromDocx(buf: ArrayBuffer): string[] {
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml")?.asText() ?? "";
  const texts = paragraphTexts(docXml);

  const SIGNER_KEYS = new Set(["tanggal_surat", "tanggal", "nama_pejabat", "jabatan_pejabat", "nip_pejabat"]);

  let lastFieldIdx = -1;
  let lastSignerFieldIdx = -1;
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i].trim();
    if (!t) continue;
    const placeholders = [...t.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((m) => m[1]);
    if (placeholders.length === 0) continue;
    const allSigner = placeholders.every((p) => SIGNER_KEYS.has(p));
    if (allSigner) {
      lastSignerFieldIdx = i;
    } else {
      lastFieldIdx = i;
    }
  }

  if (lastFieldIdx < 0) return [];

  const searchEnd = lastSignerFieldIdx > lastFieldIdx ? lastSignerFieldIdx : texts.length;

  let narrativeEnd = lastFieldIdx + 1;
  for (let i = searchEnd - 1; i > lastFieldIdx; i--) {
    const t = texts[i].trim();
    if (!t) continue;
    if (isSignerLine(t)) continue;
    if (t.length < 5) continue;
    narrativeEnd = i + 1;
    break;
  }

  const narratives: string[] = [];
  for (let i = lastFieldIdx + 1; i < narrativeEnd; i++) {
    const t = texts[i].trim();
    if (t.length > 5 && !isSignerLine(t)) narratives.push(t);
  }
  return narratives;
}

export function replaceNarrativesInDocx(
  buf: ArrayBuffer,
  originalNarratives: string[],
  editedNarratives: string[]
): ArrayBuffer {
  if (originalNarratives.length === 0) return buf;
  const zip = new PizZip(buf);
  let docXml = zip.file("word/document.xml")?.asText() ?? "";

  for (let i = 0; i < originalNarratives.length; i++) {
    const orig = originalNarratives[i];
    const edited = editedNarratives[i];
    if (orig === edited || edited === undefined) continue;

    const paraRe = new RegExp(`(<w:p\\b[\\s\\S]*?</w:p>)`, "g");
    let match: RegExpExecArray | null;
    while ((match = paraRe.exec(docXml)) !== null) {
      const paraXml = match[1];
      const runs = [...paraXml.matchAll(/<w:t[^>]*>([^<]*?)<\/w:t>/g)].map((x) => x[1]);
      const paraText = runs.join("").trim();
      if (paraText === orig) {
        const firstRunMatch = paraXml.match(/(<w:t[^>]*>)[^<]*?(<\/w:t>)/);
        if (firstRunMatch) {
          const newParaXml = paraXml
            .replace(/<w:r>\s*<w:rPr>[\s\S]*?<\/w:rPr>\s*<w:t[^>]*>[^<]*?<\/w:t>\s*<\/w:r>/g, "")
            .replace(/<w:r>\s*<w:t[^>]*>[^<]*?<\/w:t>\s*<\/w:r>/g, "");
          const rprMatch = paraXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
          const rprTag = rprMatch ? `<w:rPr>${rprMatch[1]}</w:rPr>` : "";
          const newRun = `<w:r>${rprTag}<w:t xml:space="preserve">${escapeXml(edited)}</w:t></w:r>`;
          const insertPoint = newParaXml.lastIndexOf("</w:p>");
          const rebuilt = newParaXml.slice(0, insertPoint) + newRun + newParaXml.slice(insertPoint);
          docXml = docXml.replace(paraXml, rebuilt);
        }
        break;
      }
    }
  }

  zip.file("word/document.xml", docXml);
  const out = zip.generate({ type: "arraybuffer" });
  return out;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function isSignerLine(t: string): boolean {
  const s = t.trim();
  if (/^nip[\s.:]/i.test(s)) return true;
  if (/^(an\.\s|a\.n\.\s)/i.test(s)) return true;
  if (/^(sekretaris|lurah\s|kepala\s|camat\s|plt\.\s|plh\.\s)/i.test(s)) return true;
  if (/^(hormat\s+kami|tertanda|diketahui|mengetahui|tembusan)/i.test(s)) return true;
  if (/^[A-Z][A-Z\s.,]+$/.test(s) && s.length < 40) return true;
  if (s.length < 10 && /^[\s._\-,]+$/.test(s)) return true;
  if (/^[A-Za-z]+\s*,\s*([._\u2026\s]*|\{\{[^}]+\}\})$/i.test(s)) return true;
  if (s.length < 60 && /[._\u2026]{4,}/.test(s) && !/:\s*$/.test(s)) {
    const textPart = s.replace(/[._\u2026\s,]+/g, "");
    if (textPart.length < 15) return true;
  }
  if (s.length < 40 && !s.includes(":") && /^[A-Z]/.test(s) && /[.,]/.test(s) && !/\s{2,}/.test(s)) {
    const words = s.split(/\s+/);
    if (words.length <= 5 && words.every(w => /^[A-Z]/.test(w))) return true;
  }
  return false;
}
