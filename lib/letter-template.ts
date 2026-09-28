import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export type CustomFieldType = "text" | "number" | "date" | "textarea";

export interface LetterCustomField {
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
}

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

// Field bawaan yang sudah ada di form (tidak perlu diisi ulang oleh user)
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

export function prettifyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function guessFieldType(key: string): CustomFieldType {
  const k = key.toLowerCase();
  if (k.includes("tanggal") || k.includes("tgl") || k.includes("lahir") || k.includes("date"))
    return "date";
  if (k.includes("nik") || k.includes("nomor") || k.includes("no_") || k.includes("jumlah") || k.includes("tahun") || k.includes("umur"))
    return "text";
  if (k.includes("alamat") || k.includes("keperluan") || k.includes("keterangan") || k.includes("alasan"))
    return "textarea";
  return "text";
}

/** Scan {{key}} di isi, header, dan footer (Word menyimpan ketiganya terpisah). */
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

/**
 * Deteksi pola label/nomor/tanggal pada template polos dan sisipkan {{key}}
 * tanpa mengubah layout. Label kembar dibedakan otomatis (_suami/_istri/_2).
 */
export async function smartTemplateFromStaticDocx(
  file: File | ArrayBuffer
): Promise<{ buffer: ArrayBuffer; placeholders: string[]; injected: { label: string; key: string }[] }> {
  const buf =
    file instanceof ArrayBuffer ? file.slice(0) : await (file as File).arrayBuffer();
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml")?.asText() ?? "";
  const paraMatches = docXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const texts = paragraphTexts(docXml);

  const injected: { label: string; key: string }[] = [];
  const usedKeys = new Set<string>();
  const labelHits: { idx: number; key: string }[] = [];
  let section: "suami" | "istri" | "" = "";

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

  const newParas = paraMatches.map((paraXml, idx) => {
    const text = texts[idx] || "";

    if (/nama\s+suami/i.test(text)) section = "suami";
    else if (/nama\s+istri/i.test(text)) section = "istri";

    if (/nomor\s*:|470\s*\//i.test(text) && /470|pemt|nomor/i.test(text)) {
      const key = uniqueKey("nomor_surat");
      injected.push({ label: "Nomor Surat", key });
      return paraXml.replace(/<\/w:p>\s*$/, `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve"> {{${key}}}</w:t></w:r></w:p>`);
    }

    if (/\b(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b/i.test(text) && text.trim().length < 60) {
      const key = uniqueKey("tanggal_surat");
      injected.push({ label: "Tanggal Surat", key });
      return paraXml.replace(/<\/w:p>\s*$/, `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve"> {{${key}}}</w:t></w:r></w:p>`);
    }

    const labelMatch =
      text.match(/^\s*(.+?)\s*:\s*$/) ||
      text.match(/^\s*(.+?)\s*[._]{3,}\s*$/);
    if (labelMatch) {
      const rawLabel = labelMatch[1].replace(/\s+/g, " ").replace(/[._\s]+$/, "").trim();
      if (rawLabel.length >= 2 && rawLabel.length <= 40) {
        let base = normalizeLabelToKey(rawLabel);
        if (section === "suami" && !/suami|istri/.test(base)) base = `${base}_suami`;
        if (section === "istri" && !/suami|istri/.test(base)) base = `${base}_istri`;
        const key = uniqueKey(base);
        const prettySection = section ? ` (${section})` : "";
        injected.push({ label: `${rawLabel}${prettySection}`, key });
        labelHits.push({ idx, key });
        return paraXml.replace(/<\/w:p>\s*$/, `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve"> {{${key}}}</w:t></w:r></w:p>`);
      }
    }
    return paraXml;
  });

  // Baris label berurutan digabung jadi tabel tanpa garis agar titik dua sejajar.
  mergeLabelRowsToTables(newParas, labelHits);

  const newXml = docXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, () => newParas.shift() as string);
  zip.file("word/document.xml", newXml);
  normalizeScannedLetter(zip, injected.map((i) => i.key));
  const outBuffer = zip.generate({ type: "arraybuffer" }) as ArrayBuffer;
  const placeholders = injected.map((i) => i.key).sort();
  return { buffer: outBuffer, placeholders, injected };
}

