import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Dashboard route protection
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("smartvil_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
