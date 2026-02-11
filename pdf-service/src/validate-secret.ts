import { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";

const HEADER_NAME = "x-pdf-service-key";

/**
 * Middleware: requires X-PDF-Service-Key header to match PDF_SERVICE_SECRET.
 * Uses constant-time comparison to avoid timing attacks.
 */
export function requirePdfServiceSecret(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const rawSecret = process.env.PDF_SERVICE_SECRET;
  const secret = typeof rawSecret === "string" ? rawSecret.trim() : "";
  const rawProvided = req.headers[HEADER_NAME];
  const provided =
    typeof rawProvided === "string" ? rawProvided.trim() : rawProvided;

  if (!secret || secret.length === 0) {
    res.status(500).json({ error: "PDF service not configured" });
    return;
  }

  if (typeof provided !== "string") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const secretBuf = Buffer.from(secret, "utf8");
    const providedBuf = Buffer.from(provided, "utf8");
    const sameLength = secretBuf.length === providedBuf.length;

    if (!sameLength) {
      res.status(401).json({
        error: "Unauthorized",
        message:
          "PDF_SERVICE_SECRET length mismatch: ensure backend and pdf-service use the exact same value in their .env files (no extra spaces, quotes, or newlines).",
      });
      return;
    }
    if (!timingSafeEqual(secretBuf, providedBuf)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
