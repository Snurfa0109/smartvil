/**
 * [BACKEND API] Otentikasi Administrator & Manajemen Sesi
 * Login verifikasi kata sandi bcrypt, penerbitan cookie HttpOnly JWT, dan logout penghapusan sesi.
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken, verifyPassword } from "@/lib/auth-server";
import { RateLimiter, clientIp } from "@/lib/rate-limit";

const loginLimiter = new RateLimiter({ max: 5, windowMs: 60_000 });

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
    if (!loginLimiter.check(clientIp(req))) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit." },
        { status: 429 },
      );
    }
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }
    const rows = await query<Record<string, unknown>[]>("SELECT id, email, password_hash, display_name, role, department, permissions, active, last_login FROM profiles WHERE email = ? LIMIT 1", [
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
    const response = NextResponse.json({ token, profile: toProfile(row) });
    response.cookies.set("smartvil_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 4 * 60 * 60,
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server. Coba lagi." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("smartvil_token");
  return response;
}
