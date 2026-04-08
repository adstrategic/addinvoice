import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import prismaMock from "../../../core/__mocks__/db.js";
import { workspaceRoutes } from "../workspace.routes.js";
import { livekitRouter } from "../../../routes/livekit.routes.js";

vi.mock("@addinvoice/db", () =>
  import("../../../core/__mocks__/db.js").then((m) => ({
    prisma: m.default,
    Prisma: {},
  })),
);

function decodeJwtPayload(token: string): unknown {
  const parts = token.split(".");
  const payloadPart = parts[1];
  const payloadJson = Buffer.from(payloadPart, "base64url").toString("utf8");
  return JSON.parse(payloadJson);
}

describe("workspace language + livekit metadata", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /workspace/language returns current language", async () => {
    prismaMock.workspace.findUnique.mockResolvedValue({
      language: "es",
    });

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).workspaceId = 1;
      next();
    });
    app.use("/workspace", workspaceRoutes);

    const res = await request(app).get("/workspace/language");
    expect(res.status).toBe(200);
    expect(res.body.data.language).toBe("es");
  });

  it("PUT /workspace/language updates language", async () => {
    prismaMock.workspace.update.mockResolvedValue({
      language: "en",
    });

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).workspaceId = 1;
      next();
    });
    app.use("/workspace", workspaceRoutes);

    const res = await request(app)
      .put("/workspace/language")
      .send({ language: "en" });

    expect(res.status).toBe(200);
    expect(res.body.data.language).toBe("en");
  });

  it("POST /livekit/token includes workspace language in roomConfig metadata", async () => {
    process.env.LIVEKIT_API_KEY = "key";
    process.env.LIVEKIT_API_SECRET = "secret";
    process.env.LIVEKIT_URL = "wss://example.com";

    prismaMock.workspace.findUnique.mockResolvedValue({
      language: "es",
    });

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).workspaceId = 1;
      (req as any).userId = "user-1";
      next();
    });
    app.use("/livekit", livekitRouter);

    const res = await request(app)
      .post("/livekit/token")
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.participant_token).toBeTruthy();

    const decoded = decodeJwtPayload(res.body.participant_token);
    const decodedAny = decoded as any;
    expect(typeof decodedAny.metadata).toBe("string");

    const metadata = JSON.parse(decodedAny.metadata as string);
    expect(metadata.language).toBe("es");
  });
});

