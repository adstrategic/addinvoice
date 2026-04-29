import type { Prisma } from "@addinvoice/db";
import type {
  AdvanceListItemResponse,
  AdvanceResponse,
  BulkLinkAdvancesToInvoiceDTO,
  CreateAdvanceDTO,
  GenerateAdvanceReportDTO,
  LinkAdvanceToInvoiceDTO,
  ListAdvancesQuery,
  SendAdvanceDTO,
  UnlinkAdvanceFromInvoiceDTO,
  UpdateAdvanceDTO,
} from "@addinvoice/schemas";

import { prisma } from "@addinvoice/db";

import {
  deleteAdvanceAttachmentByPublicId,
  extractPublicIdFromUrl,
  uploadAdvanceAttachment,
  validateAdvanceAttachmentFile,
} from "../../core/cloudinary.js";
import {
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors.js";

type AdvanceWithRelations = Prisma.AdvanceGetPayload<{
  include: { attachments: true; business: true; client: true };
}>;
type AdvanceListWithRelations = Prisma.AdvanceGetPayload<{
  include: { business: true; client: true };
}>;

const deleteAdvanceAttachmentByPublicIdSafe = deleteAdvanceAttachmentByPublicId as (
  publicId: string,
) => Promise<{ result: string }>;
const validateAdvanceAttachmentFileSafe = validateAdvanceAttachmentFile as (
  file: Express.Multer.File,
) => {
  error?: string;
  valid: boolean;
};
const uploadAdvanceAttachmentSafe = uploadAdvanceAttachment as (
  file: Express.Multer.File,
  workspaceId: number,
  advanceId: number,
) => Promise<{ secure_url: string }>;

function toAdvanceResponse(row: AdvanceWithRelations): AdvanceResponse {
  return {
    ...row,
    business: row.business
      ? {
          ...row.business,
          defaultTaxMode: row.business.defaultTaxMode,
          defaultTaxPercentage: row.business.defaultTaxPercentage
            ? Number(row.business.defaultTaxPercentage)
            : null,
        }
      : null,
  };
}

function toAdvanceListItem(
  row: AdvanceListWithRelations,
): AdvanceListItemResponse {
  return {
    ...row,
    business: row.business
      ? {
          ...row.business,
          defaultTaxMode: row.business.defaultTaxMode,
          defaultTaxPercentage: row.business.defaultTaxPercentage
            ? Number(row.business.defaultTaxPercentage)
            : null,
        }
      : null,
  };
}

async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const lastAdvance = await tx.advance.findFirst({
    orderBy: { sequence: "desc" },
    select: { sequence: true },
    where: { workspaceId },
  });

  return lastAdvance ? lastAdvance.sequence + 1 : 1;
}

async function resolveClientId(
  tx: Prisma.TransactionClient,
  workspaceId: number,
  data: CreateAdvanceDTO,
): Promise<number> {
  if (data.createClient && data.clientData) {
    const lastClient = await tx.client.findFirst({
      orderBy: { sequence: "desc" },
      select: { sequence: true },
      where: { workspaceId },
    });
    const clientSequence = lastClient ? lastClient.sequence + 1 : 1;

    const createdClient = await tx.client.create({
      data: {
        ...data.clientData,
        sequence: clientSequence,
        workspaceId,
      },
    });

    return createdClient.id;
  }

  const client = await tx.client.findFirst({
    where: { id: data.clientId, workspaceId },
  });
  if (!client) {
    throw new EntityValidationError("Client not found in your workspace");
  }

  return client.id;
}