/**
 * Baris "Label : {{nilai}}" berurutan digabung jadi satu tabel tanpa garis
 * agar titik dua sejajar. Run nilai asli dipertahankan.
 */
function mergeLabelRowsToTables(newParas: string[], labelHits: { idx: number; key: string }[]): void {
  if (labelHits.length === 0) return;
  const groups: number[][] = [];
  for (const h of labelHits) {
    const last = groups[groups.length - 1];
    if (last && h.idx === last[last.length - 1] + 1) last.push(h.idx);
    else groups.push([h.idx]);
  }
  const keyOf = (idx: number) => labelHits.find((h) => h.idx === idx)?.key ?? "";
  for (const group of groups) {
    const rows = group
      .map((idx) => {
        const para = newParas[idx];
        const key = keyOf(idx);
        const runs = para.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
        const valueRuns = runs.filter((r) => r.includes(`{{${key}}}`));
        const labelRuns = runs.filter((r) => !r.includes(`{{${key}}}`));
        const labelText = labelRuns
          .map((r) => [...r.matchAll(/<w:t\b[^>]*>([^<]*?)<\/w:t>/g)].map((m) => m[1]).join(""))
          .join("")
          .replace(/\s+/g, " ")
          .replace(/\s*:\s*$/, "")
          .trim();
        if (!labelText || valueRuns.length === 0) return "";
        const cellP = (inner: string) =>
          `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto" w:after="0"/></w:pPr>${inner}</w:p>`;
        const run12 = (text: string) =>
          `<w:r><w:rPr>${TNR_FONTS}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXmlText(text)}</w:t></w:r>`;
        const tc = (w: number, inner: string) =>
          `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${inner}</w:tc>`;
        return `<w:tr>${tc(4200, cellP(run12(labelText)))}${tc(500, cellP(run12(":")))}${tc(4300, cellP(valueRuns.join("")))}</w:tr>`;
      })
      .filter(Boolean);
    if (rows.length === 0) continue;
    const nil = (n: string) => `<w:${n} w:val="nil" w:sz="0" w:space="0" w:color="auto"/>`;
    newParas[group[0]] =
      `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${nil("top")}${nil("left")}${nil("bottom")}${nil("right")}${nil("insideH")}${nil("insideV")}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>` +
      `<w:tblGrid><w:gridCol w:w="4200"/><w:gridCol w:w="500"/><w:gridCol w:w="4300"/></w:tblGrid>${rows.join("")}</w:tbl>`;
    for (let i = 1; i < group.length; i++) newParas[group[i]] = "";
  }
}

