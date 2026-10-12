import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required in environment variables");
}
const TOKEN_TTL = "7d";

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
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: { uid: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): { uid: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { uid: string; email: string; role: string };
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim() || null;
  return null;
}

export async function getSessionProfile(req: Request): Promise<SessionProfile | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const rows = await query<SessionProfile[]>("SELECT * FROM profiles WHERE id = ? LIMIT 1", [payload.uid]);
  const profile = rows[0];
  if (!profile || !profile.active) return null;
  return { ...profile, uid: profile.id };
}

export async function requireAuth(req: Request): Promise<SessionProfile | null> {
  return getSessionProfile(req);
}

export async function requireSuperAdmin(req: Request): Promise<SessionProfile | null> {
  const profile = await getSessionProfile(req);
  if (!profile || profile.role !== "superadmin") return null;
  return profile;
}

export function parseJsonField(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
