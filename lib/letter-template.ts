import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

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

const DROPDOWN_FIELDS: Record<string, string[]> = {
  jenis_kelamin: ["Laki-laki", "Perempuan"],
  kelamin: ["Laki-laki", "Perempuan"],
  agama: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"],
  bangsa_agama: ["Indonesia / Islam", "Indonesia / Kristen", "Indonesia / Katolik", "Indonesia / Hindu", "Indonesia / Buddha", "Indonesia / Konghucu"],
  status_perkawinan: ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"],
  status: ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"],
  kewarganegaraan: ["WNI", "WNA"],
  pendidikan: ["Tidak/Belum Sekolah", "SD/Sederajat", "SMP/Sederajat", "SMA/Sederajat", "D1/D2/D3", "S1/D4", "S2", "S3"],
};

export const BUILTIN_FIELDS = new Set([
  "nama",
  "nik",
  "phone",
  "no_hp",
  "no_wa",
  "whatsapp",
  "keperluan",
  "tanggal",
  "tanggal_surat",
  "nomor_surat",
  "no_surat",
  "nama_pejabat",
  "jabatan_pejabat",
  "nip_pejabat",
]);

const ADMIN_ONLY_FIELDS = new Set([
  "nomor_surat",
  "no_surat",
  "tanggal_surat",
  "tanggal",
  "nama_pejabat",
  "jabatan_pejabat",
  "nip_pejabat",
]);

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
  const partNames = Object.keys(zip.files).filter((n) =>
    /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)
  );
  for (const name of partNames) {
    let xml = zip.file(name)?.asText() ?? "";
    xml = xml.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (_full, attrs: string, text: string) => {
      const cleaned = text.replace(/\s*\{\{[a-zA-Z0-9_]+\}\}/g, "");
      return `<w:t${attrs}>${cleaned}</w:t>`;
    });
    zip.file(name, xml);
  }
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

// --- Auto-scan: deteksi field isian dari template Word polos ---

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

    if (/nomor\s*:/i.test(trimmed) && /\d{3}/.test(trimmed) && trimmed.length < 80) {
      const key = uniqueKey("nomor_surat");
      injected.push({ label: "Nomor Surat", key });
      return appendRun(paraXml, rprTag, key);
    }

    if (idx >= signerZoneStart) return paraXml;
    if (trimmed.length > 80) return paraXml;
    if (isNarrativeLine(trimmed)) return paraXml;
    if (isHeaderOrTitle(trimmed)) return paraXml;

    const label = extractLabel(trimmed);
    if (label && label.length >= 2 && label.length <= 45) {
      let base = normalizeLabelToKey(label);
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

function extractLabel(trimmed: string): string | null {
  const m =
    trimmed.match(/^(.+?)\s*:\s*$/) ||
    trimmed.match(/^(.+?)\s+[._\u2026]{3,}\s*$/) ||
    trimmed.match(/^(.+?)\s{2,}[._\u2026]{2,}\s*$/);
  if (!m) return null;
  return m[1].replace(/\s+/g, " ").replace(/[._\u2026\s]+$/, "").trim();
}

function isNarrativeLine(trimmed: string): boolean {
  return /^(yang\s|demikian\s|dengan\s|bahwa\s|benar\s|menerangkan\s|dikeluarkan\s|berdasarkan\s|sebagaimana\s|menimbang\s|mengingat\s|memperhatikan\s)/i.test(trimmed);
}

function isHeaderOrTitle(trimmed: string): boolean {
  if (/^(an\.\s|a\.n\.\s|sekretaris|lurah\s|kepala\s|camat\s|plt\.\s|plh\.\s)/i.test(trimmed)) return true;
  if (/^nip[\s.:]/i.test(trimmed)) return true;
  if (/^surat\s+(keterangan|pengantar)/i.test(trimmed) && !/[._]{3,}/.test(trimmed)) return true;
  if (/^pemerintah\s/i.test(trimmed)) return true;
  if (/^(kecamatan|kelurahan|desa|kabupaten|kota|provinsi)\s/i.test(trimmed)) return true;
  if (/^(jl\.|jalan\s|telp|email|website|fax)/i.test(trimmed)) return true;
  if (/^(hormat\s+kami|tertanda|diketahui|mengetahui|tembusan)/i.test(trimmed)) return true;
  const upper = trimmed.replace(/\s+/g, "");
  if (upper.length > 4 && upper === upper.toUpperCase() && !/[.:_]/.test(upper)) return true;
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
    if (/^(an\.\s|a\.n\.\s|sekretaris|lurah\s|kepala\s|camat\s|hormat|tertanda|mengetahui|diketahui)/i.test(t)) {
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
    const m = t.match(/^nama\s+(.+?)\s*:?\s*$/i);
    if (m && m[1].length <= 20) {
      sectionHeaders.push({ idx: i, name: normalizeLabelToKey(m[1]) });
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

// --- Field & data helpers ---

export function placeholdersToCustomFields(
  placeholders: string[],
  existing: LetterCustomField[] = [],
  injected: { key: string; label: string; defaultValue?: string }[] = []
): LetterCustomField[] {
  const existingMap = new Map(existing.map((f) => [f.key, f]));
  const injectedMap = new Map(injected.map((i) => [i.key, i]));
  return placeholders
    .filter((p) => !ADMIN_ONLY_FIELDS.has(p.toLowerCase()))
    .map((key) => {
      const prev = existingMap.get(key);
      const inj = injectedMap.get(key);
      const type = prev?.type ?? guessFieldType(key);
      const options = type === "select" ? (prev?.options ?? getDropdownOptions(key) ?? []) : undefined;
      const defaultValue = prev?.defaultValue ?? inj?.defaultValue;
      const isParagraf = key.startsWith("paragraf_");
      return {
        key,
        label: prev?.label ?? inj?.label ?? prettifyKey(key),
        type: isParagraf ? "textarea" as CustomFieldType : type,
        required: prev?.required ?? !isParagraf,
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
    else if (k === "nama" || k === "nama_lengkap") data[key] = "CONTOH NAMA LENGKAP";
    else if (k.includes("nama_pejabat")) data[key] = "NAMA PEJABAT";
    else if (k.includes("nik")) data[key] = "3673050101010001";
    else if (k.includes("tempat") && k.includes("lahir")) data[key] = "Serang, 12 Mei 1990";
    else if (k.includes("tgl") || k.includes("lahir") || k.includes("tanggal")) data[key] = "12 Mei 1990";
    else if (k.includes("kelamin")) data[key] = "Laki-laki";
    else if (k.includes("bangsa") || k.includes("agama")) data[key] = "Indonesia / Islam";
    else if (k.includes("pekerjaan")) data[key] = "Wiraswasta";
    else if (k.includes("alamat")) data[key] = "Jl. Contoh RT 01 RW 02";
    else if (k.includes("status")) data[key] = "Kawin";
    else if (k.includes("phone") || k.includes("hp") || k.includes("wa")) data[key] = "08123456789";
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
  return doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
  const signerStart = findSignerZoneStart(texts);

  let lastFieldIdx = -1;
  for (let i = 0; i < texts.length && i < signerStart; i++) {
    const t = texts[i].trim();
    if (!t) continue;
    if (extractLabel(t) && t.length <= 80) lastFieldIdx = i;
    if (/nomor\s*:/i.test(t) && /\d{3}/.test(t)) lastFieldIdx = i;
  }

  const narratives: string[] = [];
  for (let i = lastFieldIdx + 1; i < signerStart; i++) {
    const t = texts[i].trim();
    if (t.length > 20) narratives.push(t);
  }
  return narratives;
}
