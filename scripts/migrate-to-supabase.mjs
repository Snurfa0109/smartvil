/**
 * Migrasi data Firestore (project lama) -> Supabase Postgres (project baru).
 * Cara pakai:
 *   1. Project lama -> Project Settings -> Service accounts -> Generate new
 *      private key -> simpan sebagai scripts/old-service-account.json
 *      (JANGAN di-commit, sudah masuk .gitignore)
 *   2. Isi .env.local dengan kredensial Supabase baru
 *      (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   3. Jalankan: node scripts/migrate-to-supabase.mjs
 * ID dokumen dipertahankan sehingga tidak ada link yang putus.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import admin from "firebase-admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Isi dulu NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  process.exit(1);
}

const oldKey = JSON.parse(readFileSync(new URL("./old-service-account.json", import.meta.url)));
admin.initializeApp({ credential: admin.credential.cert(oldKey) });
const oldDb = admin.firestore();
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const toISO = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v.toDate === "function") return v.toDate().toISOString();
  if (v.seconds) return new Date(v.seconds * 1000).toISOString();
  return null;
};
const at = (v) => toISO(v) ?? new Date().toISOString();

async function copyAll(table, docs) {
  let n = 0;
  for (const row of docs) {
    const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
    if (error) throw new Error(`${table}: ${error.message}`);
    if (++n % 100 === 0) console.log(`  ${table}: ${n}...`);
  }
  console.log(`${table}: ${n} dokumen OK`);
}

const residentsSnap = await oldDb.collection("residents").get();
await copyAll(
  "residents",
  residentsSnap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      nik: v.nik || "",
      nama: v.nama || "",
      gender: v.gender || "",
      address: v.address || "",
      occupation: v.occupation || "",
      birth_date: v.birthDate || null,
      status: v.status || "Tetap",
      status_keluarga: v.statusKeluarga || "",
      status_penduduk: v.statusPenduduk || "",
      agama: v.agama || "",
      education: v.education || "",
      created_at: at(v.createdAt),
    };
  })
);

const newsSnap = await oldDb.collection("news").get();
await copyAll(
  "news",
  newsSnap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      title: v.title || "",
      category: v.category || "",
      content: v.content || "",
      date: v.date || null,
      image_url: v.imageUrl || "",
      created_at: at(v.createdAt),
    };
  })
);

const complaintsSnap = await oldDb.collection("complaints").get();
await copyAll(
  "complaints",
  complaintsSnap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      ticket_code: v.ticketCode || "",
      nama: v.nama || "",
      email: v.email || "",
      phone: v.phone || "",
      category: v.category || "",
      title: v.title || v.judul || "",
      message: v.message || v.isi || "",
      photo_url: v.photoUrl || "",
      status: v.status || "pending",
      admin_response: v.adminResponse || "",
      created_at: at(v.createdAt),
    };
  })
);

const requestsSnap = await oldDb.collection("requests").get();
await copyAll(
  "requests",
  requestsSnap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      ticket_code: v.ticketCode || `SRT-LAMA-${d.id.slice(0, 8)}`,
      type: v.type || "",
      type_name: v.typeName || "",
      nama: v.nama || "",
      nik: v.nik || "",
      phone: v.phone || "",
      keperluan: v.keperluan || "",
      status: v.status || "pending",
      form_data: v.formData || {},
      template_narrative: v.templateNarrative || "",
      admin_notes: v.adminNotes || "",
      created_at: at(v.createdAt),
    };
  })
);

const typesSnap = await oldDb.collection("letter_types").get();
await copyAll(
  "letter_types",
  typesSnap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      code: v.code || d.id,
      name: v.name || "",
      description: v.desc || "",
      requirements: v.requirements || [],
      template_narrative: v.templateNarrative || "",
      active: v.active !== false,
      sort_order: v.order || 0,
      template_file_url: v.templateFileUrl || "",
      template_data: v.templateData || "",
      template_placeholders: v.templatePlaceholders || [],
      custom_fields: v.customFields || [],
      created_at: at(v.createdAt),
    };
  })
);

const agendaSnap = await oldDb.collection("agenda").get();
await copyAll(
  "agenda",
  agendaSnap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      title: v.title || "",
      category: v.category || "",
      category_color: v.categoryColor || "blue",
      schedule: v.schedule || "",
      description: v.description || "",
      time_location: v.timeLocation || "",
      active: v.active !== false,
      sort_order: v.order || 0,
      created_at: at(v.createdAt),
    };
  })
);

const usersSnap = await oldDb.collection("users").get();
await copyAll(
  "profiles",
  usersSnap.docs.map((d) => {
    const v = d.data();
    return {
      id: v.uid || d.id,
      email: v.email || "",
      display_name: v.displayName || "Admin",
      role: v.role || "admin",
      active: v.active !== false,
      department: v.department || "",
      permissions: Array.isArray(v.permissions) ? v.permissions : [],
      last_login: toISO(v.lastLogin),
      created_at: at(v.createdAt),
    };
  })
);

for (const key of ["profile", "chatbot", "berita_categories"]) {
  const snap = await oldDb.collection("settings").doc(key === "profile" ? "profile" : key === "chatbot" ? "chatbot" : "beritaCategories").get();
  if (snap.exists) {
    await copyAll("settings", [{ key, value: snap.data(), updated_at: new Date().toISOString() }]);
  }
}

const auditSnap = await oldDb.collection("audit_logs").get();
await copyAll(
  "audit_logs",
  auditSnap.docs.map((d) => {
    const v = d.data();
    return {
      uid: v.uid || "",
      email: v.email || "",
      display_name: v.displayName || "",
      role: v.role || "",
      action: v.action || "",
      module: v.module || "",
      detail: v.detail || "",
      timestamp: at(v.timestamp),
    };
  })
);

console.log("SELESAI. Akun admin dibuat ulang manual di Authentication, lalu samakan profiles.id dengan UID Auth baru via SQL: update profiles set id = 'UID_BARU' where email = 'admin@...';");
process.exit(0);
