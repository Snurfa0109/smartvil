/**
 * [BACKEND API] Otentikasi Warga: Registrasi, Login & Logout
 * Endpoint registrasi akun warga dengan validasi NIK, login via nomor HP, dan logout penghapusan sesi.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import {
  hashNik,
  hashPassword,
  verifyPassword,
  signCitizenToken,
  getCitizenSession,
} from "@/lib/citizen-auth";
import { RateLimiter, clientIp } from "@/lib/rate-limit";

const limiter = new RateLimiter({ max: 5, windowMs: 60_000 });

async function ensureTable() {
  try {
    await query("SELECT 1 FROM citizen_accounts LIMIT 0");
  } catch {
    await query(`CREATE TABLE IF NOT EXISTS citizen_accounts (
      id VARCHAR(36) PRIMARY KEY,
      nik_hash VARCHAR(64) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      nama VARCHAR(255) NOT NULL DEFAULT '',
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      resident_id VARCHAR(36) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_citizen_nik_hash (nik_hash),
      UNIQUE INDEX idx_citizen_phone (phone)
    )`);
    await query("ALTER TABLE requests ADD COLUMN citizen_id VARCHAR(36) DEFAULT ''").catch(() => {});
    await query("ALTER TABLE complaints ADD COLUMN citizen_id VARCHAR(36) DEFAULT ''").catch(() => {});
  }
}

function setCitizenCookie(res: NextResponse, token: string, proto: string) {
  const isHttps = proto === "https";
  res.cookies.set("smartvil_citizen", token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}

async function handleRegister(body: Record<string, unknown>, proto: string) {
  const nik = String(body.nik || "").trim();
  const phone = String(body.phone || "").trim();
  const password = String(body.password || "");
  const nama = String(body.nama || "").trim();
  const gender = String(body.gender || "").trim();
  const address = String(body.address || "").trim();
  const occupation = String(body.occupation || "").trim();
  const birthDate = String(body.birthDate || body.birth_date || "").trim();
  const statusKeluarga = String(body.statusKeluarga || body.status_keluarga || "").trim();
  const statusPenduduk = String(body.statusPenduduk || body.status_penduduk || "").trim();
  const agama = String(body.agama || "").trim();
  const education = String(body.education || "").trim();

  if (!/^\d{16}$/.test(nik)) {
    return NextResponse.json({ error: "NIK harus 16 digit angka." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Nomor HP wajib diisi." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Kata sandi minimal 6 karakter." }, { status: 400 });
  }
  if (!nama || !gender || !address || !occupation || !birthDate || !statusKeluarga || !statusPenduduk || !agama || !education) {
    return NextResponse.json({ error: "Semua data kependudukan wajib diisi." }, { status: 400 });
  }

  const nikHash = hashNik(nik);

  const existingAccount = await query<Record<string, unknown>[]>(
    "SELECT id FROM citizen_accounts WHERE nik_hash = ? LIMIT 1",
    [nikHash]
  );
  if (existingAccount.length > 0) {
    return NextResponse.json({ error: "NIK sudah terdaftar." }, { status: 409 });
  }

  const existingPhone = await query<Record<string, unknown>[]>(
    "SELECT id FROM citizen_accounts WHERE phone = ? LIMIT 1",
    [phone]
  );
  if (existingPhone.length > 0) {
    return NextResponse.json({ error: "Nomor HP sudah terdaftar." }, { status: 409 });
  }

  const existingResident = await query<Record<string, unknown>[]>(
    "SELECT id FROM residents WHERE nik = ? LIMIT 1",
    [nik]
  );

  let residentId: string;
  if (existingResident.length > 0) {
    residentId = String(existingResident[0].id);
  } else {
    residentId = randomUUID();
    await query(
      "INSERT INTO residents (id, nik, nama, gender, address, occupation, birth_date, status, status_keluarga, status_penduduk, agama, education) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [residentId, nik, nama, gender, address, occupation, birthDate, "Tetap", statusKeluarga, statusPenduduk, agama, education]
    );
  }

  const citizenId = randomUUID();
  const pwHash = await hashPassword(password);
  await query(
    "INSERT INTO citizen_accounts (id, nik_hash, phone, nama, password_hash, resident_id) VALUES (?, ?, ?, ?, ?, ?)",
    [citizenId, nikHash, phone, nama, pwHash, residentId]
  );

  const token = signCitizenToken({ cid: citizenId, phone });
  const res = NextResponse.json({
    ok: true,
    citizen: { id: citizenId, phone, nama, residentId },
  });
  setCitizenCookie(res, token, proto);
  return res;
}

async function handleLogin(body: Record<string, unknown>, proto: string) {
  const phone = String(body.phone || "").trim();
  const password = String(body.password || "");

  if (!phone || !password) {
    return NextResponse.json({ error: "Nomor HP dan kata sandi wajib diisi." }, { status: 400 });
  }

  const rows = await query<Record<string, unknown>[]>(
    "SELECT id, phone, nama, password_hash, resident_id FROM citizen_accounts WHERE phone = ? LIMIT 1",
    [phone]
  );
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Nomor HP atau kata sandi tidak sesuai." }, { status: 401 });
  }

  const ok = await verifyPassword(password, String(row.password_hash || ""));
  if (!ok) {
    return NextResponse.json({ error: "Nomor HP atau kata sandi tidak sesuai." }, { status: 401 });
  }

  const token = signCitizenToken({ cid: String(row.id), phone: String(row.phone) });
  const res = NextResponse.json({
    ok: true,
    citizen: { id: String(row.id), phone: String(row.phone), nama: String(row.nama), residentId: String(row.resident_id || "") },
  });
  setCitizenCookie(res, token, proto);
  return res;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCitizenSession(req);
    if (!session) {
      return NextResponse.json({ citizen: null });
    }
    return NextResponse.json({ citizen: session });
  } catch {
    return NextResponse.json({ citizen: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!limiter.check(clientIp(req))) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." },
        { status: 429 }
      );
    }

    await ensureTable();

    const body = await req.json();
    const action = String(body.action || "");
    const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");

    if (action === "register") return await handleRegister(body, proto);
    if (action === "login") return await handleLogin(body, proto);

    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  } catch (err) {
    console.error("Citizen auth error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server. Coba lagi." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("smartvil_citizen");
  return res;
}
