import { apiGet, apiInsert, apiUpdate } from "@/lib/api";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await apiGet("settings", key);
    if (!row) return fallback;
    return ((row.value as T) ?? fallback);
  } catch {
    return fallback;
  }
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const existing = await apiGet("settings", key).catch(() => null);
  if (existing) {
    await apiUpdate("settings", key, { value });
  } else {
    await apiInsert("settings", { key, value });
  }
}
