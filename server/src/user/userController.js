import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../lib/db.js";
import {
  sendOTPEmail,
  sendVerificationSuccessEmail,
} from "../lib/emailService.js";

export async function generateOTP(userId, email) {
  const buffer = crypto.randomBytes(4);
  const hex = buffer.toString("hex");
  const num = parseInt(hex, 16);
  const otp = (num % 1000000).toString().padStart(6, "0");

  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutes

  await db.emailOTP.create({
    data: {
      email,
      otpHash,
      expiresAt,
      userId,
    },
  });

  //send email with the OTP
  await sendOTPEmail(email, otp);

  return otp;
}

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required!" });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    await db.account.create({
      data: {
        provider: "credentials",
        providerAccountId: newUser.email,
        userId: newUser.id,
      },
    });

    // Generate OTP for email verification
    await generateOTP(newUser.id, newUser.email);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function verifyEmailOTP(req, res) {
  try {
    const { otp, email, userId } = req.body;
    if (!otp || !email || !userId) {
      return res
        .status(400)
        .json({ error: "OTP, email, and userId are required!" });
    }

    const normalizedEmail = email.toLowerCase();

    const OTPRecord = await db.emailOTP.findFirst({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    });

    if (!OTPRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP!" });
    }

    const isValid = await bcrypt.compare(otp, OTPRecord.otpHash);
    if (!isValid) {
      //Track failed attempts
      await db.emailOTP.update({
        where: { id: OTPRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({ error: "Invalid OTP!" });
    }

    await db.emailOTP.update({
      where: { id: OTPRecord.id },
      data: { used: true },
    }),
      db.user.update({
        where: { email: normalizedEmail },
        data: { isEmailVerified: true },
      });

    await sendVerificationSuccessEmail(normalizedEmail);

    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("Email verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function resendVerifyEmailOTP(req, res) {
  try {
    const { email, userId } = req.body;

    if (!email || !userId) {
      return res.status(400).json({ error: "Email and userId are required!" });
    }
    const normalizedEmail = email.toLowerCase();
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email already verified!" });
    }

    await db.emailOTP.updateMany({
      where: { normalizedEmail, userId, used: false },
      data: { revoked: true },
    });

    await generateOTP(userId, email);
    return res.status(200).json({ message: "New OTP sent successfully!" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
