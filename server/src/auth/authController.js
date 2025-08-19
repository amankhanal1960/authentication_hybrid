import db from "../lib/db.js";
import crypto from "crypto";

import {
  verifyRefreshToken,
  generateAccessToken,
  refreshTokenCookieOptions,
  rotateRefreshToken,
} from "../utils/tokens.js";

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
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
