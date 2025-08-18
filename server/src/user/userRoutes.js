import express from "express";
import {
  registerUser,
  generateOTP,
  verifyEmailOTP,
  resendVerifyEmailOTP,
} from "./userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/generate-otp", generateOTP);
router.post("/verify-otp", verifyEmailOTP);
router.post("/resend-otp", resendVerifyEmailOTP);
router.post("/login", loginUser);

export default router;
