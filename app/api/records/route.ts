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
} from "@/lib/records";
import { getSessionProfile, requireSuperAdmin } from "@/lib/auth-server";

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
      return NextResponse.json({ data });
    }

    if (op === "get") {
      const id = searchParams.get("id") || "";
      const idCol = table === "settings" ? "key" : "id";
      if (!canPublicRead(table) && !isAdmin) {
        return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
      }
      const data = await findOne(table, { column: idCol, value: id });
      return NextResponse.json({ data });
    }

    if (!canPublicRead(table) && !isAdmin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const data = await listRecords(table, {
      orderBy: searchParams.get("orderBy") || undefined,
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
      limit: Number(searchParams.get("limit") || 200),
    });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal membaca data." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { table, row } = await req.json();
    if (!isValidTable(table) || !row) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
    }
    const session = await getSessionProfile(req);
    if (!session && !canAnonInsert(table)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const data = await insertRecord(table, row);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { table, id, patch } = await req.json();
    if (!isValidTable(table) || !id || !patch) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
    }
    const session = await getSessionProfile(req);
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    await updateRecord(table, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal mengubah." }, { status: 500 });
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
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menghapus." }, { status: 500 });
  }
}
