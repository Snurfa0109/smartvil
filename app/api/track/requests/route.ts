import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const SAFE_FIELDS = "ticket_code, type_name, nama, status, admin_notes, created_at";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 5) {
    return NextResponse.json({ error: "Kata kunci minimal 5 karakter." }, { status: 400 });
  }
  try {
    const digits = q.replace(/\D/g, "");
    let rows: Record<string, unknown>[];
    if (digits.length === 16) {
      rows = await query<Record<string, unknown>[]>(
        `SELECT ${SAFE_FIELDS} FROM requests WHERE ticket_code = ? OR nik = ? OR phone = ? ORDER BY created_at DESC LIMIT 20`,
        [q, digits, q]
      );
    } else {
      rows = await query<Record<string, unknown>[]>(
        `SELECT ${SAFE_FIELDS} FROM requests WHERE ticket_code = ? OR phone = ? ORDER BY created_at DESC LIMIT 20`,
        [q, q]
      );
    }
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Gagal mencari data." }, { status: 500 });
  }
}
