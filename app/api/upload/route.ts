import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getSessionProfile } from "@/lib/auth-server";

const ALLOWED_FOLDERS = ["templates", "news", "news-covers", "complaints", "aparatur"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = String(form.get("folder") || "news");
    if (!file || !ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: "File atau folder tidak valid." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB." }, { status: 400 });
    }
    if (folder !== "complaints") {
      const session = await getSessionProfile(req);
      if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `${Date.now()}_${randomUUID().slice(0, 8)}_${safeName}`;
    const dir = join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, name), bytes);
    return NextResponse.json({ url: `/uploads/${folder}/${name}` });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload gagal." }, { status: 500 });
  }
}
