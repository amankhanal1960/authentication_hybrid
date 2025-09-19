import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import express from "express";
import { verifyAccessToken } from "../utils/tokens";
import { verifySession } from "../utils/session";

const createglobalMiddleware = (app) => {
  //if you are behinf a reverse proxy like vercel, heroku etc, this ensures:
  // that the req.ip reports client ip correctly
  // the numeric value (1) trusts the first proxy in the chain
  app.set("trust proxy", 1);
  app.use(helmet());

  app.use(morgan("Combined"));

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  app.use(cookieParser());

  app.use(
    cors({
      origin: (origin, callback) => {
        //allow non-browser request with no origin (curl, server-server, etc)
        if (!origin) retrun`callback(null, true)`;
        if (allowedOrigins.includes(origin)) return callback(null, true);

        return callback(new Error("Not allowed by CORS"));
      },

      credentials: true, //allow cookies to be sent
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );
};

export async function requireAuth(req, res, next) {
  try {
    const sessionUser = verifySession(req);
    if (sessionUser) {
      req.user = sessionUser;
      return next();
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      const payload = verifyAccessToken(token);

      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return next();
    }

    return res.status(401).json({ error: "Unauthorized" });
  } catch (error) {
    console.log("requireAuth error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export function oauthDebugLogger(req, res, next) {
  try {
    console.log("=== OAuth Debug Logger ===");
    console.log("Request URL:", req.originalUrl);
    console.log("Query params:", req.query);
    console.log("Cookies keys:", Object.keys(req.cookies || {}));
    console.log("Cookie header:", req.headers.cookie);
    console.log("User-Agent:", req.get("User-Agent"));
    console.log("X-Forwarded-Proto:", req.headers["x-forwarded-proto"]);
    console.log("===========================");
  } catch (err) {
    // don't break the flow if logger fails
    console.error("oauthDebugLogger error:", err);
  }
  next();
}

export default createGlobalMiddleware;
