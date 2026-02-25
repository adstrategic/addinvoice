import { Router } from "express";
import multer from "multer";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  createBusiness,
  deleteBusiness,
  deleteLogo,
  getBusinessById,
  listBusinesses,
  setDefaultBusiness,
  updateBusiness,
  uploadLogo,
} from "./businesses.controller.js";
import {
  createBusinessSchema,
  getBusinessByIdSchema,
  listBusinessesSchema,
  setDefaultBusinessSchema,
  updateBusinessSchema,
} from "./businesses.schemas.js";

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  storage: multer.memoryStorage(),
});

/**
 * Businesses routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const businessesRoutes: Router = Router();

// GET /api/v1/businesses - List all businesses
businessesRoutes.get(
  "/",
  processRequest({ query: listBusinessesSchema }),
  asyncHandler(listBusinesses),
);

// GET /api/v1/businesses/:id - Get business by ID
businessesRoutes.get(
  "/:id",
  processRequest({ params: getBusinessByIdSchema }),
  asyncHandler(getBusinessById),
);

// POST /api/v1/businesses - Create a new business
businessesRoutes.post(
  "/",
  processRequest({ body: createBusinessSchema }),
  asyncHandler(createBusiness),
);

// PATCH /api/v1/businesses/:id - Update a business
businessesRoutes.patch(
  "/:id",
  processRequest({
    body: updateBusinessSchema,
    params: getBusinessByIdSchema,
  }),
  asyncHandler(updateBusiness),
);

// DELETE /api/v1/businesses/:id - Delete a business (soft delete)
businessesRoutes.delete(
  "/:id",
  processRequest({ params: getBusinessByIdSchema }),
  asyncHandler(deleteBusiness),
);

// PATCH /api/v1/businesses/:id/default - Set business as default
businessesRoutes.patch(
  "/:id/default",
  processRequest({ params: setDefaultBusinessSchema }),
  asyncHandler(setDefaultBusiness),
);

// POST /api/v1/businesses/:id/logo - Upload business logo
businessesRoutes.post(
  "/:id/logo",
  upload.single("logo") as never,
  processRequest({ params: getBusinessByIdSchema }),
  asyncHandler(uploadLogo),
);

// DELETE /api/v1/businesses/:id/logo - Delete business logo
businessesRoutes.delete(
  "/:id/logo",
  processRequest({ params: getBusinessByIdSchema }),
  asyncHandler(deleteLogo),
);