export async function createAdvance(
  workspaceId: number,
  data: CreateAdvanceDTO,
): Promise<AdvanceResponse> {
  return await prisma.$transaction(async (tx) => {
    const clientId = await resolveClientId(tx, workspaceId, data);
    const sequence = await getNextSequence(tx, workspaceId);

    if (data.businessId != null) {
      const business = await tx.business.findFirst({
        where: { id: data.businessId, workspaceId },
      });
      if (!business) {
        throw new EntityValidationError(
          "Business not found or does not belong to your workspace",
        );
      }
    }

    if (data.invoiceId != null) {
      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, workspaceId },
      });
      if (!invoice) {
        throw new EntityValidationError("Invoice not found");
      }
      if (invoice.clientId !== clientId) {
        throw new EntityValidationError(
          "Advance client must match invoice client when linking",
        );
      }
    }

    const normalizedWorkCompleted =
      typeof data.workCompleted === "string" ? data.workCompleted : null;

    const created = await tx.advance.create({
      data: {
        advanceDate: data.advanceDate,
        businessId: data.businessId ?? null,
        clientId,
        invoiceId: data.invoiceId ?? null,
        location: data.location ?? null,
        projectName: data.projectName,
        workCompleted: normalizedWorkCompleted,
        sequence,
        status: data.status,
        workspaceId,
        attachments: {
          create: (data.attachments ?? []).map((item, index) => ({
            fileName: item.fileName ?? null,
            mimeType: item.mimeType ?? null,
            sequence: item.sequence ?? index + 1,
            url: item.url,
          })),
        },
      },
      include: {
        attachments: true,
        business: true,
        client: true,
      },
    });

    return toAdvanceResponse(created);
  });
}

export async function getAdvanceById(
  workspaceId: number,
  advanceId: number,
): Promise<AdvanceResponse> {
  const advance = await prisma.advance.findFirst({
    include: {
      attachments: { orderBy: { sequence: "asc" } },
      business: true,
      client: true,
    },
    where: { id: advanceId, workspaceId },
  });

  if (!advance) {
    throw new EntityNotFoundError("Advance not found");
  }

  return toAdvanceResponse(advance);
}

export async function listAdvances(
  workspaceId: number,
  query: ListAdvancesQuery,
): Promise<{
  data: AdvanceListItemResponse[];
  limit: number;
  page: number;
  total: number;
}> {
  const { clientId, invoiceId, limit, page, search, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.AdvanceWhereInput = {
    workspaceId,
    ...(clientId ? { clientId } : {}),
    ...(invoiceId ? { invoiceId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { workCompleted: { contains: search, mode: "insensitive" } },
            { projectName: { contains: search, mode: "insensitive" } },
            { client: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.advance.findMany({
      include: {
        business: true,
        client: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      where,
    }),
    prisma.advance.count({ where }),
  ]);

  return {
    data: rows.map(toAdvanceListItem),
    limit,
    page,
    total,
  };
}

export async function updateAdvance(
  workspaceId: number,
  advanceId: number,
  data: UpdateAdvanceDTO,
): Promise<AdvanceResponse> {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.advance.findFirst({
      where: { id: advanceId, workspaceId },
    });
    if (!existing) {
      throw new EntityNotFoundError("Advance not found");
    }

    if (data.invoiceId != null) {
      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, workspaceId },
      });
      if (!invoice) {
        throw new EntityValidationError("Invoice not found");
      }
      if (invoice.clientId !== existing.clientId) {
        throw new EntityValidationError(
          "Advance client must match invoice client when linking",
        );
      }
    }

    if (data.attachments !== undefined) {
      await tx.advanceAttachment.deleteMany({ where: { advanceId } });
      if (data.attachments.length > 0) {
        await tx.advanceAttachment.createMany({
          data: data.attachments.map((item, index) => ({
            advanceId,
            fileName: item.fileName ?? null,
            mimeType: item.mimeType ?? null,
            sequence: item.sequence ?? index + 1,
            url: item.url,
          })),
        });
      }
    }

    const updateData: Prisma.AdvanceUpdateInput = {
      ...(data.advanceDate !== undefined ? { advanceDate: data.advanceDate } : {}),
      ...(data.businessId !== undefined ? { businessId: data.businessId } : {}),
      ...(data.invoiceId !== undefined ? { invoiceId: data.invoiceId } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.projectName !== undefined ? { projectName: data.projectName } : {}),
      ...(data.workCompleted !== undefined
        ? { workCompleted: data.workCompleted }
        : {}),
      ...(data.status !== undefined
        ? {
            sentAt: data.status === "ISSUED" ? new Date() : existing.sentAt,
            status: data.status,
          }
        : {}),
    };

    const updated = await tx.advance.update({
      data: updateData,
      include: {
        attachments: true,
        business: true,
        client: true,
      },
      where: { id: advanceId },
    });

    return toAdvanceResponse(updated);
  });
}

