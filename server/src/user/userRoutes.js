import express from "express";
import { registerUser } from "./userController.js";

const router = express.Router();

router.post("/register", registerUser);

export default router;
