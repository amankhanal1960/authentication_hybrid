import express from "express";
import { logoutUser, refreshAccessToken } from "./authController.js";
// import { getSession } from "../auth/authController.js";

const router = express.Router();

router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
// router.get("/session", getSession); //not done yet

export default router;
