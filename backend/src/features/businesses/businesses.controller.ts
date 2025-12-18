import { Response } from "express";
import * as businessesService from "./businesses.service";
import type {
  getBusinessByIdSchema,
  createBusinessSchema,
  updateBusinessSchema,
  setDefaultBusinessSchema,
} from "./businesses.schemas";
import { TypedRequest } from "zod-express-middleware";
import { listBusinessesSchema } from "./businesses.schemas";
import {
  uploadBusinessLogo,
  deleteBusinessLogo,
  validateImageFile,
  extractPublicIdFromUrl,
} from "../../core/cloudinary";

/**
 * GET /businesses - List all businesses
 * No error handling needed - middleware handles it
 */
export async function listBusinesses(
  req: TypedRequest<any, typeof listBusinessesSchema, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const query = req.query;

  const result = await businessesService.listBusinesses(workspaceId, query);

  res.json({
    success: true,
    data: result.businesses,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * GET /businesses/:id - Get business by ID
 * No error handling needed - middleware handles it
 */
export async function getBusinessById(
  req: TypedRequest<typeof getBusinessByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;

  const business = await businessesService.getBusinessById(workspaceId, id);

  res.json({
    success: true,
    data: business,
  });
}

/**
 * POST /businesses - Create a new business
 * No error handling needed - middleware handles it
 */
export async function createBusiness(
  req: TypedRequest<any, any, typeof createBusinessSchema>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const body = req.body;

  const business = await businessesService.createBusiness(workspaceId, body);

  res.status(201).json({
    success: true,
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
    any,
    typeof updateBusinessSchema
  >,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;
  const body = req.body;

  const business = await businessesService.updateBusiness(
    workspaceId,
    id,
    body
  );

  res.json({
    success: true,
    data: business,
  });
}

/**
 * DELETE /businesses/:id - Delete a business (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteBusiness(
  req: TypedRequest<typeof getBusinessByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;

  await businessesService.deleteBusiness(workspaceId, id);

  res.json({
    success: true,
    message: "Business deleted successfully",
  });
}

/**
 * PATCH /businesses/:id/default - Set business as default
 * No error handling needed - middleware handles it
 */
export async function setDefaultBusiness(
  req: TypedRequest<typeof setDefaultBusinessSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;

  const business = await businessesService.setDefaultBusiness(workspaceId, id);

  res.json({
    success: true,
    data: business,
  });
}

/**
 * POST /businesses/:id/logo - Upload business logo
 */
export async function uploadLogo(
  req: TypedRequest<typeof getBusinessByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      error: "No file provided",
    });
    return;
  }

  // Validate file
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    res.status(400).json({
      success: false,
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
    { logo: uploadResult.secure_url }
  );

  res.json({
    success: true,
    data: updatedBusiness,
  });
}

/**
 * DELETE /businesses/:id/logo - Delete business logo
 */
export async function deleteLogo(
  req: TypedRequest<typeof getBusinessByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;

  // Verify business exists and belongs to workspace
  const business = await businessesService.getBusinessById(workspaceId, id);

  if (!business.logo) {
    res.status(404).json({
      success: false,
      error: "Business has no logo to delete",
    });
    return;
  }

  // Extract public ID from URL
  const publicId = extractPublicIdFromUrl(business.logo);
  if (!publicId) {
    res.status(400).json({
      success: false,
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
    { logo: null }
  );

  res.json({
    success: true,
    data: updatedBusiness,
  });
}
