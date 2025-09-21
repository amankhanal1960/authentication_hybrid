import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/emailService.js";
import db from "../lib/db.js";

export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const normalizedEmail = string(email).toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    if (user) {
      await db.passwordReset.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      await db.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          used: false,
          userAgent: req.get("User-Agent") || null,
          ipAddress:
            (req.headers["x-forwarded-for"] || req.ip || "")
              .toString()
              .split(",")[0]
              .trim() || null,
        },
      });

      const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontend.replace(
        /\/$/,
        ""
      )}/reset-password?token=${encodeURIComponent(
        rawToken
      )}&email=${encodeURIComponent(normalizedEmail)}`;

      try {
        await sendPasswordResetEmail(normalizedEmail, resetUrl, {
          ttlMinutes: RESET_TOKEN_TTL_MINUTES,
        });
      } catch (error) {
        console.error("Error sending password reset email:", error);
      }

      if (!process.env.SMTP_HOST) {
        console.log(
          `[DEV] Password reset token for ${normalizedEmail}: ${rawToken} (valid ${RESET_TOKEN_TTL_MINUTES}m)`
        );
      }
    }

    return res.json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    console.error("requestPasswordReset error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
