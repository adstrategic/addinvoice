import type {
  bulkLinkAdvancesToInvoiceBodySchema,
  createAdvanceSchema,
  generateAdvanceReportBodySchema,
  linkAdvanceToInvoiceBodySchema,
  listAdvancesQuerySchema,
  listPendingAdvancesByClientSchema,
  sendAdvanceBodySchema,
  unlinkAdvanceFromInvoiceBodySchema,
  updateAdvanceSchema,
} from "@addinvoice/schemas";
import {
  getAdvanceByIdSchema,
  syncAdvanceAttachmentsMetaSchema,
} from "@addinvoice/schemas";
import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import { getWorkspaceId } from "../../core/auth.js";
import { sendAdvanceQueue } from "../../queue/queues.js";
import * as advancesService from "./advances.service.js";

export async function createAdvance(
  req: TypedRequest<never, never, typeof createAdvanceSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const advance = await advancesService.createAdvance(workspaceId, req.body);
  res.status(201).json({ data: advance });
}

export async function listAdvances(
  req: TypedRequest<never, typeof listAdvancesQuerySchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const result = await advancesService.listAdvances(workspaceId, req.query);
  res.json({
    data: result.data,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

export async function getAdvanceById(
  req: TypedRequest<typeof getAdvanceByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const advance = await advancesService.getAdvanceById(
    workspaceId,
    req.params.advanceId,
  );
  res.json({ data: advance });
}

export async function getAdvancePdf(
  req: TypedRequest<typeof getAdvanceByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { advanceId } = req.params;
  const advance = await advancesService.getAdvanceById(workspaceId, advanceId);

  const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
  const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();
  if (!pdfServiceUrl || !pdfServiceSecret) {
    console.error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
    res.status(500).json({ error: "Failed to generate PDF" });
    return;
  }

  const payload = advancesService.buildAdvancePdfPayload(advance);

  try {
    const pdfResponse = await fetch(
      `${pdfServiceUrl.replace(/\/$/, "")}/generate-advance`,
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "X-PDF-Service-Key": pdfServiceSecret,
        },
        method: "POST",
      },
    );

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      console.error("PDF service error:", pdfResponse.status, errText);
      res.status(500).json({
        error: "Failed to generate PDF",
        message: "PDF service unavailable",
      });
      return;
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="advance-${String(advance.sequence)}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function updateAdvance(
  req: TypedRequest<typeof getAdvanceByIdSchema, never, typeof updateAdvanceSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const advance = await advancesService.updateAdvance(
    workspaceId,
    req.params.advanceId,
    req.body,
  );
  res.json({ data: advance });
}

export async function deleteAdvance(
  req: TypedRequest<typeof getAdvanceByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  await advancesService.deleteAdvance(workspaceId, req.params.advanceId);
  res.status(204).send();
}

export async function generateAdvanceReport(
  req: TypedRequest<
    typeof getAdvanceByIdSchema,
    never,
    typeof generateAdvanceReportBodySchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const advance = await advancesService.generateAdvanceReport(
    workspaceId,
    req.params.advanceId,
    req.body,
  );
  res.json({ data: advance });
}

export async function sendAdvance(
  req: TypedRequest<typeof getAdvanceByIdSchema, never, typeof sendAdvanceBodySchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const advance = await advancesService.sendAdvance(
    workspaceId,
    req.params.advanceId,
    req.body,
  );

  await sendAdvanceQueue.add("send-advance", {
    advanceId: advance.id,
    email: req.body.email,
    message: req.body.message ?? "",
    subject: req.body.subject,
    workspaceId,
  });

  res.status(202).json({
    message: "Advance is being sent",
  });
}

export async function linkAdvanceToInvoice(
  req: TypedRequest<
    typeof getAdvanceByIdSchema,
    never,
    typeof linkAdvanceToInvoiceBodySchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const advance = await advancesService.linkAdvanceToInvoice(
    workspaceId,
    req.params.advanceId,
    req.body,
  );
  res.json({ data: advance });
}

export async function unlinkAdvanceFromInvoice(
  req: TypedRequest<
    typeof getAdvanceByIdSchema,
    never,
    typeof unlinkAdvanceFromInvoiceBodySchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const advance = await advancesService.unlinkAdvanceFromInvoice(
    workspaceId,
    req.params.advanceId,
    req.body,
  );
  res.json({ data: advance });
}

export async function listPendingAdvancesByClient(
  req: TypedRequest<typeof listPendingAdvancesByClientSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const rows = await advancesService.listPendingAdvancesByClient(
    workspaceId,
    req.params.clientId,
  );
  res.json({ data: rows });
}

export async function bulkLinkAdvancesToInvoice(
  req: TypedRequest<
    typeof getAdvanceByIdSchema,
    never,
    typeof bulkLinkAdvancesToInvoiceBodySchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const rows = await advancesService.bulkLinkAdvancesToInvoice(
    workspaceId,
    req.params.advanceId,
    req.body,
  );
  res.json({ data: rows });
}

export async function syncAdvanceAttachments(
  req: TypedRequest<typeof getAdvanceByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { advanceId } = req.params;

  const body = ((req as unknown as { body?: Record<string, unknown> }).body ??
    {}) as Record<string, unknown>;
  const keptRaw = body.keptAttachmentIds;
  const orderRaw = body.orderTokens;

  const parseArrayField = (value: unknown): unknown => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(",").map((item) => item.trim());
      }
    }
    return [];
  };

  const parsedMeta = syncAdvanceAttachmentsMetaSchema.safeParse({
    keptAttachmentIds: parseArrayField(keptRaw),
    orderTokens: parseArrayField(orderRaw),
  });

  if (!parsedMeta.success) {
    res.status(400).json({
      error: parsedMeta.error.flatten().fieldErrors,
    });
    return;
  }

  const files = Array.isArray(req.files)
    ? (req.files as Express.Multer.File[])
    : [];

  const result = await advancesService.syncAdvanceAttachments(
    workspaceId,
    advanceId,
    parsedMeta.data,
    files,
  );

  res.json({ data: result });
}
