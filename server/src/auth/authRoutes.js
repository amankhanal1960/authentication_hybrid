import express from "express";
import {
  logoutUser,
  refreshAccessToken,
  googleOAuth,
} from "./authController.js";

const router = express.Router();

router.post("/google", googleOAuth);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

export default router;
