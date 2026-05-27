import {
  createEstimateDescriptiveItemSchema,
  createEstimateItemSchema,
  createEstimateSchema,
  updateEstimateDescriptiveItemSchema,
  updateEstimateItemSchema,
  updateEstimateSchema,
} from "@addinvoice/schemas";
import { Router } from "express";
import multer from "multer";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  addEstimateDescriptiveItem,
  addEstimateItem,
  convertEstimateToInvoice,
  createEstimate,
  createEstimateFromVoiceAudio,
  deleteEstimate,
  deleteEstimateDescriptiveItem,
  deleteEstimateItem,
  voidEstimate,
  enqueueSendEstimate,
  getEstimateBySequence,
  getEstimatePdf,
  getNextEstimateNumber,
  listEstimates,
  markEstimateAsAccepted,
  sendEstimate,
  shareEstimatePublicLink,
  updateEstimate,
  updateEstimateDescriptiveItem,
  updateEstimateItem,
} from "./estimates.controller.js";
import {
  fromVoiceAudioBodySchema,
  getEstimateByIdSchema,
  getEstimateBySequenceSchema,
  getEstimateDescriptiveItemByIdSchema,
  getEstimateItemByIdSchema,
  getNextEstimateNumberQuerySchema,
  listEstimatesSchema,
  sendEstimateBodySchema,
} from "./estimates.schemas.js";

/**
 * Estimates routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const estimatesRoutes: Router = Router();

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const base = file.mimetype.split(";")[0]?.trim() ?? "";
    cb(null, base.startsWith("audio/"));
  },
});

// POST /api/v1/estimates/from-voice-audio — audio blob → Whisper → Claude → draft estimate
estimatesRoutes.post(
  "/from-voice-audio",
  audioUpload.single("audio") as never,
  processRequest({ body: fromVoiceAudioBodySchema }),
  asyncHandler(createEstimateFromVoiceAudio),
);

// GET /api/v1/estimates/next-number - Get next suggested estimate number
estimatesRoutes.get(
  "/next-number",
  processRequest({ query: getNextEstimateNumberQuerySchema }),
  asyncHandler(getNextEstimateNumber),
);

// GET /api/v1/estimates - List all estimates
estimatesRoutes.get(
  "/",
  processRequest({ query: listEstimatesSchema }),
  asyncHandler(listEstimates),
);

// POST /api/v1/estimates/:sequence/convert-to-invoice - Convert accepted estimate to invoice (must be before /:sequence)
estimatesRoutes.post(
  "/:sequence/convert-to-invoice",
  processRequest({ params: getEstimateBySequenceSchema }),
  asyncHandler(convertEstimateToInvoice),
);

// GET /api/v1/estimates/:sequence/pdf - Get estimate as PDF (must be before /:sequence)
estimatesRoutes.get(
  "/:sequence/pdf",
  processRequest({ params: getEstimateBySequenceSchema }),
  asyncHandler(getEstimatePdf),
);

// POST /api/v1/estimates/:sequence/send - Enqueue send estimate email (202)
estimatesRoutes.post(
  "/:sequence/send",
  processRequest({
    body: sendEstimateBodySchema,
    params: getEstimateBySequenceSchema,
  }),
  asyncHandler(enqueueSendEstimate),
);

// POST /api/v1/estimates/:sequence/share-link - Issue via public link
estimatesRoutes.post(
  "/:sequence/share-link",
  processRequest({ params: getEstimateBySequenceSchema }),
  asyncHandler(shareEstimatePublicLink),
);

// GET /api/v1/estimates/:id - Get estimate by ID
estimatesRoutes.get(
  "/:sequence",
  processRequest({ params: getEstimateBySequenceSchema }),
  asyncHandler(getEstimateBySequence),
);

// POST /api/v1/estimates - Create a new estimate
estimatesRoutes.post(
  "/",
  processRequest({ body: createEstimateSchema }),
  asyncHandler(createEstimate),
);

// PATCH /api/v1/estimates/:estimateId/send - Mark estimate as sent
// Must be before /:estimateId to avoid route conflicts
estimatesRoutes.patch(
  "/:estimateId/send",
  processRequest({ params: getEstimateByIdSchema }),
  asyncHandler(sendEstimate),
);

// PATCH /api/v1/estimates/:estimateId/accept - Mark estimate as accepted
estimatesRoutes.patch(
  "/:estimateId/accept",
  processRequest({ params: getEstimateByIdSchema }),
  asyncHandler(markEstimateAsAccepted),
);

// PATCH /api/v1/estimates/:id - Update an estimate
estimatesRoutes.patch(
  "/:estimateId",
  processRequest({
    body: updateEstimateSchema,
    params: getEstimateByIdSchema,
  }),
  asyncHandler(updateEstimate),
);

// DELETE /api/v1/estimates/:id - Delete an estimate (soft delete)
estimatesRoutes.delete(
  "/:estimateId",
  processRequest({ params: getEstimateByIdSchema }),
  asyncHandler(deleteEstimate),
);

// POST /api/v1/estimates/:estimateId/void - Mark estimate as voided
estimatesRoutes.post(
  "/:estimateId/void",
  processRequest({ params: getEstimateByIdSchema }),
  asyncHandler(voidEstimate),
);

// POST /api/v1/estimates/:estimateId/items - Add an estimate item
estimatesRoutes.post(
  "/:estimateId/items",
  processRequest({
    body: createEstimateItemSchema,
    params: getEstimateByIdSchema,
  }),
  asyncHandler(addEstimateItem),
);

// PATCH /api/v1/estimates/:estimateId/items/:itemId - Update an estimate item
estimatesRoutes.patch(
  "/:estimateId/items/:itemId",
  processRequest({
    body: updateEstimateItemSchema,
    params: getEstimateItemByIdSchema,
  }),
  asyncHandler(updateEstimateItem),
);

// DELETE /api/v1/estimates/:estimateId/items/:itemId - Delete an estimate item
estimatesRoutes.delete(
  "/:estimateId/items/:itemId",
  processRequest({ params: getEstimateItemByIdSchema }),
  asyncHandler(deleteEstimateItem),
);

// POST /api/v1/estimates/:estimateId/descriptive-items - Add a descriptive item
estimatesRoutes.post(
  "/:estimateId/descriptive-items",
  processRequest({
    body: createEstimateDescriptiveItemSchema,
    params: getEstimateByIdSchema,
  }),
  asyncHandler(addEstimateDescriptiveItem),
);

// PATCH /api/v1/estimates/:estimateId/descriptive-items/:descriptiveItemId - Update descriptive item
estimatesRoutes.patch(
  "/:estimateId/descriptive-items/:descriptiveItemId",
  processRequest({
    body: updateEstimateDescriptiveItemSchema,
    params: getEstimateDescriptiveItemByIdSchema,
  }),
  asyncHandler(updateEstimateDescriptiveItem),
);

// DELETE /api/v1/estimates/:estimateId/descriptive-items/:descriptiveItemId - Delete descriptive item
estimatesRoutes.delete(
  "/:estimateId/descriptive-items/:descriptiveItemId",
  processRequest({ params: getEstimateDescriptiveItemByIdSchema }),
  asyncHandler(deleteEstimateDescriptiveItem),
);
