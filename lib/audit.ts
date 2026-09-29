import { supabase } from "@/lib/supabase";

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

export interface AuditEntry {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  action: AuditAction;
  module: AuditModule;
  detail: string;
  timestamp: any;
}

/**
 * Writes an audit log entry to Supabase `audit_logs`.
 */
export async function writeAuditLog(
  action: AuditAction,
  module: AuditModule,
  detail: string,
  overrideUser?: { uid: string; email: string; displayName: string; role: string }
): Promise<void> {
  try {
    let user = overrideUser;
    if (!user) {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      user = {
        uid: u?.id ?? "unknown",
        email: u?.email ?? "unknown",
        displayName: (u?.user_metadata?.display_name as string) ?? "Admin",
        role: "unknown",
      };
    }

    await supabase.from("audit_logs").insert({
      uid: user.uid,
      email: user.email,
      display_name: user.displayName,
      role: user.role,
      action,
      module,
      detail,
    });
  } catch (err) {
    // Audit log should never crash the app
    console.warn("Audit log failed (non-critical):", err);
  }
}
