import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandler } from "../../../core/middleware";
import { clientsRoutes } from "../clients.routes";
import prisma from "../../../core/db";

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
        where: { clerkId: TEST_WORKSPACE_CLERK_ID },
        create: {
          clerkId: TEST_WORKSPACE_CLERK_ID,
          name: "Test Workspace",
        },
        update: {},
      });
      testWorkspaceId = workspace.id;

      const other = await prisma.workspace.upsert({
        where: { clerkId: "test-integration-clients-other" },
        create: {
          clerkId: "test-integration-clients-other",
          name: "Other Workspace",
        },
        update: {},
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

        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body).toHaveProperty("pagination");
        expect(res.body.pagination).toEqual({
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        });
      });

      it("returns created client in list", async () => {
        await prisma.client.create({
          data: {
            workspaceId: testWorkspaceId,
            sequence: 1,
            name: "Acme",
            email: "acme@test.com",
          },
        });

        const res = await request(app).get("/clients").expect(200);

        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe("Acme");
        expect(res.body.pagination.total).toBe(1);
        expect(res.body.pagination.totalPages).toBe(1);
      });

      it("returns 400 for invalid query (page=0)", async () => {
        await request(app).get("/clients").query({ page: 0 }).expect(400);
      });
    });

    describe("GET /clients/:sequence", () => {
      it("returns 200 and data when client exists", async () => {
        await prisma.client.create({
          data: {
            workspaceId: testWorkspaceId,
            sequence: 1,
            name: "Acme",
            email: "acme@test.com",
          },
        });

        const res = await request(app).get("/clients/1").expect(200);

        expect(res.body).toHaveProperty("data");
        expect(res.body.data.name).toBe("Acme");
        expect(res.body.data.sequence).toBe(1);
      });

      it("returns 404 when client not found", async () => {
        await request(app).get("/clients/999").expect(404);
      });
    });

    describe("POST /clients", () => {
      it("returns 201 and created client data", async () => {
        const res = await request(app)
          .post("/clients")
          .send({ name: "New Client", email: "new@test.com" })
          .expect(201);

        expect(res.body).toHaveProperty("data");
        expect(res.body.data.name).toBe("New Client");
        expect(res.body.data.email).toBe("new@test.com");
        expect(res.body.data.workspaceId).toBe(testWorkspaceId);
        expect(typeof res.body.data.sequence).toBe("number");

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
          .send({ name: "X", email: "not-an-email" })
          .expect(400);
      });
    });

    describe("PATCH /clients/:id", () => {
      it("returns 200 and updated data when valid", async () => {
        const created = await prisma.client.create({
          data: {
            workspaceId: testWorkspaceId,
            sequence: 1,
            name: "Original",
            email: "original@test.com",
          },
        });

        const res = await request(app)
          .patch(`/clients/${created.id}`)
          .send({ name: "Updated" })
          .expect(200);

        expect(res.body.data.name).toBe("Updated");
        expect(res.body.data.email).toBe("original@test.com");

        const inDb = await prisma.client.findUnique({
          where: { id: created.id },
        });
        expect(inDb?.name).toBe("Updated");
      });

      it("returns 404 when client belongs to another workspace", async () => {
        const otherClient = await prisma.client.create({
          data: {
            workspaceId: otherWorkspaceId,
            sequence: 1,
            name: "Other",
            email: "other@test.com",
          },
        });

        await request(app)
          .patch(`/clients/${otherClient.id}`)
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
            workspaceId: testWorkspaceId,
            sequence: 1,
            name: "Original",
            email: "original@test.com",
          },
        });

        await request(app)
          .patch(`/clients/${created.id}`)
          .send({ email: "invalid" })
          .expect(400);
      });
    });

    describe("DELETE /clients/:id", () => {
      it("returns 204 when client exists in workspace", async () => {
        const created = await prisma.client.create({
          data: {
            workspaceId: testWorkspaceId,
            sequence: 1,
            name: "To Delete",
            email: "delete@test.com",
          },
        });

        await request(app).delete(`/clients/${created.id}`).expect(204);

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
            workspaceId: otherWorkspaceId,
            sequence: 1,
            name: "Other",
            email: "other@test.com",
          },
        });

        await request(app).delete(`/clients/${otherClient.id}`).expect(404);

        const inDb = await prisma.client.findUnique({
          where: { id: otherClient.id },
        });
        expect(inDb).not.toBeNull();
      });
    });
  },
);
