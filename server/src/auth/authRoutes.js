import express from "express";
import {
  logoutUser,
  refreshAccessToken,
  handleGoogleOAuth,
} from "./authController.js";

const router = express.Router();

router.post("/google", handleGoogleOAuth);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

export default router;
