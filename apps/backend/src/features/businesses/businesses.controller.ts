import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  createBusinessSchema,
  getBusinessByIdSchema,
  setDefaultBusinessSchema,
  updateBusinessSchema,
} from "./businesses.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import {
  deleteBusinessLogo,
  extractPublicIdFromUrl,
  uploadBusinessLogo,
  validateImageFile,
} from "../../core/cloudinary.js";
import { listBusinessesSchema } from "./businesses.schemas.js";
import * as businessesService from "./businesses.service.js";

/**
 * POST /businesses - Create a new business
 * No error handling needed - middleware handles it
 */
export async function createBusiness(
  req: TypedRequest<never, never, typeof createBusinessSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const body = req.body;

  const business = await businessesService.createBusiness(workspaceId, body);

  res.status(201).json({
    data: business,
  });
}

/**
 * DELETE /businesses/:id - Delete a business (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteBusiness(
  req: TypedRequest<typeof getBusinessByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;

  await businessesService.deleteBusiness(workspaceId, id);

  res.json({
    message: "Business deleted successfully",
  });
}

/**
 * DELETE /businesses/:id/logo - Delete business logo
 */
export async function deleteLogo(
  req: TypedRequest<typeof getBusinessByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;

  // Verify business exists and belongs to workspace
  const business = await businessesService.getBusinessById(workspaceId, id);

  if (!business.logo) {
    res.status(404).json({
      error: "Business has no logo to delete",
    });
    return;
  }

  // Extract public ID from URL
  const publicId = extractPublicIdFromUrl(business.logo);
  if (!publicId) {
    res.status(400).json({
      error: "Invalid logo URL",
    });
    return;
  }

  // Delete from Cloudinary
  await deleteBusinessLogo(publicId);

  // Update business to remove logo URL
  const updatedBusiness = await businessesService.updateBusiness(
    workspaceId,
    id,
    { logo: null },
  );

  res.json({
    data: updatedBusiness,
  });
}

/**
 * GET /businesses/:id - Get business by ID
 * No error handling needed - middleware handles it
 */
export async function getBusinessById(
  req: TypedRequest<typeof getBusinessByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;

  const business = await businessesService.getBusinessById(workspaceId, id);

  res.json({
    data: business,
  });
}

/**
 * GET /businesses - List all businesses
 * No error handling needed - middleware handles it
 */
export async function listBusinesses(
  req: TypedRequest<never, typeof listBusinessesSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await businessesService.listBusinesses(workspaceId, query);

  res.json({
    data: result.businesses,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * PATCH /businesses/:id/default - Set business as default
 * No error handling needed - middleware handles it
 */
export async function setDefaultBusiness(
  req: TypedRequest<typeof setDefaultBusinessSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;

  const business = await businessesService.setDefaultBusiness(workspaceId, id);

  res.json({
    data: business,
  });
}

/**
 * PATCH /businesses/:id - Update a business
 * No error handling needed - middleware handles it
 */
export async function updateBusiness(
  req: TypedRequest<
    typeof getBusinessByIdSchema,
    never,
    typeof updateBusinessSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;
  const body = req.body;

  const business = await businessesService.updateBusiness(
    workspaceId,
    id,
    body,
  );

  res.json({
    data: business,
  });
}

/**
 * POST /businesses/:id/logo - Upload business logo
 */
export async function uploadLogo(
  req: TypedRequest<typeof getBusinessByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    res.status(400).json({
      error: "No file provided",
    });
    return;
  }

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    res.status(400).json({
      error: validation.error,
    });
    return;
  }

  // Verify business exists and belongs to workspace
  const business = await businessesService.getBusinessById(workspaceId, id);

  // Delete old logo if exists
  if (business.logo) {
    const oldPublicId = extractPublicIdFromUrl(business.logo);
    if (oldPublicId) {
      try {
        await deleteBusinessLogo(oldPublicId);
      } catch (error) {
        // Log error but continue with upload
        console.error("Failed to delete old logo:", error);
      }
    }
  }

  // Upload to Cloudinary
  const uploadResult = await uploadBusinessLogo(file, workspaceId, id);

  // Update business with new logo URL
  const updatedBusiness = await businessesService.updateBusiness(
    workspaceId,
    id,
    { logo: uploadResult.secure_url },
  );

  res.json({
    data: updatedBusiness,
  });
}
