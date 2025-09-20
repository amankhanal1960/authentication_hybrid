import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./user/userRoutes.js";
import authRoutes from "./auth/authRoutes.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    
    credentials: true,
  })
);

app.use("/api/user", userRoutes);

app.use("/api/auth", authRoutes);

app.listen(4000, () => {
  console.log("Server listening on http://localhost:4000");
});
