import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }
    await query("UPDATE `news` SET `views` = `views` + 1 WHERE `id` = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal mencatat view." }, { status: 500 });
  }
}