export async function deleteAdvance(
  workspaceId: number,
  advanceId: number,
): Promise<void> {
  const existing = await prisma.advance.findFirst({
    where: { id: advanceId, workspaceId },
  });
  if (!existing) {
    throw new EntityNotFoundError("Advance not found");
  }

  await prisma.advance.delete({
    where: { id: advanceId },
  });
}

export async function generateAdvanceReport(
  workspaceId: number,
  advanceId: number,
  data: GenerateAdvanceReportDTO,
): Promise<AdvanceResponse> {
  const existing = await prisma.advance.findFirst({
    where: { id: advanceId, workspaceId },
  });
  if (!existing) {
    throw new EntityNotFoundError("Advance not found");
  }

  const nextWorkCompleted =
    typeof data.workCompleted === "string"
      ? data.workCompleted
      : (existing.workCompleted ?? "");
  const updated = await prisma.advance.update({
    data: {
      workCompleted: nextWorkCompleted,
      status: existing.status === "DRAFT" ? "ISSUED" : existing.status,
    },
    include: {
      attachments: true,
      business: true,
      client: true,
    },
    where: { id: advanceId },
  });

  return toAdvanceResponse(updated);
}

export async function sendAdvance(
  workspaceId: number,
  advanceId: number,
  data: SendAdvanceDTO,
): Promise<AdvanceResponse> {
  const existing = await prisma.advance.findFirst({
    include: {
      client: true,
    },
    where: { id: advanceId, workspaceId },
  });
  if (!existing) {
    throw new EntityNotFoundError("Advance not found");
  }
  if (!existing.client) {
    throw new EntityValidationError("Advance client not found");
  }
  if (data.email.trim().length === 0) {
    throw new EntityValidationError("Recipient email is required");
  }

  const updated = await prisma.advance.update({
    data: {
      sentAt: new Date(),
      status: "ISSUED",
    },
    include: {
      attachments: true,
      business: true,
      client: true,
    },
    where: { id: advanceId },
  });

  return toAdvanceResponse(updated);
}

export async function linkAdvanceToInvoice(
  workspaceId: number,
  advanceId: number,
  data: LinkAdvanceToInvoiceDTO,
): Promise<AdvanceResponse> {
  return await prisma.$transaction(async (tx) => {
    const advance = await tx.advance.findFirst({
      where: { id: advanceId, workspaceId },
    });
    if (!advance) {
      throw new EntityNotFoundError("Advance not found");
    }

    const invoice = await tx.invoice.findFirst({
      where: { id: data.invoiceId, workspaceId },
    });
    if (!invoice) {
      throw new EntityNotFoundError("Invoice not found");
    }
    if (invoice.clientId !== advance.clientId) {
      throw new EntityValidationError(
        "Advance client must match invoice client to link records",
      );
    }

    const updated = await tx.advance.update({
      data: { invoiceId: invoice.id, status: "INVOICED" },
      include: {
        attachments: true,
        business: true,
        client: true,
      },
      where: { id: advanceId },
    });

    return toAdvanceResponse(updated);
  });
}

export async function unlinkAdvanceFromInvoice(
  workspaceId: number,
  advanceId: number,
  data: UnlinkAdvanceFromInvoiceDTO,
): Promise<AdvanceResponse> {
  const existing = await prisma.advance.findFirst({
    where: { id: advanceId, workspaceId },
  });
  if (!existing) {
    throw new EntityNotFoundError("Advance not found");
  }

  const updated = await prisma.advance.update({
    data: {
      invoiceId: null,
      status: data.keepStatus,
    },
    include: {
      attachments: true,
      business: true,
      client: true,
    },
    where: { id: advanceId },
  });

  return toAdvanceResponse(updated);
}

