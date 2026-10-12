import { apiList, apiInsert, apiUpdate, apiDelete } from "@/lib/api";

export interface LetterCustomFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "select";
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface LetterType {
  id?: string;
  code: string;
  name: string;
  desc: string;
  requirements: string[];
  templateNarrative?: string;
  active: boolean;
  order?: number;
  templateFileUrl?: string;
  templateStoragePath?: string;
  templateData?: string;
  templatePlaceholders?: string[];
  customFields?: LetterCustomFieldDef[];
}

export const DEFAULT_LETTER_TYPES: LetterType[] = [];

const ROW_STRIP_KEYS = new Set([
  "nomor_surat", "no_surat", "tanggal_surat", "tanggal",
  "nama_pejabat", "jabatan_pejabat", "nip_pejabat",
]);

export function rowToLetterType(row: Record<string, unknown>): LetterType {
  const rawFields = (row.custom_fields as LetterCustomFieldDef[]) || [];
  const cleanFields = rawFields.filter(
    (f) => !ROW_STRIP_KEYS.has(f.key.toLowerCase()) && !f.key.toLowerCase().startsWith("paragraf_")
  );
  return {
    id: String(row.id ?? ""),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    desc: String(row.description ?? ""),
    requirements: (row.requirements as string[]) || [],
    templateNarrative: String(row.template_narrative ?? ""),
    active: row.active === undefined ? true : Number(row.active) !== 0,
    order: Number(row.sort_order ?? 0),
    templateFileUrl: String(row.template_file_url ?? ""),
    templateStoragePath: "",
    templateData: String(row.template_data ?? ""),
    templatePlaceholders: (row.template_placeholders as string[]) || [],
    customFields: cleanFields,
  };
}

export function letterTypeToRow(lt: LetterType): Record<string, unknown> {
  return {
    code: lt.code,
    name: lt.name,
    description: lt.desc,
    requirements: lt.requirements,
    template_narrative: lt.templateNarrative ?? "",
    active: lt.active,
    sort_order: lt.order ?? 0,
    template_file_url: lt.templateFileUrl ?? "",
    template_data: lt.templateData ?? "",
    template_placeholders: lt.templatePlaceholders ?? [],
    custom_fields: lt.customFields ?? [],
  };
}

let cachedTypes: { data: LetterType[]; at: number } | null = null;
const TYPES_TTL_MS = 60_000;

export async function getLetterTypes(): Promise<LetterType[]> {
  if (cachedTypes && Date.now() - cachedTypes.at < TYPES_TTL_MS) {
    return cachedTypes.data;
  }
  try {
    const rows = await apiList("letter_types", { orderBy: "sort_order", order: "asc" });
    const types = rows.map(rowToLetterType);
    cachedTypes = { data: types, at: Date.now() };
    return types;
  } catch {
    return DEFAULT_LETTER_TYPES;
  }
}

export function invalidateLetterTypes(): void {
  cachedTypes = null;
}

export async function upsertLetterType(lt: LetterType): Promise<void> {
  const row = letterTypeToRow(lt);
  if (lt.id) {
    await apiUpdate("letter_types", lt.id, row);
  } else {
    await apiInsert("letter_types", row);
  }
  invalidateLetterTypes();
}

export async function deleteLetterType(id: string): Promise<void> {
  await apiDelete("letter_types", id);
  invalidateLetterTypes();
}
