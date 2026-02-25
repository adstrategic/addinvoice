import type { Prisma } from "@addinvoice/db";

import { prisma } from "@addinvoice/db";

import type {
  CatalogEntity,
  CreateCatalogDto,
  ListCatalogsQuery,
  UpdateCatalogDto,
} from "./catalog.schemas.js";

import {
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors.js";

/**
 * Create a new catalog
 */
export async function createCatalog(
  workspaceId: number,
  data: CreateCatalogDto,
): Promise<CatalogEntity> {
  return await prisma.$transaction(async (tx) => {
    const sequence = await getNextSequence(tx, workspaceId);

    const catalog = await tx.catalog.create({
      data: {
        businessId: data.businessId,
        description: data.description,
        name: data.name,
        price: data.price,
        quantityUnit: data.quantityUnit,
        sequence,
        workspaceId,
      },
      include: {
        business: true,
      },
    });

    return {
      ...catalog,
      business: {
        ...catalog.business,
        defaultTaxPercentage: catalog.business.defaultTaxPercentage
          ? Number(catalog.business.defaultTaxPercentage)
          : null,
      },
      price: Number(catalog.price),
    };
  });
}

/**
 * Delete a catalog (soft delete)
 */
export async function deleteCatalog(
  workspaceId: number,
  id: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify catalog exists and belongs to workspace
    const existingCatalog = await tx.catalog.findUnique({
      where: {
        id,
      },
    });

    if (existingCatalog?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        code: "ERR_NF",
        message: "Catalog not found",
        statusCode: 404,
      });
    }

    await tx.catalog.delete({
      where: {
        id,
      },
    });
  });
}

/**
 * Get a catalog by sequence within a workspace
 */
export async function getCatalogBySequence(
  workspaceId: number,
  sequence: number,
): Promise<CatalogEntity> {
  const catalog = await prisma.catalog.findUnique({
    include: {
      business: true,
    },
    where: {
      workspaceId_sequence: {
        sequence,
        workspaceId,
      },
    },
  });

  if (!catalog) {
    throw new EntityNotFoundError({
      code: "ERR_NF",
      message: "Catalog not found",
      statusCode: 404,
    });
  }

  return {
    ...catalog,
    business: {
      ...catalog.business,
      defaultTaxPercentage: catalog.business.defaultTaxPercentage
        ? Number(catalog.business.defaultTaxPercentage)
        : null,
    },
    price: Number(catalog.price),
  };
}

/**
 * List all catalogs for a workspace
 */
export async function listCatalogs(
  workspaceId: number,
  query: ListCatalogsQuery,
): Promise<{
  catalogs: CatalogEntity[];
  limit: number;
  page: number;
  total: number;
}> {
  const { businessId, limit, page, search, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CatalogWhereInput = {
    workspaceId,

    ...(businessId && { businessId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy = {
    [sortBy]: sortOrder,
  } as Prisma.CatalogOrderByWithRelationInput;

  const [catalogs, total] = await Promise.all([
    prisma.catalog.findMany({
      include: {
        business: true,
      },
      orderBy,
      skip,
      take: limit,
      where,
    }),
    prisma.catalog.count({ where }),
  ]);

  return {
    catalogs: catalogs.map((catalog) => ({
      ...catalog,
      business: {
        ...catalog.business,
        defaultTaxPercentage: catalog.business.defaultTaxPercentage
          ? Number(catalog.business.defaultTaxPercentage)
          : null,
      },
      price: Number(catalog.price),
    })),
    limit,
    page,
    total,
  };
}

/**
 * Update an existing catalog
 */
export async function updateCatalog(
  workspaceId: number,
  id: number,
  data: UpdateCatalogDto,
): Promise<CatalogEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify catalog exists and belongs to workspace
    const existingCatalog = await tx.catalog.findUnique({
      include: {
        invoiceItems: true,
      },
      where: {
        id,
      },
    });

    if (!existingCatalog) {
      throw new EntityNotFoundError({
        code: "ERR_NF",
        message: "Catalog not found",
        statusCode: 404,
      });
    }

    if (existingCatalog.businessId !== data.businessId) {
      if (existingCatalog.invoiceItems.length > 0) {
        throw new EntityValidationError({
          code: "ERR_VALID",
          message: "Cannot change business of a catalog with invoice items",
          statusCode: 400,
        });
      }
    }

    const catalog = await tx.catalog.update({
      data,
      include: {
        business: true,
      },
      where: {
        id,
        workspaceId,
      },
    });

    return {
      ...catalog,
      business: {
        ...catalog.business,
        defaultTaxPercentage: catalog.business.defaultTaxPercentage
          ? Number(catalog.business.defaultTaxPercentage)
          : null,
      },
      price: Number(catalog.price),
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
  const lastCatalog = await tx.catalog.findFirst({
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

  return lastCatalog ? lastCatalog.sequence + 1 : 1;
}
