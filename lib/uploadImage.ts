import { apiUpload } from "@/lib/api";

const UPLOAD_TIMEOUT_MS = 20_000;

export async function uploadImageToStorage(file: File, folder: string = "news"): Promise<string> {
  const bucket = folder === "complaints" || folder === "aparatur" || folder === "templates" ? folder : "news-covers";
  const upload = apiUpload(file, bucket);
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), UPLOAD_TIMEOUT_MS)
  );
  try {
    return await Promise.race([upload, timeout]);
  } catch {
    throw new Error("Upload gambar gagal. Periksa koneksi atau coba file lain.");
  }
}
