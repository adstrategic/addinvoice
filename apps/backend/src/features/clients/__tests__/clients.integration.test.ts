import { prisma } from "@addinvoice/db";
import express from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { errorHandler } from "../../../core/middleware.js";
import { clientsRoutes } from "../clients.routes.js";

/** Response shape for GET/POST/PATCH /clients (single client) */
interface ClientResponse {
  data: {
    [key: string]: unknown;
    email: string;
    name: string;
    sequence: number;
    workspaceId: number;
  };
}

/** Response shape for GET /clients (list) */
interface ListClientsResponse {
  data: {
    [key: string]: unknown;
    email?: string;
    name: string;
    sequence: number;
  }[];
  pagination: { limit: number; page: number; total: number; totalPages: number };
}

const TEST_WORKSPACE_CLERK_ID = "test-integration-clients";

function createTestApp(workspaceId: number) {
  const app = express();
  app.use(express.json());
  app.use((req: express.Request & { workspaceId?: number }, _res, next) => {
    req.workspaceId = workspaceId;
    next();
  });
  app.use("/clients", clientsRoutes);
  app.use(errorHandler);
  return app;
}

describe.skipIf(!process.env.DATABASE_URL_TEST)(
  "Clients API integration",
  () => {
    let app: express.Express;
    let testWorkspaceId: number;
    let otherWorkspaceId: number;

    beforeAll(async () => {
      const workspace = await prisma.workspace.upsert({
        create: {
          clerkId: TEST_WORKSPACE_CLERK_ID,
          name: "Test Workspace",
        },
        update: {},
        where: { clerkId: TEST_WORKSPACE_CLERK_ID },
      });
      testWorkspaceId = workspace.id;

      const other = await prisma.workspace.upsert({
        create: {
          clerkId: "test-integration-clients-other",
          name: "Other Workspace",
        },
        update: {},
        where: { clerkId: "test-integration-clients-other" },
      });
      otherWorkspaceId = other.id;

      app = createTestApp(testWorkspaceId);
    });

    afterEach(async () => {
      await prisma.client.deleteMany({
        where: { workspaceId: testWorkspaceId },
      });
      await prisma.client.deleteMany({
        where: { workspaceId: otherWorkspaceId },
      });
    });

    afterAll(async () => {
      await prisma.client.deleteMany({
        where: { workspaceId: testWorkspaceId },
      });
      await prisma.client.deleteMany({
        where: { workspaceId: otherWorkspaceId },
      });
      await prisma.workspace.deleteMany({
        where: {
          clerkId: {
            in: [TEST_WORKSPACE_CLERK_ID, "test-integration-clients-other"],
          },
        },
      });
      await prisma.$disconnect();
    });

    describe("GET /clients", () => {
      it("returns 200 with data array and pagination", async () => {
        const res = await request(app).get("/clients").expect(200);
        const body = res.body as ListClientsResponse;

        expect(body).toHaveProperty("data");
        expect(Array.isArray(body.data)).toBe(true);
        expect(body).toHaveProperty("pagination");
        expect(body.pagination).toEqual({
          limit: 10,
          page: 1,
          total: 0,
          totalPages: 0,
        });
      });

      it("returns created client in list", async () => {
        await prisma.client.create({
          data: {
            email: "acme@test.com",
            name: "Acme",
            sequence: 1,
            workspaceId: testWorkspaceId,
          },
        });

        const res = await request(app).get("/clients").expect(200);
        const body = res.body as ListClientsResponse;

        expect(body.data).toHaveLength(1);
        const first = body.data[0];
        expect(first).toBeDefined();
        if (first) expect(first.name).toBe("Acme");
        expect(body.pagination.total).toBe(1);
        expect(body.pagination.totalPages).toBe(1);
      });

      it("returns 400 for invalid query (page=0)", async () => {
        await request(app).get("/clients").query({ page: 0 }).expect(400);
      });
    });

    describe("GET /clients/:sequence", () => {
      it("returns 200 and data when client exists", async () => {
        await prisma.client.create({
          data: {
            email: "acme@test.com",
            name: "Acme",
            sequence: 1,
            workspaceId: testWorkspaceId,
          },
        });

        const res = await request(app).get("/clients/1").expect(200);
        const body = res.body as ClientResponse;

        expect(body).toHaveProperty("data");
        expect(body.data.name).toBe("Acme");
        expect(body.data.sequence).toBe(1);
      });

      it("returns 404 when client not found", async () => {
        await request(app).get("/clients/999").expect(404);
      });
    });

    describe("POST /clients", () => {
      it("returns 201 and created client data", async () => {
        const res = await request(app)
          .post("/clients")
          .send({ email: "new@test.com", name: "New Client" })
          .expect(201);

        const body = res.body as ClientResponse;
        expect(body).toHaveProperty("data");
        expect(body.data.name).toBe("New Client");
        expect(body.data.email).toBe("new@test.com");
        expect(body.data.workspaceId).toBe(testWorkspaceId);
        expect(typeof body.data.sequence).toBe("number");

        const inDb = await prisma.client.findFirst({
          where: { email: "new@test.com", workspaceId: testWorkspaceId },
        });
        expect(inDb).not.toBeNull();
        expect(inDb?.name).toBe("New Client");
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
          .send({ email: "not-an-email", name: "X" })
          .expect(400);
      });
    });

    describe("PATCH /clients/:id", () => {
      it("returns 200 and updated data when valid", async () => {
        const created = await prisma.client.create({
          data: {
            email: "original@test.com",
            name: "Original",
            sequence: 1,
            workspaceId: testWorkspaceId,
          },
        });

        const res = await request(app)
          .patch(`/clients/${String(created.id)}`)
          .send({ name: "Updated" })
          .expect(200);

        const body = res.body as ClientResponse;
        expect(body.data.name).toBe("Updated");
        expect(body.data.email).toBe("original@test.com");

        const inDb = await prisma.client.findUnique({
          where: { id: created.id },
        });
        expect(inDb?.name).toBe("Updated");
      });

      it("returns 404 when client belongs to another workspace", async () => {
        const otherClient = await prisma.client.create({
          data: {
            email: "other@test.com",
            name: "Other",
            sequence: 1,
            workspaceId: otherWorkspaceId,
          },
        });

        await request(app)
          .patch(`/clients/${String(otherClient.id)}`)
          .send({ name: "X" })
          .expect(404);

        const inDb = await prisma.client.findUnique({
          where: { id: otherClient.id },
        });
        expect(inDb?.name).toBe("Other");
      });

      it("returns 400 when body invalid", async () => {
        const created = await prisma.client.create({
          data: {
            email: "original@test.com",
            name: "Original",
            sequence: 1,
            workspaceId: testWorkspaceId,
          },
        });

        await request(app)
          .patch(`/clients/${String(created.id)}`)
          .send({ email: "invalid" })
          .expect(400);
      });
    });

    describe("DELETE /clients/:id", () => {
      it("returns 204 when client exists in workspace", async () => {
        const created = await prisma.client.create({
          data: {
            email: "delete@test.com",
            name: "To Delete",
            sequence: 1,
            workspaceId: testWorkspaceId,
          },
        });

        await request(app).delete(`/clients/${String(created.id)}`).expect(204);

        const inDb = await prisma.client.findUnique({
          where: { id: created.id },
        });
        expect(inDb).toBeNull();
      });

      it("returns 404 when client not found", async () => {
        await request(app).delete("/clients/999999").expect(404);
      });

      it("returns 404 when client belongs to another workspace", async () => {
        const otherClient = await prisma.client.create({
          data: {
            email: "other@test.com",
            name: "Other",
            sequence: 1,
            workspaceId: otherWorkspaceId,
          },
        });

        await request(app).delete(`/clients/${String(otherClient.id)}`).expect(404);

        const inDb = await prisma.client.findUnique({
          where: { id: otherClient.id },
        });
        expect(inDb).not.toBeNull();
      });
    });
  },
);
