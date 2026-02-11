import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandler } from "../../core/middleware";
import { clientsRoutes } from "./clients.routes";

let mockTx: {
  client: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

vi.mock("../../core/db", () => {
  const client = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  };
  const $transaction = vi.fn((cb: (tx: unknown) => Promise<unknown>) => {
    mockTx = { client: { ...client } };
    return cb(mockTx);
  });
  return {
    prisma: {
      client,
      $transaction,
    },
  };
});

import { prisma } from "../../core/db";

const mockClientEntity = {
  id: 1,
  workspaceId: 1,
  sequence: 1,
  name: "Acme",
  email: "acme@test.com",
  phone: null,
  address: null,
  nit: null,
  businessName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req: express.Request & { workspaceId?: number }, _res, next) => {
    req.workspaceId = 1;
    next();
  });
  app.use("/clients", clientsRoutes);
  app.use(errorHandler);
  return app;
}

describe("Clients API integration", () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.mocked(prisma.client.findMany).mockResolvedValue([]);
    vi.mocked(prisma.client.count).mockResolvedValue(0);
    vi.mocked(prisma.client.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        mockTx = {
          client: {
            findMany: vi.fn().mockResolvedValue([]),
            findFirst: vi.fn().mockResolvedValue(null),
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockClientEntity),
            update: vi.fn().mockResolvedValue(mockClientEntity),
            count: vi.fn().mockResolvedValue(0),
            delete: vi.fn().mockResolvedValue(mockClientEntity),
          },
        };
        return cb(mockTx);
      },
    );
  });

  describe("GET /clients", () => {
    it("returns 200 with data array and pagination", async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValue([mockClientEntity]);
      vi.mocked(prisma.client.count).mockResolvedValue(1);

      const res = await request(app).get("/clients").expect(200);

      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("returns 400 for invalid query (page=0)", async () => {
      await request(app).get("/clients").query({ page: 0 }).expect(400);
    });
  });

  describe("GET /clients/:sequence", () => {
    it("returns 200 and data when client exists", async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValue(mockClientEntity);

      const res = await request(app).get("/clients/1").expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body.data.name).toBe("Acme");
    });

    it("returns 404 when client not found", async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValue(null);

      await request(app).get("/clients/999").expect(404);
    });
  });

  describe("POST /clients", () => {
    it("returns 201 and created client data", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          mockTx = {
            client: {
              findMany: vi.fn(),
              findFirst: vi.fn().mockResolvedValue(null),
              findUnique: vi.fn(),
              create: vi.fn().mockResolvedValue({
                ...mockClientEntity,
                name: "New Client",
                email: "new@test.com",
              }),
              update: vi.fn(),
              count: vi.fn(),
              delete: vi.fn(),
            },
          };
          return cb(mockTx);
        },
      );

      const res = await request(app)
        .post("/clients")
        .send({ name: "New Client", email: "new@test.com" })
        .expect(201);

      expect(res.body).toHaveProperty("data");
      expect(res.body.data.name).toBe("New Client");
      expect(res.body.data.email).toBe("new@test.com");
    });

    it("returns 400 when body invalid (missing name)", async () => {
      await request(app)
        .post("/clients")
        .send({ email: "only@test.com" })
        .expect(400);
    });

    it("returns 400 when email invalid", async () => {
      await request(app)
        .post("/clients")
        .send({ name: "X", email: "not-an-email" })
        .expect(400);
    });
  });

  describe("PATCH /clients/:id", () => {
    it("returns 200 and updated data when valid", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          mockTx = {
            client: {
              findMany: vi.fn(),
              findFirst: vi.fn(),
              findUnique: vi.fn().mockResolvedValue({
                ...mockClientEntity,
                workspaceId: 1,
              }),
              create: vi.fn(),
              update: vi.fn().mockResolvedValue({
                ...mockClientEntity,
                name: "Updated",
              }),
              count: vi.fn(),
              delete: vi.fn(),
            },
          };
          return cb(mockTx);
        },
      );

      const res = await request(app)
        .patch("/clients/1")
        .send({ name: "Updated" })
        .expect(200);

      expect(res.body.data.name).toBe("Updated");
    });

    it("returns 404 when client belongs to another workspace", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          mockTx = {
            client: {
              findMany: vi.fn(),
              findFirst: vi.fn(),
              findUnique: vi.fn().mockResolvedValue({
                ...mockClientEntity,
                id: 1,
                workspaceId: 2,
              }),
              create: vi.fn(),
              update: vi.fn(),
              count: vi.fn(),
              delete: vi.fn(),
            },
          };
          return cb(mockTx);
        },
      );

      await request(app).patch("/clients/1").send({ name: "X" }).expect(404);
    });

    it("returns 400 when body invalid", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          mockTx = {
            client: {
              findMany: vi.fn(),
              findFirst: vi.fn(),
              findUnique: vi.fn().mockResolvedValue({
                ...mockClientEntity,
                workspaceId: 1,
              }),
              create: vi.fn(),
              update: vi.fn(),
              count: vi.fn(),
              delete: vi.fn(),
            },
          };
          return cb(mockTx);
        },
      );

      await request(app)
        .patch("/clients/1")
        .send({ email: "invalid" })
        .expect(400);
    });
  });

  describe("DELETE /clients/:id", () => {
    it("returns 204 when client exists in workspace", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          mockTx = {
            client: {
              findMany: vi.fn(),
              findFirst: vi.fn(),
              findUnique: vi.fn().mockResolvedValue({
                ...mockClientEntity,
                workspaceId: 1,
              }),
              create: vi.fn(),
              update: vi.fn(),
              count: vi.fn(),
              delete: vi.fn().mockResolvedValue(mockClientEntity),
            },
          };
          return cb(mockTx);
        },
      );

      await request(app).delete("/clients/1").expect(204);
    });

    it("returns 404 when client not found", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          mockTx = {
            client: {
              findMany: vi.fn(),
              findFirst: vi.fn(),
              findUnique: vi.fn().mockResolvedValue(null),
              create: vi.fn(),
              update: vi.fn(),
              count: vi.fn(),
              delete: vi.fn(),
            },
          };
          return cb(mockTx);
        },
      );

      await request(app).delete("/clients/999").expect(404);
    });
  });
});
