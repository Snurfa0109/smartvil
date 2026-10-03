import { getToken } from "@/lib/api";

export type AuditAction = "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "AKSES_DITOLAK";
export type AuditModule =
  | "berita"
  | "layanan"
  | "pengaduan"
  | "penduduk"
  | "settings"
  | "agenda"
  | "admin"
  | "auth"
  | "sistem";

export async function writeAuditLog(
  action: AuditAction,
  module: AuditModule,
  detail: string
): Promise<void> {
  try {
    const token = getToken();
    if (!token) return;
    await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, module, detail }),
    });
  } catch (err) {
    console.warn("Audit log failed (non-critical):", err);
  }
}