// Standar baku surat kelurahan (sesuai permintaan admin):
// kertas A4, font Times New Roman, judul kop 20pt, alamat kop 11pt miring,
// isi 12pt, spasi 1.15.
const TNR_FONTS = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>`;
const A4_SECTPR = `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/></w:sectPr>`;

function escapeXmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Times New Roman + ukuran untuk semua run; extraTag ditambah bila belum ada. */
function forceRunFonts(xml: string, halfPt: number, extraTag = ""): string {
  const extraName = extraTag.match(/w:(\w+)/)?.[1] ?? "";
  return xml
    .replace(/<w:rPr\s*\/>/g, `<w:rPr>${TNR_FONTS}<w:sz w:val="${halfPt}"/><w:szCs w:val="${halfPt}"/>${extraTag}</w:rPr>`)
    .replace(/<w:rPr\b[^>]*>([\s\S]*?)<\/w:rPr>/g, (full, inner: string) => {
      let clean = inner
        .replace(/<w:rFonts\b[^>]*\/>/g, "")
        .replace(/<w:rFonts\b[^>]*>[\s\S]*?<\/w:rFonts>/g, "")
        .replace(/<w:sz\b[^>]*\/>/g, "")
        .replace(/<w:szCs\b[^>]*\/>/g, "");
      const needExtra = extraTag && extraName && !new RegExp(`<w:${extraName}[\\s>/]`).test(clean);
      return full.replace(inner, `${TNR_FONTS}<w:sz w:val="${halfPt}"/><w:szCs w:val="${halfPt}"/>${needExtra ? extraTag : ""}${clean}`);
    });
}

/**
 * Enter 1x di batas blok (sesudah nomor, sekitar tabel data, sebelum tanggal,
 * antar paragraf penutup) dan 2x sebelum nama penandatangan. Sisanya dibuang.
 */
function normalizeSeparators(docXml: string, nomorKey?: string, tanggalKey?: string): string {
  const bodyMatch = docXml.match(/<w:body\b[^>]*>([\s\S]*)<\/w:body>/);
  if (!bodyMatch) return docXml;
  const nodes = bodyMatch[1].match(/<w:tbl\b[\s\S]*?<\/w:tbl>|<w:p\b[\s\S]*?<\/w:p>|<w:sectPr\b(?:[^>]*\/>|[^>]*>[\s\S]*?<\/w:sectPr>)/g) || [];
  const isPara = (n: string) => /^<w:p[\s>]/.test(n);
  const isEmptyPara = (n: string) => {
    if (!isPara(n)) return false;
    if (/<w:drawing|<w:pict|<v:|w:hyperlink|w:bookmarkStart/.test(n)) return false;
    const text = [...n.matchAll(/<w:t\b[^>]*>([^<]*?)<\/w:t>/g)].map((m) => m[1]).join("").replace(/\s+/g, "");
    return !text;
  };
  const content = nodes.filter((n) => !isEmptyPara(n));
  const BLANK = `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto" w:after="0"/></w:pPr></w:p>`;
  const nomorIdx = nomorKey ? content.findIndex((n) => n.includes(`{{${nomorKey}}}`)) : -1;
  const tanggalIdx = tanggalKey ? content.findIndex((n) => n.includes(`{{${tanggalKey}}}`)) : -1;
  const tableIdxs = content.map((n, i) => (/^<w:tbl[\s>]/.test(n) ? i : -1)).filter((i) => i >= 0);
  // Sisipkan dari indeks terbesar agar indeks lain tidak bergeser
  const insertAfter: number[] = [];
  const insertBefore: number[] = [];
  if (nomorIdx >= 0) insertAfter.push(nomorIdx);
  for (const t of tableIdxs) insertAfter.push(t);
  if (tableIdxs.length > 0) insertBefore.push(tableIdxs[0]);
  if (tanggalIdx >= 0) insertBefore.push(tanggalIdx);
  // Paragraf penutup berurutan dipisah 1 baris kosong.
  const closingStart = tableIdxs.length > 0 ? tableIdxs[tableIdxs.length - 1] : nomorIdx;
  const closingEnd = tanggalIdx >= 0 ? tanggalIdx : content.length;
  for (let i = closingEnd - 1; i > closingStart + 1; i--) {
    if (isPara(content[i]) && isPara(content[i - 1])) insertBefore.push(i);
  }
  // 2 baris kosong sebelum nama penandatangan (ruang tanda tangan).
  const nipIdx = content.findIndex((n) => isPara(n) && /NIP[\s.:]/i.test(n));
  if (nipIdx > 1) {
    insertBefore.push(nipIdx - 1);
    insertBefore.push(nipIdx - 1);
  }
  type Op = { at: number; kind: "before" | "after" };
  const ops: Op[] = [
    ...insertAfter.map((at) => ({ at, kind: "after" as const })),
    ...insertBefore.map((at) => ({ at, kind: "before" as const })),
  ].sort((a, b) => b.at - a.at);
  for (const op of ops) {
    if (op.kind === "after") content.splice(op.at + 1, 0, BLANK);
    else content.splice(op.at, 0, BLANK);
  }
  // Batas berimpitan boleh dobel maksimal 2 baris.
  const deduped: string[] = [];
  let blankRun = 0;
  for (const n of content) {
    if (n === BLANK) {
      blankRun++;
      if (blankRun > 2) continue;
    } else {
      blankRun = 0;
    }
    deduped.push(n);
  }
  // Rakit ulang HANYA isi body; deklarasi XML + <w:document> dipertahankan utuh.
  const bodyInner = bodyMatch[1];
  const head = docXml.slice(0, docXml.indexOf(bodyInner));
  const tail = docXml.slice(docXml.indexOf(bodyInner) + bodyInner.length);
  return `${head}${deduped.join("")}${tail}`;
}

