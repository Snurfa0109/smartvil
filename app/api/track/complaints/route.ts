/**
 * [BACKEND API] Pelacakan Pengaduan Aspirasi Warga
 * Pencarian status tindak lanjut aduan warga berdasarkan kode tiket atau nomor telepon.
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const SAFE_FIELDS = "ticket_code, nama, phone, category, title, message, photo_url, status, admin_response, created_at";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 5) {
    return NextResponse.json({ error: "Kata kunci minimal 5 karakter." }, { status: 400 });
  }
  try {
    const rows = await query<Record<string, unknown>[]>(
      `SELECT ${SAFE_FIELDS} FROM complaints WHERE ticket_code = ? OR phone = ? ORDER BY created_at DESC LIMIT 20`,
      [q, q]
    );
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Gagal mencari data." }, { status: 500 });
  }
}
