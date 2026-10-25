/**
 * [BACKEND API] Counter Pembaca Artikel Berita
 * Pencatatan jumlah tayangan artikel warta dengan proteksi rate limiting IP.
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const viewedMap = new Map<string, Set<string>>();

setInterval(() => {
  viewedMap.clear();
}, 60_000);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string" || id.length === 0 || id.length > 36) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const viewers = viewedMap.get(id);
    if (viewers?.has(ip)) {
      return NextResponse.json({ ok: true });
    }

    if (!viewers) {
      viewedMap.set(id, new Set([ip]));
    } else {
      viewers.add(ip);
    }
    await query("UPDATE `news` SET `views` = `views` + 1 WHERE `id` = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal mencatat view." }, { status: 500 });
  }
}
