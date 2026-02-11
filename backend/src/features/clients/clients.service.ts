import prisma from "../../core/db";
import type { Prisma } from "../../generated/prisma/client";
import type {
  ListClientsQuery,
  CreateClientDto,
  UpdateClientDto,
  ClientEntity,
} from "./clients.schemas";
import { EntityNotFoundError } from "../../errors/EntityErrors";

/**
 * List all clients for a workspace
 */
export async function listClients(
  workspaceId: number,
  query: ListClientsQuery,
): Promise<{
  clients: ClientEntity[];
  total: number;
  page: number;
  limit: number;
}> {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ClientWhereInput = {
    workspaceId,
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { businessName: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sequence: "asc" },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    total,
    page,
    limit,
  };
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
        workspaceId,
        sequence,
      },
    },
  });

  if (!client || client.deletedAt !== null) {
    throw new EntityNotFoundError({
      message: "Client not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  return client;
}

/**
 * Create a new client
 */
export async function createClient(
  workspaceId: number,
  data: CreateClientDto,
): Promise<ClientEntity> {
  return await prisma.$transaction(async (tx) => {
    const sequence = await getNextSequence(tx, workspaceId);

    const client = await tx.client.create({
      data: {
        workspaceId,
        sequence,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        nit: data.nit,
        businessName: data.businessName,
      },
    });

    return client;
  });
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
    if (!existingClient || existingClient.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Client not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    const client = await tx.client.update({
      where: {
        id,
        workspaceId,
      },
      data,
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
    if (!existingClient || existingClient.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Client not found",
        statusCode: 404,
        code: "ERR_NF",
      });
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
 * Get the next sequence number for a workspace
 */
async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const lastClient = await tx.client.findFirst({
    where: {
      workspaceId,
      deletedAt: null,
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });

  return lastClient ? lastClient.sequence + 1 : 1;
}
