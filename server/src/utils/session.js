import { serialize, parse } from "cookie";
import jwt from "jsonwebtoken";

const { sign, verify } = jwt;

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET or JWT_SECRET must be set in env");
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function createSession(user, res) {
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = process.env.VERCEL === "1";

  const sessionToken = sign(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
    },
    SESSION_SECRET,
    { expiresIn: SESSION_MAX_AGE }
  );

  // For Vercel deployments, we need specific cookie settings
  const sessionCookie = serialize("auth-session", sessionToken, {
    maxAge: SESSION_MAX_AGE,
    expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    httpOnly: true,
    path: "/",
    sameSite: isProduction ? "none" : "lax", // "none" for cross-origin in production
    secure: isProduction, // true for HTTPS in production
    domain: isProduction ? ".vercel.app" : undefined, // Allow across all Vercel subdomains
  });

  const existing = res.getHeader && res.getHeader("Set-Cookie");
  if (existing) {
    const arr = Array.isArray(existing) ? existing : [existing];
    res.setHeader("Set-Cookie", [...arr, sessionCookie]);
  } else {
    res.setHeader("Set-Cookie", sessionCookie);
  }

  return sessionToken;
}

export function verifySession(req) {
  const cookies =
    req.cookies ||
    (req.headers && req.headers.cookie ? parse(req.headers.cookie) : {});
  const sessionToken = cookies["auth-session"];

  if (!sessionToken) return null;

  try {
    const decoded = verify(sessionToken, SESSION_SECRET);
    return decoded && decoded.user ? decoded.user : decoded;
  } catch (error) {
    return null;
  }
}

export function clearSession(res) {
  const isProduction = process.env.NODE_ENV === "production";

  const sessionCookie = serialize("auth-session", "", {
    maxAge: -1,
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
  });

  const existing = res.getHeader && res.getHeader("Set-Cookie");
  if (existing) {
    const arr = Array.isArray(existing) ? existing : [existing];
    res.setHeader("Set-Cookie", [...arr, sessionCookie]);
  } else {
    res.setHeader("Set-Cookie", sessionCookie);
  }
}
