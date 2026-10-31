/**
 * [BACKEND API] Notifikasi Sistem & Aktivitas Masuk
 * Agregasi notifikasi permohonan surat baru, pengaduan warga, agenda, dan log keamanan.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-server";
import { query } from "@/lib/db";

export interface AdminNotification {
  id: string;
  category: "surat" | "pengaduan" | "agenda";
  title: string;
  subtitle: string;
  timestamp: string;
  status: string;
  ticketCode?: string;
  link: string;
  isPending: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionProfile(req);
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const [
      requests,
      complaints,
      reqPendingRows,
      cmpPendingRows,
    ] = await Promise.all([
      query<Record<string, unknown>[]>(
        "SELECT id, ticket_code, type, type_name, nama, status, created_at FROM `requests` ORDER BY `created_at` DESC LIMIT 15"
      ).catch(() => []),
      query<Record<string, unknown>[]>(
        "SELECT id, ticket_code, category, title, nama, status, created_at FROM `complaints` ORDER BY `created_at` DESC LIMIT 15"
      ).catch(() => []),
      query<{ c: number }[]>(
        "SELECT COUNT(*) AS c FROM `requests` WHERE `status` = 'pending'"
      ).catch(() => [{ c: 0 }]),
      query<{ c: number }[]>(
        "SELECT COUNT(*) AS c FROM `complaints` WHERE `status` = 'pending' OR `status` = '' OR `status` IS NULL"
      ).catch(() => [{ c: 0 }]),
    ]);

    let upcomingAgenda: Record<string, unknown>[] = [];
    try {
      upcomingAgenda = await query<Record<string, unknown>[]>(
        "SELECT id, title, category, date_start, time_start, location FROM `agenda` WHERE `is_active` = 1 AND `date_start` >= CURDATE() ORDER BY `date_start` ASC LIMIT 5"
      );
    } catch {
      upcomingAgenda = [];
    }

    const notifications: AdminNotification[] = [];

    for (const r of requests) {
      const ticket = String(r.ticket_code || "");
      const typeName = String(r.type_name || r.type || "Surat Permohonan");
      const nama = String(r.nama || "Warga");
      const status = String(r.status || "pending");
      const isPending = status === "pending";

      notifications.push({
        id: `req-${r.id || ticket}`,
        category: "surat",
        title: isPending ? `Surat Masuk Baru: ${typeName}` : `Surat: ${typeName}`,
        subtitle: `Pemohon: ${nama} • ${ticket}`,
        timestamp: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
        status,
        ticketCode: ticket,
        link: ticket ? `/dashboard/layanan?search=${encodeURIComponent(ticket)}` : "/dashboard/layanan",
        isPending,
      });
    }

    for (const c of complaints) {
      const ticket = String(c.ticket_code || "");
      const title = String(c.title || c.category || "Aduan Warga");
      const nama = String(c.nama || "Warga");
      const status = String(c.status || "pending");
      const isPending = status === "pending" || !status;

      notifications.push({
        id: `cmp-${c.id || ticket}`,
        category: "pengaduan",
        title: isPending ? `Laporan Aduan Baru: ${title}` : `Aduan: ${title}`,
        subtitle: `Pelapor: ${nama} ${ticket ? `• ${ticket}` : ""}`,
        timestamp: c.created_at ? new Date(String(c.created_at)).toISOString() : new Date().toISOString(),
        status,
        ticketCode: ticket,
        link: ticket ? `/dashboard/pengaduan?search=${encodeURIComponent(ticket)}` : "/dashboard/pengaduan",
        isPending,
      });
    }

    for (const a of upcomingAgenda) {
      const title = String(a.title || "Agenda Kegiatan");
      const dateStart = a.date_start ? String(a.date_start).split("T")[0] : "";
      const loc = a.location ? `• ${String(a.location)}` : "";

      notifications.push({
        id: `agd-${a.id}`,
        category: "agenda",
        title: `Agenda Mendatang: ${title}`,
        subtitle: `Jadwal: ${dateStart} ${loc}`,
        timestamp: dateStart ? new Date(dateStart).toISOString() : new Date().toISOString(),
        status: "active",
        link: "/dashboard/agenda",
        isPending: false,
      });
    }

    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const pendingRequests = Number(reqPendingRows[0]?.c ?? 0);
    const pendingComplaints = Number(cmpPendingRows[0]?.c ?? 0);

    return NextResponse.json({
      notifications,
      summary: {
        pendingRequests,
        pendingComplaints,
        totalPending: pendingRequests + pendingComplaints,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal memuat notifikasi." },
      { status: 500 }
    );
  }
}
