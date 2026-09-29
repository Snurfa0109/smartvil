import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function requireSuperAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  const anon = createClient(url, anonKey);
  const { data } = await anon.auth.getUser(token);
  const user = data.user;
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "superadmin") return null;
  return admin;
}

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
    const { data, error } = await admin.auth.admin.createUser({
      email: String(email).trim(),
      password,
      email_confirm: true,
      user_metadata: { display_name: String(displayName || "").trim() || "Admin" },
    });
    if (error) {
      const message =
        error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("exists")
          ? "Email sudah terdaftar. Gunakan email lain."
          : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      email: String(email).trim(),
      display_name: String(displayName || "").trim() || "Admin",
      role: role || "admin",
      department: department || "",
      permissions: role === "superadmin" ? [] : permissions ?? [],
      active: true,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    return NextResponse.json({ uid: data.user.id });
  } catch (err) {
    console.error("Admin create error:", err);
    return NextResponse.json({ error: "Gagal membuat admin baru." }, { status: 500 });
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
    await admin.from("profiles").delete().eq("id", uid);
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete error:", err);
    return NextResponse.json({ error: "Gagal menghapus admin." }, { status: 500 });
  }
}
