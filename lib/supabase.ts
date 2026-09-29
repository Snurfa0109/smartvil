import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL belum diisi (.env.local tidak ditemukan). Klien memakai config dummy agar build tidak crash. Isi .env.local dengan kredensial Supabase."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
