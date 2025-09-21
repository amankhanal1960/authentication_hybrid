import express from "express";
import { requestPasswordReset } from "./passwordController.js";

const router = express.Router();

router.post("/forgot-password", requestPasswordReset);

export default router;
