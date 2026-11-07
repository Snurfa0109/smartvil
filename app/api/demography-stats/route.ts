/**
 * [BACKEND API] Statistik Demografi & Kependudukan Agregat Publik
 * Endpoint publik menyajikan rekap data jumlah penduduk, gender, kelompok usia, agama, dan pendidikan tanpa membuka data pribadi/NIK.
 */

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const totalRows = await query<Record<string, unknown>[]>(
      "SELECT COUNT(*) as total FROM residents"
    );
    const total = Number(totalRows[0]?.total || 0);

    if (total === 0) {
      return NextResponse.json({ data: null });
    }

    const genderRows = await query<Record<string, unknown>[]>(
      "SELECT gender, COUNT(*) as count FROM residents GROUP BY gender"
    );
    let male = 0;
    let female = 0;
    for (const r of genderRows) {
      const g = String(r.gender || "").toLowerCase();
      const c = Number(r.count || 0);
      if (g.includes("laki") || g === "l") male += c;
      else if (g.includes("perempuan") || g === "p") female += c;
    }

    const kkRows = await query<Record<string, unknown>[]>(
      "SELECT COUNT(*) as count FROM residents WHERE status_keluarga = 'Kepala Keluarga' OR status = 'Kepala Keluarga'"
    );
    const kk = Number(kkRows[0]?.count || 0);

    const birthRows = await query<Record<string, unknown>[]>(
      "SELECT birth_date FROM residents WHERE birth_date IS NOT NULL"
    );
    const now = new Date();
    let children = 0;
    let adults = 0;
    let seniors = 0;
    for (const r of birthRows) {
      if (!r.birth_date) continue;
      const bDate = new Date(r.birth_date as string);
      let age = now.getFullYear() - bDate.getFullYear();
      const m = now.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bDate.getDate())) age--;
      if (age < 18) children++;
      else if (age <= 59) adults++;
      else seniors++;
    }

    const occRows = await query<Record<string, unknown>[]>(
      "SELECT occupation, COUNT(*) as count FROM residents WHERE occupation IS NOT NULL AND occupation != '' GROUP BY occupation ORDER BY count DESC"
    );
    const occupations = occRows.map((r) => ({
      name: String(r.occupation),
      count: Number(r.count),
    }));

    const relRows = await query<Record<string, unknown>[]>(
      "SELECT agama, COUNT(*) as count FROM residents WHERE agama IS NOT NULL AND agama != '' GROUP BY agama ORDER BY count DESC"
    );
    const religions = relRows.map((r) => ({
      name: String(r.agama),
      count: Number(r.count),
    }));

    const eduRows = await query<Record<string, unknown>[]>(
      "SELECT education, COUNT(*) as count FROM residents WHERE education IS NOT NULL AND education != '' GROUP BY education ORDER BY count DESC"
    );
    const educations = eduRows.map((r) => ({
      name: String(r.education),
      count: Number(r.count),
    }));

    return NextResponse.json({
      data: {
        total,
        male,
        female,
        kk,
        ageGroups: { children, adults, seniors },
        occupations,
        religions,
        educations,
      },
    });
  } catch (err) {
    console.error("Demography stats error:", err);
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