export async function listPendingAdvancesByClient(
  workspaceId: number,
  clientId: number,
): Promise<AdvanceListItemResponse[]> {
  const rows = await prisma.advance.findMany({
    include: {
      business: true,
      client: true,
    },
    orderBy: [{ advanceDate: "desc" }, { createdAt: "desc" }],
    where: {
      clientId,
      invoiceId: null,
      workspaceId,
    },
  });

  return rows.map(toAdvanceListItem);
}

export async function bulkLinkAdvancesToInvoice(
  workspaceId: number,
  invoiceId: number,
  data: BulkLinkAdvancesToInvoiceDTO,
): Promise<AdvanceListItemResponse[]> {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, workspaceId },
    });
    if (!invoice) {
      throw new EntityNotFoundError("Invoice not found");
    }

    const advances = await tx.advance.findMany({
      where: {
        id: { in: data.advanceIds },
        workspaceId,
      },
    });

    if (advances.length !== data.advanceIds.length) {
      throw new EntityValidationError(
        "One or more advances were not found in your workspace",
      );
    }

    const invalidClient = advances.some(
      (row) => row.clientId !== invoice.clientId,
    );
    if (invalidClient) {
      throw new EntityValidationError(
        "All advances must belong to the invoice client",
      );
    }

    const invoiced = advances.some((row) => row.status === "INVOICED");
    if (invoiced) {
      throw new EntityValidationError("Invoiced advances cannot be linked");
    }

    await tx.advance.updateMany({
      data: { invoiceId, status: "INVOICED" },
      where: { id: { in: data.advanceIds } },
    });

    const updated = await tx.advance.findMany({
      include: { business: true, client: true },
      where: { id: { in: data.advanceIds } },
    });

    return updated.map(toAdvanceListItem);
  });
}

interface SyncAdvanceAttachmentsInput {
  keptAttachmentIds: number[];
  orderTokens?: string[];
}

interface SyncAdvanceAttachmentsResult {
  attachments: AdvanceResponse["attachments"];
  deletedCount: number;
  failedUploads: { error: string; fileName: string }[];
  uploadedCount: number;
}

export interface AdvancePdfPayload {
  advance: {
    advanceDate: Date | string;
    location: null | string;
    projectName: string;
    sequence: number;
    workCompleted: null | string;
  };
  attachments: Array<{
    fileName: null | string;
    mimeType: null | string;
    url: string;
  }>;
  client: {
    email: null | string;
    name: string;
    phone: null | string;
  };
  company: {
    address: null | string;
    logo: null | string;
    name: string;
    phone: null | string;
  };
}

