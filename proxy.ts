import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "rd_session";
const GATE_COOKIE = "rd_gate";

function secret() {
  const s =
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev-only-insecure-session-secret-do-not-use-in-prod"
      : null);
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}

async function isValidSession(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Site-wide shared-password gate. Everything sits behind this.
  const gateOk = await isValidSession(req.cookies.get(GATE_COOKIE)?.value);
  if (!gateOk) {
    if (pathname === "/enter") return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/enter";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Already past the gate — no reason to show the gate page again.
  if (pathname === "/enter") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Admin requires its own login on top of the site gate.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const adminOk = await isValidSession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!adminOk) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on every request except Next internals and static assets
    // (the public marketing pages have no file extension, so they match).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:mp4|jpg|jpeg|png|gif|svg|webp|ico|css|js|txt|xml|woff|woff2|ttf)).*)",
  ],
};
