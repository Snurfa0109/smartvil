const TOKEN_KEY = "smartvil_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function req(path: string, init: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request gagal (${res.status})`);
  return body;
}

export const apiList = (table: string, opts: { orderBy?: string; order?: "asc" | "desc"; limit?: number } = {}) => {
  const p = new URLSearchParams({ table, op: "list" });
  if (opts.orderBy) p.set("orderBy", opts.orderBy);
  if (opts.order) p.set("order", opts.order);
  if (opts.limit) p.set("limit", String(opts.limit));
  return req(`/api/records?${p.toString()}`).then((b) => b.data as Record<string, unknown>[]);
};

export const apiCount = (table: string, where?: { column: string; value: unknown }) => {
  const p = new URLSearchParams({ table, op: "count" });
  if (where) {
    p.set("column", where.column);
    p.set("value", String(where.value ?? ""));
  }
  return req(`/api/records?${p.toString()}`).then((b) => Number(b.count ?? 0));
};

export const apiFind = (table: string, where: { column: string; value: unknown }, limit = 100) => {
  const p = new URLSearchParams({ table, op: "find", column: where.column, value: String(where.value ?? ""), limit: String(limit) });
  return req(`/api/records?${p.toString()}`).then((b) => b.data as Record<string, unknown>[]);
};

export const apiGet = (table: string, id: string) => {
  const p = new URLSearchParams({ table, op: "get", id });
  return req(`/api/records?${p.toString()}`).then((b) => b.data as Record<string, unknown> | null);
};

export const apiInsert = (table: string, row: Record<string, unknown>) =>
  req("/api/records", { method: "POST", body: JSON.stringify({ table, row }) }).then((b) => b.data);

export const apiUpdate = (table: string, id: string, patch: Record<string, unknown>) =>
  req("/api/records", { method: "PUT", body: JSON.stringify({ table, id, patch }) });

export const apiDelete = (table: string, id: string) =>
  req(`/api/records?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, { method: "DELETE" });

export async function apiUpload(file: File, folder = "news"): Promise<string> {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Upload gagal.");
  return body.url as string;
}
