import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./user/userRoutes.js";
import authRoutes from "./auth/authRoutes.js";

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// Enhanced CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://authenticationclient.vercel.app",
  "http://localhost:3000",
  "https://authentication-js-client.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  optionsSuccessStatus: 200,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicitly handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware for CORS errors
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    res.status(403).json({
      error: "CORS policy denied this request",
      details: "Origin not in allowed list",
    });
  } else {
    next(err);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
