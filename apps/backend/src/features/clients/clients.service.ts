import type { Prisma } from "@addinvoice/db";

import { assertCanCreate, prisma } from "@addinvoice/db";

import type {
  ClientEntity,
  CreateClientDto,
  ListClientsQuery,
  UpdateClientDto,
} from "./clients.schemas.js";

import { EntityNotFoundError } from "../../errors/EntityErrors.js";

/**
 * Create a new client
 */
export async function createClient(
  workspaceId: number,
  data: CreateClientDto,
): Promise<ClientEntity> {
  return await prisma.$transaction(async (tx) => {
    await assertCanCreate(tx, workspaceId, "clients");
    const sequence = await getNextSequence(tx, workspaceId);

    const client = await tx.client.create({
      data: {
        address: data.address,
        businessName: data.businessName,
        email: data.email,
        name: data.name,
        nit: data.nit,
        phone: data.phone,
        reminderAfterDueIntervalDays: data.reminderAfterDueIntervalDays,
        reminderBeforeDueIntervalDays: data.reminderBeforeDueIntervalDays,
        sequence,
        workspaceId,
      },
    });

    return client;
  });
}

/**
 * Delete a client (hard delete)
 */
export async function deleteClient(
  workspaceId: number,
  id: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify client exists and belongs to workspace
    const existingClient = await findById(tx, id);
    if (existingClient?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Client not found");
    }

    await tx.client.delete({
      where: {
        id,
      },
    });
  });
}

/**
 * Find a client by ID within a workspace
 */
export async function findById(
  tx: Prisma.TransactionClient,
  id: number,
): Promise<ClientEntity | null> {
  const client = await tx.client.findUnique({
    where: {
      id,
    },
  });

  return client;
}

/**
 * Get a client by sequence within a workspace
 */
export async function getClientBySequence(
  workspaceId: number,
  sequence: number,
): Promise<ClientEntity> {
  const client = await prisma.client.findUnique({
    where: {
      workspaceId_sequence: {
        sequence,
        workspaceId,
      },
    },
  });

  if (!client) {
    throw new EntityNotFoundError("Client not found");
  }

  return client;
}

/**
 * Get a client by ID within a workspace
 */
export async function getClientById(
  workspaceId: number,
  id: number,
): Promise<ClientEntity> {
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client || client.workspaceId !== workspaceId) {
    throw new EntityNotFoundError("Client not found");
  }

  return client;
}

/**
 * Set or replace client logo URL
 */
export async function setClientLogo(
  workspaceId: number,
  id: number,
  logo: string,
): Promise<ClientEntity> {
  return prisma.$transaction(async (tx) => {
    const existing = await findById(tx, id);
    if (existing?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Client not found");
    }

    return tx.client.update({
      data: { logo },
      where: { id, workspaceId },
    });
  });
}

/**
 * List all clients for a workspace
 */
export async function listClients(
  workspaceId: number,
  query: ListClientsQuery,
): Promise<{
  clients: ClientEntity[];
  limit: number;
  page: number;
  stats: { active: number; newThisMonth: number; total: number };
  total: number;
}> {
  const { limit, page, search } = query;
  const skip = (page - 1) * limit;

  const baseWhere: Prisma.ClientWhereInput = {
    workspaceId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { businessName: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [clients, total, statsTotal, newThisMonth] = await Promise.all([
    prisma.client.findMany({
      orderBy: { sequence: "asc" },
      skip,
      take: limit,
      where: baseWhere,
    }),
    prisma.client.count({ where: baseWhere }),
    prisma.client.count({ where: baseWhere }),
    prisma.client.count({
      where: {
        ...baseWhere,
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    clients,
    limit,
    page,
    stats: {
      total: statsTotal,
      active: statsTotal,
      newThisMonth,
    },
    total,
  };
}

/**
 * Update an existing client
 */
export async function updateClient(
  workspaceId: number,
  id: number,
  data: UpdateClientDto,
): Promise<ClientEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify client exists and belongs to workspace
    const existingClient = await findById(tx, id);
    if (existingClient?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Client not found");
    }

    const client = await tx.client.update({
      data,
      where: {
        id,
        workspaceId,
      },
    });

    return client;
  });
}

/**
 * Get the next sequence number for a workspace
 */
async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const lastClient = await tx.client.findFirst({
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
    where: {
      workspaceId,
    },
  });

  return lastClient ? lastClient.sequence + 1 : 1;
}
