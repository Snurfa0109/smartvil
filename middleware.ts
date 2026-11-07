/**
 * [CORE / SECURITY] Gateway Middleware & Header Keamanan
 * Pengecekan autentikasi rute dashboard admin dan rute warga, serta penyematan HTTP security headers standar.
 * JWT decode menggunakan Web Crypto API (Edge-compatible) — jsonwebtoken tidak bisa dipakai di Edge Runtime.
 */

import { NextResponse, type NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "";

const CITIZEN_PROTECTED = ["/riwayat"];

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  return atob(padded);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const signature = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const data = enc.encode(`${parts[0]}.${parts[1]}`);
    const valid = await crypto.subtle.verify("HMAC", cryptoKey, signature, data);
    if (!valid) return null;
    return decodeJwtPayload(token);
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("smartvil_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const payload = await verifyJwt(token, JWT_SECRET);
    if (!payload) return NextResponse.redirect(new URL("/login", req.url));
  }

  if (CITIZEN_PROTECTED.some((p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + "/"))) {
    const citizenToken = req.cookies.get("smartvil_citizen")?.value;
    if (!citizenToken) return NextResponse.redirect(new URL("/masuk", req.url));
    const payload = await verifyJwt(citizenToken, JWT_SECRET);
    if (!payload || payload.role !== "warga") return NextResponse.redirect(new URL("/masuk", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
