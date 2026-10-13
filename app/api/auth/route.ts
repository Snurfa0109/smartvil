import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth-server";

function toProfile(row: Record<string, unknown>) {
  return {
    uid: String(row.id),
    email: String(row.email || ""),
    displayName: String(row.display_name || "Admin"),
    role: String(row.role || "admin"),
    active: Number(row.active) !== 0,
    department: String(row.department || ""),
    permissions: typeof row.permissions === "string" ? JSON.parse(row.permissions || "[]") : row.permissions || [],
    lastLogin: row.last_login ? new Date(row.last_login as string).toISOString() : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }
    const rows = await query<Record<string, unknown>[]>("SELECT * FROM profiles WHERE email = ? LIMIT 1", [
      String(email).trim(),
    ]);
    const row = rows[0];
    if (!row || !row.active) {
      return NextResponse.json({ error: "Email atau kata sandi tidak sesuai." }, { status: 401 });
    }
    const ok = await verifyPassword(String(password), String(row.password_hash || ""));
    if (!ok) {
      return NextResponse.json({ error: "Email atau kata sandi tidak sesuai." }, { status: 401 });
    }
    await query("UPDATE profiles SET last_login = NOW() WHERE id = ?", [row.id]);
    const token = signToken({ uid: String(row.id), email: String(row.email), role: String(row.role) });
    return NextResponse.json({ token, profile: toProfile(row) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Login gagal." }, { status: 500 });
  }
}
