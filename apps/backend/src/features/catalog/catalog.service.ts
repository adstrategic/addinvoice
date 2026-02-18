import prisma from "../../core/db";
import type { Prisma } from "@addinvoice/db";
import type {
  ListCatalogsQuery,
  CreateCatalogDto,
  UpdateCatalogDto,
  CatalogEntity,
} from "./catalog.schemas";
import {
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors";

/**
 * List all catalogs for a workspace
 */
export async function listCatalogs(
  workspaceId: number,
  query: ListCatalogsQuery,
): Promise<{
  catalogs: CatalogEntity[];
  total: number;
  page: number;
  limit: number;
}> {
  const { page, limit, search, businessId, sortBy, sortOrder } = query;
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
      where,
      include: {
        business: true,
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.catalog.count({ where }),
  ]);

  return {
    catalogs: catalogs.map((catalog) => ({
      ...catalog,
      price: Number(catalog.price),
      business: {
        ...catalog.business,
        defaultTaxPercentage: catalog.business.defaultTaxPercentage
          ? Number(catalog.business.defaultTaxPercentage)
          : null,
      },
    })),
    total,
    page,
    limit,
  };
}

/**
 * Get a catalog by sequence within a workspace
 */
export async function getCatalogBySequence(
  workspaceId: number,
  sequence: number,
): Promise<CatalogEntity> {
  const catalog = await prisma.catalog.findUnique({
    where: {
      workspaceId_sequence: {
        workspaceId,
        sequence,
      },
    },
    include: {
      business: true,
    },
  });

  if (!catalog) {
    throw new EntityNotFoundError({
      message: "Catalog not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  return {
    ...catalog,
    price: Number(catalog.price),
    business: {
      ...catalog.business,
      defaultTaxPercentage: catalog.business.defaultTaxPercentage
        ? Number(catalog.business.defaultTaxPercentage)
        : null,
    },
  };
}

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
        workspaceId,
        sequence,
        name: data.name,
        description: data.description,
        price: data.price,
        quantityUnit: data.quantityUnit,
        businessId: data.businessId,
      },
      include: {
        business: true,
      },
    });

    return {
      ...catalog,
      price: Number(catalog.price),
      business: {
        ...catalog.business,
        defaultTaxPercentage: catalog.business.defaultTaxPercentage
          ? Number(catalog.business.defaultTaxPercentage)
          : null,
      },
    };
  });
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
      where: {
        id,
      },
      include: {
        invoiceItems: true,
      },
    });

    if (!existingCatalog) {
      throw new EntityNotFoundError({
        message: "Catalog not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    if (existingCatalog.businessId !== data.businessId) {
      if (existingCatalog.invoiceItems.length > 0) {
        throw new EntityValidationError({
          message: "Cannot change business of a catalog with invoice items",
          statusCode: 400,
          code: "ERR_VALID",
        });
      }
    }

    const catalog = await tx.catalog.update({
      where: {
        id,
        workspaceId,
      },
      data,
      include: {
        business: true,
      },
    });

    return {
      ...catalog,
      price: Number(catalog.price),
      business: {
        ...catalog.business,
        defaultTaxPercentage: catalog.business.defaultTaxPercentage
          ? Number(catalog.business.defaultTaxPercentage)
          : null,
      },
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

    if (!existingCatalog || existingCatalog.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Catalog not found",
        statusCode: 404,
        code: "ERR_NF",
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
 * Get the next sequence number for a workspace
 */
async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const lastCatalog = await tx.catalog.findFirst({
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

  return lastCatalog ? lastCatalog.sequence + 1 : 1;
}
