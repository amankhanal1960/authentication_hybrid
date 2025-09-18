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
};
