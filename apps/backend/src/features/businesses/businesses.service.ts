import type { Prisma } from "@addinvoice/db";

import { prisma } from "@addinvoice/db";

import type {
  BusinessEntity,
  CreateBusinessDto,
  ListBusinessesQuery,
  UpdateBusinessDto,
} from "./businesses.schemas.js";

import { EntityNotFoundError } from "../../errors/EntityErrors.js";

/**
 * Create a new business
 */
export async function createBusiness(
  workspaceId: number,
  data: CreateBusinessDto,
): Promise<BusinessEntity> {
  return await prisma.$transaction(async (tx) => {
    const sequence = await getNextSequence(tx, workspaceId);

    const business = await tx.business.create({
      data: {
        address: data.address,
        defaultNotes: data.defaultNotes ?? null,
        defaultTaxMode: data.defaultTaxMode ?? null,
        defaultTaxName: data.defaultTaxName ?? null,
        defaultTaxPercentage: data.defaultTaxPercentage ?? null,
        defaultTerms: data.defaultTerms ?? null,
        email: data.email,
        isDefault: false, // New businesses are not default by default
        logo: data.logo ?? null,
        name: data.name,
        nit: data.nit?.trim() ?? null,
        phone: data.phone,
        sequence,
        workspaceId,
      },
    });

    return {
      ...business,
      defaultTaxPercentage: business.defaultTaxPercentage
        ? Number(business.defaultTaxPercentage)
        : null,
    };
  });
}

/**
 * Delete a business (soft delete)
 */
export async function deleteBusiness(
  workspaceId: number,
  id: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify business exists and belongs to workspace
    const existingBusiness = await findById(tx, id);
    if (existingBusiness?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Business not found");
    }

    await tx.business.delete({
      where: {
        id,
      },
    });
  });
}

/**
 * Find a business by ID within a workspace
 */
export async function findById(
  tx: Prisma.TransactionClient,
  id: number,
): Promise<BusinessEntity | null> {
  const business = await tx.business.findUnique({
    where: {
      id,
    },
  });

  if (!business) {
    return null;
  }

  return {
    ...business,
    defaultTaxPercentage: business.defaultTaxPercentage
      ? Number(business.defaultTaxPercentage)
      : null,
  };
}

/**
 * Get a business by ID within a workspace
 */
export async function getBusinessById(
  workspaceId: number,
  id: number,
): Promise<BusinessEntity> {
  const business = await prisma.business.findFirst({
    where: {
      id,
      workspaceId,
    },
  });

  if (!business) {
    throw new EntityNotFoundError("Business not found");
  }

  return {
    ...business,
    defaultTaxPercentage: business.defaultTaxPercentage
      ? Number(business.defaultTaxPercentage)
      : null,
  };
}

/**
 * List all businesses for a workspace
 */
export async function listBusinesses(
  workspaceId: number,
  query: ListBusinessesQuery,
): Promise<{
  businesses: BusinessEntity[];
  limit: number;
  page: number;
  total: number;
}> {
  const { limit, page, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BusinessWhereInput = {
    workspaceId,

    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { nit: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      orderBy: { sequence: "asc" },
      skip,
      take: limit,
      where,
    }),
    prisma.business.count({ where }),
  ]);

  return {
    businesses: businesses.map((business) => ({
      ...business,
      defaultTaxPercentage: business.defaultTaxPercentage
        ? Number(business.defaultTaxPercentage)
        : null,
    })),
    limit,
    page,
    total,
  };
}

/**
 * Set a business as default (unset others)
 */
export async function setDefaultBusiness(
  workspaceId: number,
  id: number,
): Promise<BusinessEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify business exists and belongs to workspace
    const existingBusiness = await findById(tx, id);
    if (existingBusiness?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Business not found");
    }

    // Unset all other default businesses in this workspace
    await tx.business.updateMany({
      data: {
        isDefault: false,
      },
      where: {
        isDefault: true,
        workspaceId,
      },
    });

    // Set this business as default
    const business = await tx.business.update({
      data: {
        isDefault: true,
      },
      where: {
        id,
        workspaceId,
      },
    });

    return {
      ...business,
      defaultTaxPercentage: business.defaultTaxPercentage
        ? Number(business.defaultTaxPercentage)
        : null,
    };
  });
}

/**
 * Update an existing business
 */
export async function updateBusiness(
  workspaceId: number,
  id: number,
  data: UpdateBusinessDto,
): Promise<BusinessEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify business exists and belongs to workspace
    const existingBusiness = await findById(tx, id);
    if (existingBusiness?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Business not found");
    }

    const business = await tx.business.update({
      data,
      where: {
        id,
        workspaceId,
      },
    });

    return {
      ...business,
      defaultTaxPercentage: business.defaultTaxPercentage
        ? Number(business.defaultTaxPercentage)
        : null,
    };
  });
}

/**
 * Get the next sequence number for a workspace
 */
async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const lastBusiness = await tx.business.findFirst({
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

  return lastBusiness ? lastBusiness.sequence + 1 : 1;
}
