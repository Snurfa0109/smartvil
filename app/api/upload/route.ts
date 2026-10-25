/**
 * @layer Backend (API Route)
 * @role Endpoint upload berkas dan gambar sistem
 * @access Terautentikasi (Admin) & Public (Surat/Pengaduan)
 * @description Memvalidasi MIME type, magic bytes berkas, dan menyimpan file ke disk server.
 */
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getSessionProfile } from "@/lib/auth-server";
import { RateLimiter, clientIp } from "@/lib/rate-limit";


// First bytes signature for allowed file types
const MAGIC_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [[0x50, 0x4B, 0x03, 0x04]], // PK zip
};

function validateMagicBytes(buffer: Buffer, mime: string): boolean {
  const signatures = MAGIC_SIGNATURES[mime];
  if (!signatures) return false;
  return signatures.some(sig =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  );
}
const ALLOWED_FOLDERS = ["templates", "news", "news-covers", "complaints", "aparatur"];
const MAX_BYTES = 5 * 1024 * 1024;

const uploadLimiter = new RateLimiter({ max: 5, windowMs: 60_000 });
const BLOCKED_EXTENSIONS = [".svg", ".html", ".htm"];
const ALLOWED_MIME: Record<string, string[]> = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};
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
    const ext = (file.name.lastIndexOf(".") !== -1 ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "");
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "Tipe file tidak diizinkan." }, { status: 400 });
    }
    const allowedMimes = ALLOWED_MIME[ext];
    if (!allowedMimes) {
      return NextResponse.json({ error: "Tipe file tidak diizinkan. Hanya: " + Object.keys(ALLOWED_MIME).join(", ") }, { status: 400 });
    }
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: "MIME type file tidak sesuai dengan ekstensi." }, { status: 400 });
    }
    if (folder !== "complaints") {
      const session = await getSessionProfile(req);
      if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    } else {
      if (!uploadLimiter.check(clientIp(req))) {
        return NextResponse.json({ error: "Terlalu banyak upload. Coba lagi dalam 1 menit." }, { status: 429 });
      }
      const IMAGE_ONLY_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      if (!IMAGE_ONLY_EXT.includes(ext)) {
        return NextResponse.json({ error: "Hanya file gambar yang diizinkan untuk pengaduan." }, { status: 400 });
      }
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `${Date.now()}_${randomUUID().slice(0, 8)}_${safeName}`;
    const dir = join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!validateMagicBytes(bytes, file.type)) {
      return NextResponse.json({ error: "Konten file tidak sesuai dengan tipe yang diizinkan." }, { status: 400 });
    }
    await writeFile(join(dir, name), bytes);
    return NextResponse.json({ url: `/uploads/${folder}/${name}` });
  } catch (err) {
    return NextResponse.json({ error: "Upload gagal." }, { status: 500 });
  }
}
