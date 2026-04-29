import {
  createAdvanceSchema,
  generateAdvanceReportBodySchema,
  getAdvanceByIdSchema,
  linkAdvanceToInvoiceBodySchema,
  listAdvancesQuerySchema,
  sendAdvanceBodySchema,
  unlinkAdvanceFromInvoiceBodySchema,
  updateAdvanceSchema,
} from "@addinvoice/schemas";
import { Router } from "express";
import multer from "multer";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  createAdvance,
  deleteAdvance,
  generateAdvanceReport,
  getAdvanceById,
  getAdvancePdf,
  linkAdvanceToInvoice,
  listAdvances,
  sendAdvance,
  syncAdvanceAttachments,
  unlinkAdvanceFromInvoice,
  updateAdvance,
} from "./advances.controller.js";

export const advancesRoutes: Router = Router();
const attachmentsUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage(),
});

advancesRoutes.get(
  "/",
  processRequest({ query: listAdvancesQuerySchema }),
  asyncHandler(listAdvances),
);

advancesRoutes.post(
  "/",
  processRequest({ body: createAdvanceSchema }),
  asyncHandler(createAdvance),
);

advancesRoutes.get(
  "/:advanceId/pdf",
  processRequest({ params: getAdvanceByIdSchema }),
  asyncHandler(getAdvancePdf),
);

advancesRoutes.get(
  "/:advanceId",
  processRequest({ params: getAdvanceByIdSchema }),
  asyncHandler(getAdvanceById),
);

advancesRoutes.patch(
  "/:advanceId",
  processRequest({
    body: updateAdvanceSchema,
    params: getAdvanceByIdSchema,
  }),
  asyncHandler(updateAdvance),
);

advancesRoutes.delete(
  "/:advanceId",
  processRequest({ params: getAdvanceByIdSchema }),
  asyncHandler(deleteAdvance),
);

advancesRoutes.post(
  "/:advanceId/generate",
  processRequest({
    body: generateAdvanceReportBodySchema,
    params: getAdvanceByIdSchema,
  }),
  asyncHandler(generateAdvanceReport),
);

advancesRoutes.post(
  "/:advanceId/send",
  processRequest({
    body: sendAdvanceBodySchema,
    params: getAdvanceByIdSchema,
  }),
  asyncHandler(sendAdvance),
);

advancesRoutes.post(
  "/:advanceId/link-invoice",
  processRequest({
    body: linkAdvanceToInvoiceBodySchema,
    params: getAdvanceByIdSchema,
  }),
  asyncHandler(linkAdvanceToInvoice),
);

advancesRoutes.post(
  "/:advanceId/unlink-invoice",
  processRequest({
    body: unlinkAdvanceFromInvoiceBodySchema,
    params: getAdvanceByIdSchema,
  }),
  asyncHandler(unlinkAdvanceFromInvoice),
);

advancesRoutes.post(
  "/:advanceId/attachments/sync",
  attachmentsUpload.array("newFiles", 20) as never,
  processRequest({ params: getAdvanceByIdSchema }),
  asyncHandler(syncAdvanceAttachments),
);
