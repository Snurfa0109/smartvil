/**
 * [CORE / SECURITY] Gateway Middleware & Header Keamanan
 * Pengecekan autentikasi rute dashboard admin dan rute warga, serta penyematan HTTP security headers standar.
 */

import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

const CITIZEN_PROTECTED = ["/layanan", "/pengaduan", "/riwayat"];

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("smartvil_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    try { jwt.verify(token, JWT_SECRET); } catch { return NextResponse.redirect(new URL("/login", req.url)); }
  }

  if (CITIZEN_PROTECTED.some(p => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + "/"))) {
    const citizenToken = req.cookies.get("smartvil_citizen")?.value;
    if (!citizenToken) return NextResponse.redirect(new URL("/masuk", req.url));
    try {
      const decoded = jwt.verify(citizenToken, JWT_SECRET) as { role?: string };
      if (decoded.role !== "warga") return NextResponse.redirect(new URL("/masuk", req.url));
    } catch { return NextResponse.redirect(new URL("/masuk", req.url)); }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