export async function syncAdvanceAttachments(
  workspaceId: number,
  advanceId: number,
  input: SyncAdvanceAttachmentsInput,
  files: Express.Multer.File[],
): Promise<SyncAdvanceAttachmentsResult> {
  const advance = await prisma.advance.findFirst({
    where: { id: advanceId, workspaceId },
  });
  if (!advance) {
    throw new EntityNotFoundError("Advance not found");
  }

  const currentAttachments = await prisma.advanceAttachment.findMany({
    orderBy: { sequence: "asc" },
    where: { advanceId },
  });

  const currentIds = new Set(currentAttachments.map((item) => item.id));
  const invalidKeptIds = input.keptAttachmentIds.filter((id) => !currentIds.has(id));
  if (invalidKeptIds.length > 0) {
    throw new EntityValidationError(
      "One or more kept attachment IDs do not belong to this advance",
    );
  }

  const keepSet = new Set(input.keptAttachmentIds);
  const toDelete = currentAttachments.filter((item) => !keepSet.has(item.id));

  if (toDelete.length > 0) {
    await prisma.advanceAttachment.deleteMany({
      where: { id: { in: toDelete.map((item) => item.id) } },
    });
  }

  for (const item of toDelete) {
    const publicId = extractPublicIdFromUrl(item.url);
    if (!publicId) continue;
    try {
      await deleteAdvanceAttachmentByPublicIdSafe(publicId);
    } catch (error) {
      console.error("Failed to delete advance attachment from Cloudinary:", error);
    }
  }

  const failedUploads: { error: string; fileName: string }[] = [];
  const uploadedRows: {
    fileName: null | string;
    id: number;
    mimeType: null | string;
  }[] = [];

  for (const file of files) {
    const validation = validateAdvanceAttachmentFileSafe(file);
    if (!validation.valid) {
      failedUploads.push({
        error: validation.error ?? "Invalid file",
        fileName: file.originalname || "unknown-file",
      });
      continue;
    }

    try {
      const uploaded = await uploadAdvanceAttachmentSafe(
        file,
        workspaceId,
        advanceId,
      );
      const created = await prisma.advanceAttachment.create({
        data: {
          advanceId,
          fileName: file.originalname || null,
          mimeType: file.mimetype || null,
          sequence: 0,
          url: uploaded.secure_url,
        },
      });

      uploadedRows.push({
        fileName: created.fileName,
        id: created.id,
        mimeType: created.mimeType,
      });
    } catch (error) {
      failedUploads.push({
        error: error instanceof Error ? error.message : "Upload failed",
        fileName: file.originalname || "unknown-file",
      });
    }
  }

  const keptRows = await prisma.advanceAttachment.findMany({
    where: {
      advanceId,
      id: { in: input.keptAttachmentIds },
    },
  });
  const keptById = new Map(keptRows.map((row) => [row.id, row]));

  const orderedIds: number[] = [];
  if (input.orderTokens && input.orderTokens.length > 0) {
    for (const token of input.orderTokens) {
      if (token.startsWith("id:")) {
        const id = Number(token.slice(3));
        if (Number.isInteger(id) && keptById.has(id)) {
          orderedIds.push(id);
        }
      } else if (token.startsWith("new:")) {
        const idx = Number(token.slice(4));
        if (Number.isInteger(idx) && idx >= 0 && idx < uploadedRows.length) {
          const uploadedRow = uploadedRows[idx];
          if (uploadedRow) {
            orderedIds.push(uploadedRow.id);
          }
        }
      }
    }
  }

  const fallbackIds = [...input.keptAttachmentIds, ...uploadedRows.map((r) => r.id)];
  for (const id of fallbackIds) {
    if (!orderedIds.includes(id)) {
      orderedIds.push(id);
    }
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.advanceAttachment.update({
        data: { sequence: index + 1 },
        where: { id },
      }),
    ),
  );

  const finalRows = await prisma.advanceAttachment.findMany({
    orderBy: { sequence: "asc" },
    where: { advanceId },
  });

  return {
    attachments: finalRows,
    deletedCount: toDelete.length,
    failedUploads,
    uploadedCount: uploadedRows.length,
  };
}

export function buildAdvancePdfPayload(advance: AdvanceResponse): AdvancePdfPayload {
  return {
    advance: {
      advanceDate: advance.advanceDate,
      location: advance.location ?? null,
      projectName: advance.projectName,
      sequence: advance.sequence,
      workCompleted: advance.workCompleted ?? null,
    },
    attachments: (advance.attachments ?? []).map((attachment) => ({
      fileName: attachment.fileName ?? null,
      mimeType: attachment.mimeType ?? null,
      url: attachment.url,
    })),
    client: {
      email: advance.client?.email ?? null,
      name: advance.client?.name ?? "Client",
      phone: advance.client?.phone ?? null,
    },
    company: {
      address: advance.business?.address ?? null,
      logo: advance.business?.logo ?? null,
      name: advance.business?.name ?? "Business",
      phone: advance.business?.phone ?? null,
    },
  };
}
