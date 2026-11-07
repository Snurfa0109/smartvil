/**
 * [API / WARGA] Riwayat Pengajuan Surat & Pengaduan Warga
 * Endpoint GET mengembalikan daftar permohonan surat dan pengaduan berdasarkan citizen_id dari cookie JWT warga.
 */

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "";

interface CitizenPayload {
  cid: string;
  phone: string;
  role: string;
}

export async function GET(req: Request) {
  const cookies = req.headers.get("cookie") || "";
  const match = cookies.match(/(?:^|;\s*)smartvil_citizen=([^;]+)/);
  if (!match) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: CitizenPayload;
  try {
    payload = jwt.verify(match[1], JWT_SECRET) as CitizenPayload;
    if (payload.role !== "warga") throw new Error("invalid role");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const citizenId = payload.cid;

  const requests = await query<Record<string, unknown>[]>(
    "SELECT id, ticket_code, type, type_name, nama, status, admin_notes, created_at FROM requests WHERE citizen_id = ? ORDER BY created_at DESC",
    [citizenId]
  );

  const complaints = await query<Record<string, unknown>[]>(
    "SELECT id, ticket_code, category, title, message, status, admin_response, created_at FROM complaints WHERE citizen_id = ? ORDER BY created_at DESC",
    [citizenId]
  );

  return NextResponse.json({ requests, complaints });
}
