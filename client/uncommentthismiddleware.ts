// // middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// // Public paths:url that should be allowed without the authentication
// const PUBLIC_PATHS = ["/", "/auth/login", "/auth/register"];

// // Cookie names that actually represent an authenticated session
// // If any of these cookies are present in the request, the middleware will treat the request as authenticated (UX-level).
// const SESSION_COOKIE_NAMES = [
//   "auth-session", // your custom session cookie
//   "next-auth.session-token", // NextAuth (dev / non-prefixed)
//   "__Secure-next-auth.session-token", // NextAuth (secure, production)
// ];
// function isPublic(pathname: string) {
//   // exact match for root
//   if (pathname === "/") return true;

//   // allow other public prefixes
//   return PUBLIC_PATHS.some(
//     (p) => p !== "/" && (pathname === p || pathname.startsWith(p))
//   );
// }

// export default function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;
//   if (isPublic(pathname)) {
//     console.log("[MIDDLEWARE] public path allow:", pathname);
//     return NextResponse.next();
//   }

//   // Only allow if a real session cookie exists
//   for (const name of SESSION_COOKIE_NAMES) {
//     if (req.cookies.get(name)) {
//       console.log("[MIDDLEWARE] allowed by session cookie:", name);
//       return NextResponse.next();
//     }
//   }

//   const url = req.nextUrl.clone();
//   url.pathname = "/auth/login";
//   url.search = `?from=${encodeURIComponent(pathname)}`;
//   return NextResponse.redirect(url);
// }

// export const config = {
//   matcher: ["/dashboard/:path*"],
// };
