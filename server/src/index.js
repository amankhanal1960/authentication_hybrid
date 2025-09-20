import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./user/userRoutes.js";
import authRoutes from "./auth/authRoutes.js";

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// CORS configuration - FIXED
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://authenticationclient.vercel.app",
  "http://localhost:3000", // For local development
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Handle preflight requests
app.options("*", cors());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);

app.listen(4000, () => {
  console.log("Server listening on http://localhost:4000");
});
