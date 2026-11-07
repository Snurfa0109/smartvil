/**
 * [BACKEND API] Manajemen Akun Warga oleh Administrator
 * Endpoint pengambilan data akun terdaftar, reset kata sandi, dan pengelolaan status akun warga.
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionProfile } from "@/lib/auth-server";
import { hashPassword } from "@/lib/citizen-auth";

async function verifyAdminAuth(req: NextRequest) {
  const profile = await getSessionProfile(req);
  if (!profile || !profile.active) return null;
  if (
    profile.role !== "superadmin" &&
    profile.permissions &&
    !profile.permissions.includes("warga") &&
    !profile.permissions.includes("penduduk")
  ) {
    return null;
  }
  return profile;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();

    let sql = `
      SELECT 
        c.id,
        c.phone,
        c.nama,
        c.resident_id,
        c.created_at,
        r.nik,
        r.gender,
        r.address,
        r.occupation,
        r.birth_date,
        r.status_keluarga,
        r.status_penduduk,
        r.agama,
        r.education,
        COALESCE((SELECT COUNT(*) FROM requests req WHERE req.citizen_id = c.id), 0) AS total_requests,
        COALESCE((SELECT COUNT(*) FROM complaints cmp WHERE cmp.citizen_id = c.id), 0) AS total_complaints
      FROM citizen_accounts c
      LEFT JOIN residents r ON c.resident_id = r.id
    `;

    const params: string[] = [];

    if (search) {
      sql += ` WHERE (c.nama LIKE ? OR c.phone LIKE ? OR r.nik LIKE ? OR r.address LIKE ?)`;
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const rows = await query<Record<string, unknown>[]>(sql, params);

    return NextResponse.json(rows);
  } catch (err: unknown) {
    console.error("GET citizen accounts error:", err);
    return NextResponse.json(
      { error: "Gagal memuat data akun warga." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || "");
    const id = String(body.id || "");

    if (!id) {
      return NextResponse.json({ error: "ID akun warga wajib disertakan." }, { status: 400 });
    }

    const citizen = await query<Record<string, unknown>[]>(
      "SELECT id, phone, nama, resident_id FROM citizen_accounts WHERE id = ? LIMIT 1",
      [id]
    );

    if (citizen.length === 0) {
      return NextResponse.json({ error: "Akun warga tidak ditemukan." }, { status: 404 });
    }

    if (action === "reset_password") {
      const newPassword = String(body.newPassword || "");
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      const pwHash = await hashPassword(newPassword);
      await query("UPDATE citizen_accounts SET password_hash = ? WHERE id = ?", [
        pwHash,
        id,
      ]);

      return NextResponse.json({
        ok: true,
        message: `Kata sandi untuk warga ${citizen[0].nama || citizen[0].phone} berhasil diubah.`,
      });
    }

    if (action === "update_profile") {
      const nama = String(body.nama || "").trim();
      const phone = String(body.phone || "").trim();

      if (!nama || !phone) {
        return NextResponse.json({ error: "Nama dan nomor HP wajib diisi." }, { status: 400 });
      }

      const duplicatePhone = await query<Record<string, unknown>[]>(
        "SELECT id FROM citizen_accounts WHERE phone = ? AND id != ? LIMIT 1",
        [phone, id]
      );
      if (duplicatePhone.length > 0) {
        return NextResponse.json({ error: "Nomor HP sudah digunakan oleh akun lain." }, { status: 409 });
      }

      await query(
        "UPDATE citizen_accounts SET nama = ?, phone = ? WHERE id = ?",
        [nama, phone, id]
      );

      const residentId = citizen[0].resident_id ? String(citizen[0].resident_id) : "";
      if (residentId) {
        await query(
          "UPDATE residents SET nama = ? WHERE id = ?",
          [nama, residentId]
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Data profil akun warga berhasil diperbarui.",
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: unknown) {
    console.error("PATCH citizen account error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui akun warga." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ error: "ID akun warga wajib disertakan." }, { status: 400 });
    }

    const target = await query<Record<string, unknown>[]>(
      "SELECT id, nama, phone FROM citizen_accounts WHERE id = ? LIMIT 1",
      [id]
    );

    if (target.length === 0) {
      return NextResponse.json({ error: "Akun warga tidak ditemukan." }, { status: 404 });
    }

    await query("DELETE FROM citizen_accounts WHERE id = ?", [id]);

    return NextResponse.json({
      ok: true,
      message: `Akun warga ${target[0].nama || target[0].phone} berhasil dihapus.`,
    });
  } catch (err: unknown) {
    console.error("DELETE citizen account error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus akun warga." },
      { status: 500 }
    );
  }
}
