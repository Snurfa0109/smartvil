/**
 * [CORE LIBRARY / BACKEND] Otentikasi Warga, JWT Citizen & Hashing NIK
 * Penanganan verifikasi token JWT warga, hashing NIK SHA-256, dan ekstraksi sesi warga dari cookie.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { query } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");
const SECRET: string = JWT_SECRET;
const TOKEN_TTL = "24h";

export interface CitizenSession {
  id: string;
  phone: string;
  nama: string;
  residentId: string;
}

export function hashNik(nik: string): string {
  return createHash("sha256").update(nik.trim()).digest("hex");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function signCitizenToken(payload: { cid: string; phone: string }): string {
  return jwt.sign({ ...payload, role: "warga" }, SECRET, { expiresIn: TOKEN_TTL });
}

function verifyCitizenToken(token: string): { cid: string; phone: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, SECRET) as { cid: string; phone: string; role: string };
    if (decoded.role !== "warga") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getCitizenTokenFromRequest(req: Request): string | null {
  const cookies = req.headers.get("cookie") || "";
  const match = cookies.match(/(?:^|;\s*)smartvil_citizen=([^;]+)/);
  return match ? match[1] : null;
}

export async function getCitizenSession(req: Request): Promise<CitizenSession | null> {
  const token = getCitizenTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyCitizenToken(token);
  if (!payload) return null;
  const rows = await query<Record<string, unknown>[]>(
    "SELECT id, phone, nama, resident_id FROM citizen_accounts WHERE id = ? LIMIT 1",
    [payload.cid]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    phone: String(row.phone),
    nama: String(row.nama),
    residentId: String(row.resident_id || ""),
  };
}
