import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

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
 * Writes an audit log entry to Firestore `audit_logs` collection.
 */
export async function writeAuditLog(
  action: AuditAction,
  module: AuditModule,
  detail: string,
  overrideUser?: { uid: string; email: string; displayName: string; role: string }
): Promise<void> {
  try {
    const user = overrideUser ?? {
      uid: auth.currentUser?.uid ?? "unknown",
      email: auth.currentUser?.email ?? "unknown",
      displayName: auth.currentUser?.displayName ?? "Admin",
      role: "unknown",
    };

    await addDoc(collection(db, "audit_logs"), {
      ...user,
      action,
      module,
      detail,
      timestamp: serverTimestamp(),
    } satisfies Omit<AuditEntry, "timestamp"> & { timestamp: any });
  } catch (err) {
    // Audit log should never crash the app
    console.warn("Audit log failed (non-critical):", err);
  }
}
