import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler, apiRateLimiter } from "./core/middleware";
import { apiRouter } from "./routes";
import { clerkMiddleware } from "@clerk/express";

const app = express();
const PORT = process.env.PORT || 4000;

// Global middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(clerkMiddleware());

app.use(express.json());

// Rate limiting
app.use("/api", apiRateLimiter);

// API routes
app.use("/api/v1", apiRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
