import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required in environment variables");
}
const SECRET: string = JWT_SECRET;
const TOKEN_TTL = "4h";

export interface SessionProfile {
  id: string;
  uid?: string;
  email: string;
  display_name: string;
  role: string;
  active: number | boolean;
  department: string;
  permissions: string[] | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: { uid: string; email: string; role: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL });
}

function verifyToken(token: string): { uid: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, SECRET) as { uid: string; email: string; role: string };
  } catch {
    return null;
  }
}

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim() || null;
  return null;
}

export async function getSessionProfile(req: Request): Promise<SessionProfile | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const rows = await query<Record<string, unknown>[]>("SELECT id, email, display_name, role, active, department, permissions FROM profiles WHERE id = ? LIMIT 1", [payload.uid]);
  const raw = rows[0];
  if (!raw || !raw.active) return null;
  let perms: string[] | null = null;
  if (raw.permissions) {
    try {
      perms = typeof raw.permissions === "string" ? JSON.parse(raw.permissions) : Array.isArray(raw.permissions) ? raw.permissions as string[] : null;
    } catch { perms = null; }
  }
  const profile: SessionProfile = {
    id: String(raw.id),
    uid: String(raw.id),
    email: String(raw.email),
    display_name: String(raw.display_name || ""),
    role: String(raw.role || "admin"),
    active: raw.active as number | boolean,
    department: String(raw.department || ""),
    permissions: perms,
  };
  return profile;
}

export async function requireSuperAdmin(req: Request): Promise<SessionProfile | null> {
  const profile = await getSessionProfile(req);
  if (!profile || profile.role !== "superadmin") return null;
  return profile;
}


