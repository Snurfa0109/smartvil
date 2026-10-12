import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionProfile(req);
    if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const { action, module, detail } = await req.json();
    await query(
      "INSERT INTO audit_logs (id, uid, email, display_name, role, action, module, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        randomUUID(),
        session.id,
        session.email,
        session.display_name,
        session.role,
        String(action || ""),
        String(module || ""),
        String(detail || ""),
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal." }, { status: 500 });
  }
}
