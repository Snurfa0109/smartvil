import { query } from "@/lib/db";
import { randomUUID } from "crypto";

export const TABLES = [
  "profiles",
  "residents",
  "news",
  "complaints",
  "requests",
  "letter_types",
  "agenda",
  "settings",
  "audit_logs",
] as const;

export type TableName = (typeof TABLES)[number];

const PUBLIC_READ = new Set<TableName>([
  "news",
  "complaints",
  "requests",
  "letter_types",
  "agenda",
  "settings",
  "residents",
]);

const ANON_INSERT = new Set<TableName>(["complaints", "requests"]);

const TABLE_KEYS: Record<string, string[]> = {
  profiles: ["id", "email", "display_name", "role", "active", "department", "permissions", "last_login"],
  residents: ["id", "nik", "nama", "gender", "address", "occupation", "birth_date", "status", "status_keluarga", "status_penduduk", "agama", "education"],
  news: ["id", "title", "category", "content", "date", "image_url", "views"],
  complaints: ["id", "ticket_code", "nama", "email", "phone", "category", "title", "message", "photo_url", "status", "admin_response"],
  requests: ["id", "ticket_code", "type", "type_name", "nama", "nik", "phone", "keperluan", "status", "form_data", "template_narrative", "admin_notes"],
  letter_types: ["id", "code", "name", "description", "requirements", "template_narrative", "active", "sort_order", "template_file_url", "template_data", "template_placeholders", "custom_fields"],
  agenda: ["id", "title", "category", "category_color", "schedule", "description", "time_location", "date_start", "date_end", "time_start", "time_end", "location", "active", "sort_order"],
  settings: ["key", "value"],
  audit_logs: ["id", "uid", "email", "display_name", "role", "action", "module", "detail"],
};

function selectColumns(table: string): string {
  if (table === "profiles") {
    return "id, email, display_name, role, active, department, permissions, last_login, created_at";
  }
  return "*";
}

function toDbValue(v: unknown): unknown {
  if (v === undefined) return null;
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return v;
}

export function isValidTable(t: string): t is TableName {
  return (TABLES as readonly string[]).includes(t);
}

export async function listRecords(
  table: TableName,
  opts: { select?: string[]; orderBy?: string; order?: "asc" | "desc"; limit?: number } = {}
): Promise<Record<string, unknown>[]> {
  const cols = opts.select && opts.select.length > 0 ? opts.select.map((c) => `\`${c}\``).join(", ") : selectColumns(table);
  let sql = `SELECT ${cols} FROM \`${table}\``;
  const allowed = TABLE_KEYS[table];
  if (opts.orderBy) {
    const orderCol = allowed && allowed.includes(opts.orderBy) ? opts.orderBy : "created_at";
    sql += ` ORDER BY \`${orderCol}\` ${opts.order === "asc" ? "ASC" : "DESC"}`;
  }
  if (opts.limit) sql += ` LIMIT ${Math.min(opts.limit, 1000)}`;
  return query<Record<string, unknown>[]>(sql);
}

export async function countRecords(table: TableName, where?: { column: string; value: unknown }): Promise<number> {
  let sql = `SELECT COUNT(*) AS c FROM \`${table}\``;
  const params: unknown[] = [];
  if (where) {
    const allowed = TABLE_KEYS[table];
    if (!allowed || !allowed.includes(where.column)) return 0;
    sql += ` WHERE \`${where.column}\` = ?`;
    params.push(toDbValue(where.value));
  }
  const rows = await query<{ c: number }[]>(sql, params);
  return Number(rows[0]?.c ?? 0);
}

export async function findRecords(
  table: TableName,
  where: { column: string; value: unknown },
  limit = 100
): Promise<Record<string, unknown>[]> {
  const allowed = TABLE_KEYS[table];
  if (!allowed || !allowed.includes(where.column)) return [];
  return query<Record<string, unknown>[]>(
    `SELECT ${selectColumns(table)} FROM \`${table}\` WHERE \`${where.column}\` = ? LIMIT ${Math.min(limit, 1000)}`,
    [toDbValue(where.value)]
  );
}

export async function findOne(table: TableName, where: { column: string; value: unknown }): Promise<Record<string, unknown> | null> {
  const allowed = TABLE_KEYS[table];
  if (!allowed || !allowed.includes(where.column)) return null;
  const rows = await findRecords(table, where, 1);
  return rows[0] ?? null;
}

export async function insertRecord(table: TableName, row: Record<string, unknown>): Promise<Record<string, unknown>> {
  const allowed = TABLE_KEYS[table];
  const payload: Record<string, unknown> = { ...row };
  if (table !== "settings" && !payload.id && allowed.includes("id")) {
    payload.id = randomUUID();
  }
  const keys = Object.keys(payload).filter((k) => allowed.includes(k));
  if (keys.length === 0) throw new Error("Tidak ada kolom valid untuk disimpan.");
  const cols = keys.map((k) => `\`${k}\``).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  await query(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, keys.map((k) => toDbValue(payload[k])));
  return { ...payload };
}

export async function updateRecord(
  table: TableName,
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const allowed = TABLE_KEYS[table];
  const idCol = table === "settings" ? "key" : "id";
  const keys = Object.keys(patch).filter((k) => allowed.includes(k) && k !== idCol);
  if (keys.length === 0) throw new Error("Tidak ada kolom valid untuk diubah.");
  const set = keys.map((k) => `\`${k}\` = ?`).join(", ");
  await query(`UPDATE \`${table}\` SET ${set} WHERE \`${idCol}\` = ?`, [...keys.map((k) => toDbValue(patch[k])), id]);
}

export async function deleteRecord(table: TableName, id: string): Promise<void> {
  const idCol = table === "settings" ? "key" : "id";
  await query(`DELETE FROM \`${table}\` WHERE \`${idCol}\` = ?`, [id]);
}

export function canPublicRead(table: TableName): boolean {
  return PUBLIC_READ.has(table);
}

export function canAnonInsert(table: TableName): boolean {
  return ANON_INSERT.has(table);
}
