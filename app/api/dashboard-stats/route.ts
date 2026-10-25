/**
 * [BACKEND API] Agregasi Statistik & Metrik Dashboard
 * Penyediaan data statistik ringkas untuk overview beranda administrasi kelurahan.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionProfile(req);
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const [
      residentsRows,
      newsRows,
      pendingRows,
      requestBreakdownRows,
      recentComplaints,
      recentRequests,
    ] = await Promise.all([
      query<{ c: number }[]>("SELECT COUNT(*) AS c FROM `residents`"),
      query<{ c: number }[]>("SELECT COUNT(*) AS c FROM `news`"),
      query<{ c: number }[]>("SELECT COUNT(*) AS c FROM `complaints` WHERE `status` = ?", ["pending"]),
      query<{ status: string; c: number }[]>(
        "SELECT `status`, COUNT(*) AS c FROM `requests` GROUP BY `status`"
      ),
      query<Record<string, unknown>[]>(
        "SELECT id, ticket_code, nama, category, title, status, created_at FROM `complaints` ORDER BY `created_at` DESC LIMIT 6"
      ),
      query<Record<string, unknown>[]>(
        "SELECT id, ticket_code, type_name, nama, status, created_at FROM `requests` ORDER BY `created_at` DESC LIMIT 6"
      ),
    ]);

    const residentsTotal = residentsRows[0]?.c ?? 0;
    const newsTotal = newsRows[0]?.c ?? 0;
    const pendingComplaints = pendingRows[0]?.c ?? 0;

    const breakdown: Record<string, number> = { pending: 0, processed: 0, ready: 0, completed: 0 };
    for (const row of requestBreakdownRows) {
      if (row.status in breakdown) {
        breakdown[row.status] = Number(row.c);
      }
    }

    return NextResponse.json({
      stats: {
        residents: Number(residentsTotal),
        news: Number(newsTotal),
        complaints: Number(pendingComplaints),
        requests: breakdown.pending,
      },
      requestBreakdown: breakdown,
      recentComplaints,
      recentRequests,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal memuat statistik." },
      { status: 500 }
    );
  }
}