export function normalizeScannedLetter(zip: PizZip, injectedKeys: string[]): void {
  styleHeaderParts(zip);

  const docXml = zip.file("word/document.xml")?.asText();
  if (docXml) {
    let xml = docXml;
    xml = rebuildNomorTanggalParagraphs(xml, injectedKeys);
    const nomorKey = injectedKeys.find((k) => k === "nomor_surat") ?? injectedKeys.find((k) => k.includes("nomor"));
    const tanggalKey = injectedKeys.find((k) => k === "tanggal_surat") ?? injectedKeys.find((k) => k.includes("tanggal"));
    xml = normalizeSeparators(xml, nomorKey, tanggalKey);
    xml = forceRunFonts(xml, 24);
    xml = xml.replace(/<w:t\b([^>]*)>([^<]*?)<\/w:t>/g, (full, attrs: string, text: string) => {
      if (text.indexOf("{{") !== -1) return full;
      return `<w:t${attrs}>${text.replace(/(\S)[ \t]{2,}(\S)/g, "$1 $2")}</w:t>`;
    });
    xml = xml
      .replace(/<w:spacing\b[^>]*\/>/g, `<w:spacing w:line="276" w:lineRule="auto" w:after="0"/>`)
      .replace(/<w:spacing\b[^>]*>[\s\S]*?<\/w:spacing>/g, `<w:spacing w:line="276" w:lineRule="auto" w:after="0"/>`);
    if (/<w:sectPr[\s>]/.test(xml)) {
      xml = xml.replace(/(<w:sectPr\b[^>]*>[\s\S]*?<w:pgSz\b)[^>]*\/>/, `$1 w:w="11906" w:h="16838"/>`);
      if (/<w:pgMar\b/.test(xml)) {
        xml = xml.replace(/<w:pgMar\b[^>]*\/>/, `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>`);
      } else {
        xml = xml.replace(/(<w:pgSz\b[^>]*\/>)/, `$1<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>`);
      }
    } else {
      xml = xml.replace(/<\/w:body>/, `${A4_SECTPR}</w:body>`);
    }
    zip.file("word/document.xml", xml);
  }

  // Default dokumen: Times 12pt + spasi 1.15
  const stylesXml = zip.file("word/styles.xml")?.asText();
  if (stylesXml) {
    let s = stylesXml;
    s = s.replace(/(<w:rPrDefault>\s*<w:rPr>)([\s\S]*?)(<\/w:rPr>)/, (_f, open: string, inner: string, close: string) => {
      const clean = inner
        .replace(/<w:rFonts\b[^>]*\/>/g, "")
        .replace(/<w:sz\b[^>]*\/>/g, "")
        .replace(/<w:szCs\b[^>]*\/>/g, "");
      return `${open}${TNR_FONTS}<w:sz w:val="24"/><w:szCs w:val="24"/>${clean}${close}`;
    });
    s = s
      .replace(/<w:spacing\b[^>]*\/>/g, `<w:spacing w:after="0" w:line="276" w:lineRule="auto"/>`)
      .replace(/<w:spacing\b[^>]*>[\s\S]*?<\/w:spacing>/g, `<w:spacing w:after="0" w:line="276" w:lineRule="auto"/>`);
    if (s !== stylesXml) zip.file("word/styles.xml", s);
  }
}

/**
 * Bangun ulang paragraf nomor/tanggal bersih ("Nomor: {{nomor_surat}}",
 * "Kota, {{tanggal_surat}}") agar tidak dobel dengan teks template lama.
 */
