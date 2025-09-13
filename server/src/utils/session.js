import { serialize } from "cookie";
import { sign, verify } from "jsonwebtoken";

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET;
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function createSession(user, res) {
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

  const sessionCookie = serialize("auth-session", sessionToken, {
    maxAge: SESSION_MAX_AGE,
    expiresIn: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  res.setHeader("Set-Cookie", sessionCookie);
  return sessionToken;
}

export function verifySession(req) {
  const cookies = req.cookies || {};
  const sessionToken = cookies["auth-session"];

  if (!sessionToken) return null;

  try {
    return verify(sessionToken, SESSION_SECRET);
  } catch (error) {
    return null;
  }
}

export function clearSession(res) {
  const sessionCookie = serialize("auth-session", "", {
    maxAge: -1,
    path: "/",
  });

  res.setHeader("Set-Cookie", sessionCookie);
}
