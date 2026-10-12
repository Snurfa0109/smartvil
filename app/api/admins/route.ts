import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSuperAdmin, hashPassword, getSessionProfile } from "@/lib/auth-server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const { email, password, displayName, role, department, permissions } = await req.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Email dan kata sandi (min. 6 karakter) wajib diisi." }, { status: 400 });
    }
    const exists = await query<Record<string, unknown>[]>("SELECT id FROM profiles WHERE email = ? LIMIT 1", [
      String(email).trim(),
    ]);
    if (exists.length > 0) {
      return NextResponse.json({ error: "Email sudah terdaftar. Gunakan email lain." }, { status: 400 });
    }
    const id = randomUUID();
    await query(
      "INSERT INTO profiles (id, email, display_name, role, active, department, permissions, password_hash) VALUES (?, ?, ?, ?, 1, ?, ?, ?)",
      [
        id,
        String(email).trim(),
        String(displayName || "").trim() || "Admin",
        role || "admin",
        department || "",
        JSON.stringify(role === "superadmin" ? [] : permissions ?? []),
        await hashPassword(String(password)),
      ]
    );
    return NextResponse.json({ uid: id });
  } catch (err) {
    console.error("Admin create error:", err);
    return NextResponse.json({ error: "Gagal membuat admin baru." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await getSessionProfile(req);
    if (!profile) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const { uid, display_name, password } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: "UID wajib diisi." }, { status: 400 });
    }
    
    if (uid !== profile.uid && profile.role !== "superadmin") {
      return NextResponse.json({ error: "Anda hanya bisa mengubah profil Anda sendiri." }, { status: 403 });
    }
    
    const updates: string[] = [];
    const values: unknown[] = [];
    
    if (display_name) {
      updates.push("display_name = ?");
      values.push(String(display_name).trim());
    }
    
    if (password) {
      if (String(password).length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
      }
      updates.push("password_hash = ?");
      values.push(await hashPassword(String(password)));
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: "Tidak ada data untuk diupdate." }, { status: 400 });
    }
    
    values.push(uid);
    await query(`UPDATE profiles SET ${updates.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin update error:", err);
    return NextResponse.json({ error: "Gagal memperbarui profil admin." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: "UID wajib diisi." }, { status: 400 });
    }
    await query("DELETE FROM profiles WHERE id = ?", [uid]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete error:", err);
    return NextResponse.json({ error: "Gagal menghapus admin." }, { status: 500 });
  }
}
