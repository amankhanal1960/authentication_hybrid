// middleware.ts
import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

/**
 * This middleware redirects unauthenticated users to your sign-in page.
 * It uses next-auth's token detection (server side).
 */
export default withAuth(
  function middleware(req: NextRequest) {
    // You can add more logic if you want, e.g. logging or role checks
  },
  {
    callbacks: {
      // If you want to restrict by role, use the token (if you include roles in JWT)
      authorized: ({ token }) => {
        // allow if token exists (logged-in)
        return !!token;
        // Example restricting to admin:
        // return token?.role === "admin";
      },
    },
  }
);

// protect specific routes (matcher)
export const config = {
  matcher: [
    "/dashboard/:path*", // all /dashboard routes
    "/settings/:path*", // add more as needed
  ],
};