function rebuildNomorTanggalParagraphs(docXml: string, injectedKeys: string[]): string {
  const nomorKey = injectedKeys.find((k) => k === "nomor_surat") ?? injectedKeys.find((k) => k.includes("nomor"));
  const tanggalKey = injectedKeys.find((k) => k === "tanggal_surat") ?? injectedKeys.find((k) => k.includes("tanggal"));
  if (!nomorKey && !tanggalKey) return docXml;
  const paras = docXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const rebuilt = paras.map((para) => {
    const plain = [...para.matchAll(/<w:t\b[^>]*>([^<]*?)<\/w:t>/g)].map((m) => m[1]).join("");
    const openTag = para.match(/<w:p\b[^>]*>/)?.[0] ?? "<w:p>";
    const pPr = para.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/)?.[0] ?? para.match(/<w:pPr\b[^>]*\/>/)?.[0] ?? "";
    const run = (text: string) =>
      `<w:r><w:rPr>${TNR_FONTS}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXmlText(text)}</w:t></w:r>`;
    if (nomorKey && plain.includes(`{{${nomorKey}}}`)) {
      return `${openTag}${pPr}${run(`Nomor: {{${nomorKey}}}`)}</w:p>`;
    }
    if (tanggalKey && plain.includes(`{{${tanggalKey}}}`)) {
      const noTag = plain.replace(/\{\{[\s\S]*?\}\}/g, " ");
      const cityMatch = noTag.match(/^(.*?)[`,]?\s*\d{1,2}\s+\w+/);
      const city = (cityMatch ? cityMatch[1] : noTag).replace(/\s+/g, " ").trim();
      // Tanggal surat rata kanan, sejajar di atas blok tanda tangan
      let datePPr = pPr;
      if (/<w:jc\b/.test(datePPr)) {
        datePPr = datePPr.replace(/<w:jc\b[^>]*\/>/g, `<w:jc w:val="right"/>`).replace(/<w:jc\b[^>]*>[\s\S]*?<\/w:jc>/g, `<w:jc w:val="right"/>`);
      } else if (/<w:pPr\b[^>]*\/>/.test(datePPr)) {
        datePPr = datePPr.replace(/<w:pPr\b[^>]*\/>/, `<w:pPr><w:jc w:val="right"/></w:pPr>`);
      } else if (/<w:pPr\b/.test(datePPr)) {
        datePPr = datePPr.replace(/<\/w:pPr>/, `<w:jc w:val="right"/></w:pPr>`);
      } else {
        datePPr = `<w:pPr><w:jc w:val="right"/></w:pPr>`;
      }
      return `${openTag}${datePPr}${run(city ? `${city}, {{${tanggalKey}}}` : `{{${tanggalKey}}}`)}</w:p>`;
    }
    return para;
  });
  return docXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, () => rebuilt.shift() as string);
}

/**
 * Kop dibiarkan natural tanpa tabel; wrapNone logo diubah jadi wrapSquare
 * agar tampil di preview (renderer menggambar wrapNone sebagai kotak 0px).
 * Judul kop 20pt tebal, alamat 11pt miring.
 */
function styleHeaderParts(zip: PizZip): void {
  const partNames = Object.keys(zip.files).filter((n) => /^word\/header\d*\.xml$/.test(n));
  for (const name of partNames) {
    const original = zip.file(name)?.asText();
    if (!original) continue;
    let xml = original;
    xml = xml.replace(
      /<wp:anchor\b[^>]*>([\s\S]*?)<\/wp:anchor>/g,
      (full, inner: string) => {
        if (inner.indexOf("<pic:pic") === -1) return full;
        if (!/<wp:wrapNone\b/.test(inner)) return full;
        return full.replace(
          /<wp:wrapNone\b[^>]*\/>/,
          `<wp:wrapSquare wrapText="bothSides" distT="0" distB="0" distL="114300" distR="114300"/>`
        );
      }
    );
    const paras = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
    const styled = paras.map((para) => {
      const text = [...para.matchAll(/<w:t\b[^>]*>([^<]*?)<\/w:t>/g)].map((m) => m[1]).join("");
      if (!text.trim()) return para;
      const isTitle = /PEMERINTAH|KECAMATAN|KELURAHAN|KANTOR|DESA/.test(text.toUpperCase());
      return forceRunFonts(para, isTitle ? 40 : 22, isTitle ? "<w:b/>" : "<w:i/>");
    });
    const rebuilt = xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, () => styled.shift() as string);
    if (rebuilt !== original) zip.file(name, rebuilt);
  }
}

/** Placeholder menjadi field form, kecuali yang sudah terisi otomatis. */
export function placeholdersToCustomFields(
  placeholders: string[],
  existing: LetterCustomField[] = []
): LetterCustomField[] {
  const existingMap = new Map(existing.map((f) => [f.key, f]));
  return placeholders
    .filter((p) => !BUILTIN_FIELDS.has(p.toLowerCase()))
    .map((key) => {
      const prev = existingMap.get(key);
      return {
        key,
        label: prev?.label ?? prettifyKey(key),
        type: prev?.type ?? guessFieldType(key),
        required: prev?.required ?? true,
      };
    });
}

/** Data contoh pengisi simulasi preview. */
export function buildSampleData(
  placeholders: string[],
  customFields: { key: string; label: string }[] = []
): Record<string, string> {
  const labelMap = new Map(customFields.map((f) => [f.key, f.label]));
  const data: Record<string, string> = {};
  for (const key of placeholders) {
    const k = key.toLowerCase();
    if (k.includes("nomor_surat") || k === "no_surat" || k === "nomorsurat")
      data[key] = "470 / 042 / PEM-SMV / II / 2026";
    else if (k.includes("tanggal_surat") || k === "tanggal")
      data[key] = "27 Februari 2026";
    else if (k.includes("nama_suami")) data[key] = "BUDI SANTOSO";
    else if (k.includes("nama_istri")) data[key] = "SITI AMINAH";
    else if (k === "nama" || k.includes("nama_pejabat")) data[key] = "BUDI SANTOSO";
    else if (k.includes("nik")) data[key] = "3673050101010001";
    else if (k.includes("tempat") && k.includes("lahir")) data[key] = "Serang, 12 Mei 1990";
    else if (k.includes("tgl") || k.includes("lahir") || k.includes("tanggal")) data[key] = "12 Mei 1990";
    else if (k.includes("kelamin")) data[key] = k.includes("istri") ? "Perempuan" : "Laki-laki";
    else if (k.includes("bangsa") || k.includes("agama")) data[key] = "Indonesia / Islam";
    else if (k.includes("pekerjaan")) data[key] = "Wiraswasta";
    else if (k.includes("alamat")) data[key] = "Kp. Munding Jalu RT 02 RW 05, Banjar Agung";
    else if (k.includes("status")) data[key] = "Kawin";
    else if (k.includes("phone") || k.includes("hp") || k.includes("wa")) data[key] = "081315053901";
    else if (k.includes("keperluan")) data[key] = "Pengajuan tunjangan keluarga";
    else if (k.includes("nip")) data[key] = "19780512 200501 1 004";
    else if (k.includes("jabatan")) data[key] = "Lurah Banjar Agung";
    else data[key] = `Contoh ${labelMap.get(key) || prettifyKey(key)}`;
  }
  return data;
}

/** Isi template dengan data contoh untuk simulasi. */
export async function generateSampleFilledDocx(
  templateBuffer: ArrayBuffer,
  placeholders: string[],
  customFields: { key: string; label: string }[] = []
): Promise<Blob> {
  const data = buildSampleData(placeholders, customFields);
  data.nama_pejabat = "RAHMI, SKM.M.Si";
  data.jabatan_pejabat = "Sekretaris Kelurahan";
  data.nip_pejabat = "19780623 200501 2 007";
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

/** Isi template dengan data dan unduh sebagai .docx dari file yang sama. */
export async function generateFilledDocx(
  templateBuffer: ArrayBuffer,
  data: Record<string, string>
): Promise<Blob> {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
    // Template kita memakai kurung kurawal ganda {{field}} (bukan default {field})
    delimiters: { start: "{{", end: "}}" },
  });
  doc.render(data);
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
