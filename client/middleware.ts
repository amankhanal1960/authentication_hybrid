// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths:url that should be allowed without the authentication
const PUBLIC_PATHS = ["/", "/auth/login", "/auth/register"];

// Cookie names that actually represent an authenticated session
// If any of these cookies are present in the request, the middleware will treat the request as authenticated (UX-level).
const SESSION_COOKIE_NAMES = [
  "auth-session", // your custom session cookie
  "next-auth.session-token", // NextAuth (dev / non-prefixed)
  "__Secure-next-auth.session-token", // NextAuth (secure, production)
  "authjs.session-token", // Auth.js v5 format
  "__Host-authjs.session-token", // Auth.js v5 secure format
];

function isPublic(pathname: string) {
  // exact match for root
  if (pathname === "/") return true;

  // allow other public prefixes
  return PUBLIC_PATHS.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p))
  );
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("[MIDDLEWARE] Processing path:", pathname);
  console.log(
    "[MIDDLEWARE] All cookies:",
    req.cookies
      .getAll()
      .map((c) => ({ name: c.name, value: c.value?.substring(0, 20) + "..." }))
  );

  if (isPublic(pathname)) {
    console.log("[MIDDLEWARE] public path allow:", pathname);
    return NextResponse.next();
  }

  let foundSessionCookie = false;
  for (const name of SESSION_COOKIE_NAMES) {
    const cookie = req.cookies.get(name);
    if (cookie) {
      console.log(
        "[MIDDLEWARE] Found session cookie:",
        name,
        "value length:",
        cookie.value?.length
      );
      foundSessionCookie = true;
      break;
    }
  }

  if (!foundSessionCookie) {
    // Check for any cookie that might indicate authentication
    const allCookies = req.cookies.getAll();
    const authCookies = allCookies.filter(
      (cookie) =>
        cookie.name.includes("auth") ||
        cookie.name.includes("session") ||
        cookie.name.includes("token")
    );

    console.log(
      "[MIDDLEWARE] No standard session cookies found. Auth-related cookies:",
      authCookies.map((c) => c.name)
    );

    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      console.log("[MIDDLEWARE] Found Authorization header");
      foundSessionCookie = true;
    }
  }

  if (foundSessionCookie) {
    console.log("[MIDDLEWARE] Authentication successful, allowing access");
    return NextResponse.next();
  }

  console.log("[MIDDLEWARE] No authentication found, redirecting to login");
  const url = req.nextUrl.clone();
  url.pathname = "/auth/login";
  url.search = `?from=${encodeURIComponent(pathname)}`;

  const response = NextResponse.redirect(url);

  response.headers.set("X-Middleware-Redirect-Reason", "no-session-cookie");
  response.headers.set(
    "X-Middleware-Checked-Cookies",
    SESSION_COOKIE_NAMES.join(",")
  );

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
