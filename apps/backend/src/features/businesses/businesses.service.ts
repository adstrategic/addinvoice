import prisma from "../../core/db";
import type { Prisma } from "@addinvoice/db";
import type {
  ListBusinessesQuery,
  CreateBusinessDto,
  UpdateBusinessDto,
  BusinessEntity,
} from "./businesses.schemas";
import { EntityNotFoundError } from "../../errors/EntityErrors";

/**
 * List all businesses for a workspace
 */
export async function listBusinesses(
  workspaceId: number,
  query: ListBusinessesQuery,
): Promise<{
  businesses: BusinessEntity[];
  total: number;
  page: number;
  limit: number;
}> {
  const { page, limit, search } = query;
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
      where,
      skip,
      take: limit,
      orderBy: { sequence: "asc" },
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
    total,
    page,
    limit,
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
    throw new EntityNotFoundError({
      message: "Business not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  return {
    ...business,
    defaultTaxPercentage: business.defaultTaxPercentage
      ? Number(business.defaultTaxPercentage)
      : null,
  };
}

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
        workspaceId,
        sequence,
        name: data.name,
        nit: data.nit?.trim() ?? null,
        address: data.address,
        email: data.email,
        phone: data.phone,
        logo: data.logo ?? null,
        isDefault: false, // New businesses are not default by default
        defaultTaxMode: data.defaultTaxMode ?? null,
        defaultTaxName: data.defaultTaxName ?? null,
        defaultTaxPercentage: data.defaultTaxPercentage ?? null,
        defaultNotes: data.defaultNotes ?? null,
        defaultTerms: data.defaultTerms ?? null,
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
    if (!existingBusiness || existingBusiness.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Business not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    const business = await tx.business.update({
      where: {
        id,
        workspaceId,
      },
      data,
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
    if (!existingBusiness || existingBusiness.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Business not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    await tx.business.delete({
      where: {
        id,
      },
    });
  });
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
    if (!existingBusiness || existingBusiness.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Business not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    // Unset all other default businesses in this workspace
    await tx.business.updateMany({
      where: {
        workspaceId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set this business as default
    const business = await tx.business.update({
      where: {
        id,
        workspaceId,
      },
      data: {
        isDefault: true,
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
 * Get the next sequence number for a workspace
 */
async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const lastBusiness = await tx.business.findFirst({
    where: {
      workspaceId,
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });

  return lastBusiness ? lastBusiness.sequence + 1 : 1;
}
