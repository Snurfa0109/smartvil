import { supabase } from "@/lib/supabase";

const UPLOAD_TIMEOUT_MS = 20_000;

function bucketFor(folder: string): string {
  if (folder === "complaints") return "complaints";
  if (folder === "aparatur") return "aparatur";
  return "news-covers";
}

export async function uploadImageToStorage(file: File, folder: string = "news"): Promise<string> {
  const name = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;
  const path = `${folder}/${name}`;
  const bucket = bucketFor(folder);
  try {
    const { error } = await Promise.race([
      supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), UPLOAD_TIMEOUT_MS)
      ),
    ]);
    if (error) throw error;
  } catch {
    throw new Error("Upload gambar gagal. Periksa koneksi atau konfigurasi Supabase Storage.");
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
