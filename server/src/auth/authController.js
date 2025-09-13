import db from "../lib/db.js";
import crypto from "crypto";

import {
  verifyRefreshToken,
  generateAccessToken,
  refreshTokenCookieOptions,
  rotateRefreshToken,
  generateRefreshToken,
} from "../utils/tokens.js";
import { clearSession } from "../utils/session.js";

export async function handleGoogleOAuth(req, res) {
  try {
    const { email, name, googleId, image } = req.body;

    if (!email || !googleId) {
      return res
        .status(400)
        .json({ error: "Email and Google ID are required" });
    }

    const normalizedEmail = email.toLowerCase();

    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: name,
            avatarUrl: image,
            isEmailVerified: true,
          },
        });

        await tx.account.create({
          data: {
            userId: user.id,
            provider: "google",
            providerAccountId: googleId,
          },
        });

        return user;
      });
    } else {
      const existingAccount = await db.account.findFirst({
        where: {
          userId: user.id,
          provider: "google",
        },
      });

      if (!existingAccount) {
        await db.account.create({
          data: {
            userId: user.id,
            provider: "google",
            providerAccountId: googleId,
          },
        });
      }
    }

    const meta = {
      userAgent: req.get("User-Agent") || null,
      ip: req.ip || req.headers["x-forwarded-for"] || null,
    };

    const refreshTokenRaw = await generateRefreshToken(user, meta);
    const accessToken = generateAccessToken(user);

    res.cookie("refreshToken", refreshTokenRaw, refreshTokenCookieOptions());

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({ error: "User already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function refreshAccessToken(req, res) {
  try {
    const raw = req.cookies?.refreshToken;
    if (!raw) return res.status(401).json({ error: "No refresh token" });

    const rec = await verifyRefreshToken(raw);

    if (!rec) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    const user = rec.user;
    const newRaw = await rotateRefreshToken(raw, {
      userId: user.id,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    const accessToken = generateAccessToken(user);

    res.cookie("refreshToken", newRaw, refreshTokenCookieOptions());

    return res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function logoutUser(req, res) {
  try {
    const raw = req.cookies?.refreshToken;

    if (raw) {
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      await db.refreshToken.updateMany({
        where: { tokenHash: hash },
        data: { revoked: true },
      });
    }

    //clear the session from the credentials
    clearSession(res);

    res.clearCookie("refreshToken", { path: "/" });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
