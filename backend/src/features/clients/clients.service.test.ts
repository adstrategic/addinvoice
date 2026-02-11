import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listClients,
  getClientBySequence,
  createClient,
  updateClient,
  deleteClient,
} from "./clients.service";
import { EntityNotFoundError } from "../../errors/EntityErrors";

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

function createMockTx(overrides: Record<string, unknown> = {}) {
  return {
    client: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    ...overrides,
  };
}

let mockTx: ReturnType<typeof createMockTx>;

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
  const $transaction = vi.fn();
  return {
    prisma: {
      client,
      $transaction,
    },
  };
});

import { prisma } from "../../core/db";

beforeEach(() => {
  vi.mocked(prisma.$transaction).mockImplementation(
    async (cb: (tx: unknown) => Promise<unknown>) => {
      mockTx = createMockTx();
      return cb(mockTx);
    }
  );
});

describe("listClients", () => {
  beforeEach(() => {
    vi.mocked(prisma.client.findMany).mockResolvedValue([mockClientEntity]);
    vi.mocked(prisma.client.count).mockResolvedValue(1);
  });

  it("returns clients for workspace with pagination and shape", async () => {
    const result = await listClients(1, { page: 1, limit: 10 });

    expect(result).toEqual({
      clients: [mockClientEntity],
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 1, deletedAt: null }),
        skip: 0,
        take: 10,
        orderBy: { sequence: "asc" },
      })
    );
  });

  it("applies pagination skip and take", async () => {
    await listClients(1, { page: 2, limit: 5 });

    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    );
  });

  it("filters by search when provided", async () => {
    await listClients(1, { page: 1, limit: 10, search: "acme" });

    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      })
    );
  });

  it("excludes deleted clients (deletedAt null in where)", async () => {
    await listClients(1, { page: 1, limit: 10 });

    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    );
  });
});

describe("getClientBySequence", () => {
  it("returns client when found and not deleted", async () => {
    vi.mocked(prisma.client.findUnique).mockResolvedValue(mockClientEntity);

    const result = await getClientBySequence(1, 1);

    expect(result).toEqual(mockClientEntity);
    expect(prisma.client.findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_sequence: { workspaceId: 1, sequence: 1 },
      },
    });
  });

  it("throws EntityNotFoundError when client does not exist", async () => {
    vi.mocked(prisma.client.findUnique).mockResolvedValue(null);

    await expect(getClientBySequence(1, 999)).rejects.toThrow(EntityNotFoundError);
    await expect(getClientBySequence(1, 999)).rejects.toMatchObject({
      statusCode: 404,
      message: "Client not found",
    });
  });

  it("throws EntityNotFoundError when client is deleted", async () => {
    vi.mocked(prisma.client.findUnique).mockResolvedValue({
      ...mockClientEntity,
      deletedAt: new Date(),
    });

    await expect(getClientBySequence(1, 1)).rejects.toThrow(EntityNotFoundError);
  });
});

describe("createClient", () => {
  it("creates client with correct workspaceId and sequence 1 when no existing clients", async () => {
    mockTx = createMockTx();
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      mockTx.client.findFirst.mockResolvedValue(null);
      mockTx.client.create.mockResolvedValue({
        ...mockClientEntity,
        sequence: 1,
      });
      return cb(mockTx);
    });

    const result = await createClient(1, {
      name: "New Client",
      email: "new@test.com",
    });

    expect(mockTx.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 1, deletedAt: null },
        orderBy: { sequence: "desc" },
      })
    );
    expect(mockTx.client.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: 1,
        sequence: 1,
        name: "New Client",
        email: "new@test.com",
      }),
    });
    expect(result.sequence).toBe(1);
  });

  it("assigns next sequence when clients exist", async () => {
    mockTx = createMockTx();
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      mockTx.client.findFirst.mockResolvedValue({ sequence: 5 });
      mockTx.client.create.mockResolvedValue({
        ...mockClientEntity,
        sequence: 6,
      });
      return cb(mockTx);
    });

    const result = await createClient(1, {
      name: "Another",
      email: "another@test.com",
    });

    expect(result.sequence).toBe(6);
  });
});

describe("updateClient", () => {
  it("updates and returns client when id exists and belongs to workspace", async () => {
    const updated = { ...mockClientEntity, name: "Updated" };
    mockTx = createMockTx();
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      mockTx.client.findUnique.mockResolvedValue({
        ...mockClientEntity,
        workspaceId: 1,
      });
      mockTx.client.update.mockResolvedValue(updated);
      return cb(mockTx);
    });

    const result = await updateClient(1, 1, { name: "Updated" });

    expect(result.name).toBe("Updated");
    expect(mockTx.client.update).toHaveBeenCalledWith({
      where: { id: 1, workspaceId: 1 },
      data: { name: "Updated" },
    });
  });

  it("throws EntityNotFoundError when client does not exist", async () => {
    mockTx = createMockTx();
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      mockTx.client.findUnique.mockResolvedValue(null);
      return cb(mockTx);
    });

    await expect(updateClient(1, 999, { name: "X" })).rejects.toThrow(
      EntityNotFoundError
    );
    await expect(updateClient(1, 999, { name: "X" })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("throws EntityNotFoundError when client belongs to another workspace", async () => {
    mockTx = createMockTx();
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      mockTx.client.findUnique.mockResolvedValue({
        ...mockClientEntity,
        id: 1,
        workspaceId: 2,
      });
      return cb(mockTx);
    });

    await expect(updateClient(1, 1, { name: "X" })).rejects.toThrow(
      EntityNotFoundError
    );
    await expect(updateClient(1, 1, { name: "X" })).rejects.toMatchObject({
      statusCode: 404,
      message: "Client not found",
    });
  });
});

describe("deleteClient", () => {
  it("succeeds when client exists and belongs to workspace", async () => {
    mockTx = createMockTx();
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      mockTx.client.findUnique.mockResolvedValue({
        ...mockClientEntity,
        workspaceId: 1,
      });
      mockTx.client.delete.mockResolvedValue(mockClientEntity);
      return cb(mockTx);
    });

    await expect(deleteClient(1, 1)).resolves.toBeUndefined();
    expect(mockTx.client.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("throws EntityNotFoundError when client does not exist", async () => {
    mockTx = createMockTx();
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      mockTx.client.findUnique.mockResolvedValue(null);
      return cb(mockTx);
    });

    await expect(deleteClient(1, 999)).rejects.toThrow(EntityNotFoundError);
  });

  it("throws EntityNotFoundError when client belongs to another workspace", async () => {
    mockTx = createMockTx();
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      mockTx.client.findUnique.mockResolvedValue({
        ...mockClientEntity,
        workspaceId: 2,
      });
      return cb(mockTx);
    });

    await expect(deleteClient(1, 1)).rejects.toThrow(EntityNotFoundError);
    expect(mockTx.client.delete).not.toHaveBeenCalled();
  });
});
