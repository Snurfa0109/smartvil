/**
 * @layer Backend (API Route)
 * @role Endpoint CRUD generik tabel sistem SmartVil
 * @access Public (Tabel Tertentu) / Terautentikasi (Admin)
 * @description Menyediakan operasi CRUD data master dengan pengecekan perizinan dan otentikasi.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  isValidTable,
  listRecords,
  countRecords,
  findRecords,
  findOne,
  insertRecord,
  updateRecord,
  deleteRecord,
  canPublicRead,
  canAnonInsert,
  NotFoundError,
} from "@/lib/records";
import { getSessionProfile, requireSuperAdmin } from "@/lib/auth-server";

const SENSITIVE_KEY_RE = /key|secret|password/i;

function redactSettingsRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    let parsed: unknown = row.value;
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch { return row; }
    }
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (!SENSITIVE_KEY_RE.test(k)) cleaned[k] = v;
      }
      return { ...row, value: JSON.stringify(cleaned) };
    }
    return row;
  });
}

const ANON_ALLOWED_FIELDS: Record<string, string[]> = {
  requests: ["ticket_code", "type", "type_name", "nama", "nik", "phone", "keperluan", "form_data"],
  complaints: ["ticket_code", "nama", "phone", "email", "category", "title", "message", "photo_url"],
};

const TABLE_PERMISSION: Record<string, string> = {
  news: "berita",
  residents: "penduduk",
  complaints: "pengaduan",
  requests: "layanan",
  agenda: "agenda",
  letter_types: "layanan",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table") || "";
    const op = searchParams.get("op") || "list";
    if (!isValidTable(table)) {
      return NextResponse.json({ error: "Tabel tidak dikenal." }, { status: 400 });
    }

    const session = await getSessionProfile(req);
    const isAdmin = !!session;

    if (op === "count") {
      if (!canPublicRead(table) && !isAdmin) {
        return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
      }
      const column = searchParams.get("column");
      const value = searchParams.get("value");
      const count = column ? await countRecords(table, { column, value }) : await countRecords(table);
      return NextResponse.json({ count });
    }

    if (op === "find") {
      if (!canPublicRead(table) && !isAdmin) {
        return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
      }
      const column = searchParams.get("column") || "id";
      const value = searchParams.get("value") || "";
      const limit = Number(searchParams.get("limit") || 100);
      const data = await findRecords(table, { column, value }, limit);
      return NextResponse.json({ data: !isAdmin && table === "settings" ? redactSettingsRows(data) : data });
    }

    if (op === "get") {
      const id = searchParams.get("id") || "";
      const idCol = table === "settings" ? "key" : "id";
      if (!canPublicRead(table) && !isAdmin) {
        return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
      }
      const data = await findOne(table, { column: idCol, value: id });
      return NextResponse.json({ data: !isAdmin && table === "settings" && data ? redactSettingsRows([data])[0] : data });
    }

    if (!canPublicRead(table) && !isAdmin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const data = await listRecords(table, {
      orderBy: searchParams.get("orderBy") || undefined,
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
      limit: Number(searchParams.get("limit") || 200),
    });
    return NextResponse.json({ data: !isAdmin && table === "settings" ? redactSettingsRows(data) : data });
  } catch (err) {
    return NextResponse.json({ error: "Gagal membaca data." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { table, row } = await req.json();
    if (!isValidTable(table) || !row) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
    }
    if ((table === "requests" || table === "complaints") && row.nik && !/^\d{16}$/.test(row.nik)) {
      return NextResponse.json({ error: "NIK harus 16 digit angka." }, { status: 400 });
    }
    const session = await getSessionProfile(req);
    if (!session && !canAnonInsert(table)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    if ((table === "profiles" || table === "audit_logs") && session?.role !== "superadmin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    if (!session && canAnonInsert(table)) {
      const allowed = ANON_ALLOWED_FIELDS[table];
      if (allowed) {
        const sanitized: Record<string, unknown> = {};
        for (const key of allowed) {
          if (key in row) sanitized[key] = row[key];
        }
        sanitized.status = "pending";
        const data = await insertRecord(table, sanitized);
        return NextResponse.json({ data });
      }
    }
    const data = await insertRecord(table, row);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { table, id, patch } = await req.json();
    if (!isValidTable(table) || !id || !patch) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
    }
    if ((table === "requests" || table === "complaints") && patch.nik && !/^\d{16}$/.test(patch.nik)) {
      return NextResponse.json({ error: "NIK harus 16 digit angka." }, { status: 400 });
    }
    const session = await getSessionProfile(req);
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    if ((table === "profiles" || table === "audit_logs" || table === "settings") && session.role !== "superadmin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const requiredPerm = TABLE_PERMISSION[table];
    if (requiredPerm && session.permissions && !session.permissions.includes(requiredPerm)) {
      return NextResponse.json({ error: "Anda tidak memiliki izin untuk mengubah data ini." }, { status: 403 });
    }
    await updateRecord(table, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal mengubah." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table") || "";
    const id = searchParams.get("id") || "";
    if (!isValidTable(table) || !id) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
    }
    const admin = await requireSuperAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    await deleteRecord(table, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Gagal menghapus." }, { status: 500 });
  }
}
