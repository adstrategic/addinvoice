import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listClients,
  getClientBySequence,
  createClient,
  updateClient,
  deleteClient,
} from "../clients.service";
import { EntityNotFoundError } from "../../../errors/EntityErrors";
import prismaMock from "../../../core/__mocks__/db";

vi.mock("../../../core/db");

const defaultClient = {
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

describe("clients.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("listClients", () => {
    it("returns clients, total, page and limit from findMany and count", async () => {
      const clients = [{ ...defaultClient }];
      prismaMock.client.findMany.mockResolvedValue(clients);
      prismaMock.client.count.mockResolvedValue(1);

      const result = await listClients(1, { page: 1, limit: 10 });

      expect(result).toEqual({
        clients,
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it("builds where with OR for search when search is provided", async () => {
      prismaMock.client.findMany.mockResolvedValue([]);
      prismaMock.client.count.mockResolvedValue(0);

      await listClients(1, { page: 1, limit: 10, search: "acme" });

      expect(prismaMock.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe("getClientBySequence", () => {
    it("returns client when found and not deleted", async () => {
      prismaMock.client.findUnique.mockResolvedValue(defaultClient);

      const result = await getClientBySequence(1, 1);

      expect(result).toEqual(defaultClient);
    });

    it("throws EntityNotFoundError when client does not exist", async () => {
      prismaMock.client.findUnique.mockResolvedValue(null);

      await expect(getClientBySequence(1, 999)).rejects.toThrow(
        EntityNotFoundError,
      );
      await expect(getClientBySequence(1, 999)).rejects.toMatchObject({
        statusCode: 404,
        message: "Client not found",
      });
    });

    it("throws EntityNotFoundError when client is deleted", async () => {
      prismaMock.client.findUnique.mockResolvedValue({
        ...defaultClient,
        deletedAt: new Date(),
      });

      await expect(getClientBySequence(1, 1)).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });

  describe("createClient", () => {
    it("uses sequence 1 and creates client when no existing clients", async () => {
      prismaMock.$transaction.mockImplementationOnce((callback) =>
        callback(prismaMock),
      );

      prismaMock.client.findFirst.mockResolvedValue(null);

      const created = { ...defaultClient, sequence: 1 };
      prismaMock.client.create.mockResolvedValue(created);

      const result = await createClient(1, {
        name: "New Client",
        email: "new@test.com",
      });

      expect(result.sequence).toBe(1);
      expect(prismaMock.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 1,
          sequence: 1,
          name: "New Client",
          email: "new@test.com",
        }),
      });
    });

    it("uses next sequence when clients exist", async () => {
      prismaMock.$transaction.mockImplementationOnce((callback) =>
        callback(prismaMock),
      );

      // getNextSequence uses findFirst with select: { sequence: true }
      prismaMock.client.findFirst.mockResolvedValue({
        ...defaultClient,
        sequence: 5,
      });
      const created = { ...defaultClient, sequence: 6 };
      prismaMock.client.create.mockResolvedValue(created);

      const result = await createClient(1, {
        name: "Another",
        email: "another@test.com",
      });

      expect(result.sequence).toBe(6);
      expect(prismaMock.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sequence: 6 }),
        }),
      );
    });
  });

  describe("updateClient", () => {
    it("updates and returns client when exists and belongs to workspace", async () => {
      prismaMock.$transaction.mockImplementationOnce((callback) =>
        callback(prismaMock),
      );

      prismaMock.client.findUnique.mockResolvedValue({
        ...defaultClient,
        workspaceId: 1,
      });
      const updated = { ...defaultClient, name: "Updated" };
      prismaMock.client.update.mockResolvedValue(updated);

      const result = await updateClient(1, 1, { name: "Updated" });

      expect(result.name).toBe("Updated");
      expect(prismaMock.client.update).toHaveBeenCalledWith({
        where: { id: 1, workspaceId: 1 },
        data: { name: "Updated" },
      });
    });

    it("throws EntityNotFoundError when client does not exist", async () => {
      prismaMock.$transaction.mockImplementation((callback) =>
        callback(prismaMock),
      );

      prismaMock.client.findUnique.mockResolvedValue(null);

      await expect(updateClient(1, 999, { name: "X" })).rejects.toThrow(
        EntityNotFoundError,
      );
      await expect(updateClient(1, 999, { name: "X" })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("throws EntityNotFoundError when client belongs to another workspace", async () => {
      prismaMock.$transaction.mockImplementation((callback) =>
        callback(prismaMock),
      );

      prismaMock.client.findUnique.mockResolvedValue({
        ...defaultClient,
        id: 1,
        workspaceId: 2,
      });

      await expect(updateClient(1, 1, { name: "X" })).rejects.toThrow(
        EntityNotFoundError,
      );
      await expect(updateClient(1, 1, { name: "X" })).rejects.toMatchObject({
        statusCode: 404,
        message: "Client not found",
      });
    });
  });

  describe("deleteClient", () => {
    it("deletes client when exists and belongs to workspace", async () => {
      prismaMock.$transaction.mockImplementationOnce((callback) =>
        callback(prismaMock),
      );

      prismaMock.client.findUnique.mockResolvedValue({
        ...defaultClient,
        workspaceId: 1,
      });
      prismaMock.client.delete.mockResolvedValue(defaultClient);

      await expect(deleteClient(1, 1)).resolves.toBeUndefined();
      expect(prismaMock.client.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("throws EntityNotFoundError when client does not exist", async () => {
      prismaMock.$transaction.mockImplementationOnce((callback) =>
        callback(prismaMock),
      );

      prismaMock.client.findUnique.mockResolvedValue(null);

      await expect(deleteClient(1, 999)).rejects.toThrow(EntityNotFoundError);
    });

    it("throws EntityNotFoundError and does not call delete when client belongs to another workspace", async () => {
      prismaMock.$transaction.mockImplementationOnce((callback) =>
        callback(prismaMock),
      );

      prismaMock.client.findUnique.mockResolvedValue({
        ...defaultClient,
        workspaceId: 2,
      });

      await expect(deleteClient(1, 1)).rejects.toThrow(EntityNotFoundError);
      expect(prismaMock.client.delete).not.toHaveBeenCalled();
    });
  });
});
