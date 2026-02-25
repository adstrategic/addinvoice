import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum image dimensions
 */
const MAX_DIMENSIONS = {
  height: 2000,
  width: 2000,
};

/** Response shape from Cloudinary uploader.destroy() */
interface DestroyApiResponse {
  result: string;
}

/**
 * Delete business logo from Cloudinary
 */
export async function deleteBusinessLogo(
  publicId: string,
): Promise<{ result: string }> {
  try {
    const result = (await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    })) as DestroyApiResponse;

    if (result.result !== "ok") {
      throw new Error(`Failed to delete logo: ${result.result}`);
    }

    return result;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Cloudinary delete failed: ${err.message}`);
  }
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): null | string {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/.exec(url);
    if (match?.[1]) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate public ID for business logo
 */
export function generatePublicId(
  workspaceId: number,
  businessId: number,
): string {
  return `workspaces/${String(workspaceId)}/businesses/${String(businessId)}/logo`;
}

/**
 * Upload business logo to Cloudinary
 * Accepts a multer file object
 */
export async function uploadBusinessLogo(
  file: Express.Multer.File,
  workspaceId: number,
  businessId: number,
): Promise<UploadApiResponse> {
  const publicId = generatePublicId(workspaceId, businessId);

  try {
    const uploadOptions = {
      folder: `workspaces/${String(workspaceId)}/businesses/${String(businessId)}`,
      invalidate: true, // Invalidate CDN cache
      overwrite: true,
      public_id: publicId,
      resource_type: "image" as const,
      transformation: [
        {
          crop: "limit" as const,
          fetch_format: "auto" as const,
          height: MAX_DIMENSIONS.height,
          quality: "auto" as const,
          width: MAX_DIMENSIONS.width,
        },
        {
          strip_metadata: true, // Remove EXIF data
        },
      ],
    };

    // Convert buffer to base64 data URI for Cloudinary
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64, uploadOptions);

    return result;
  } catch (error) {
    const uploadError = error as UploadApiErrorResponse;
    throw new Error(
      `Cloudinary upload failed: ${uploadError.message || "Unknown error"}`,
    );
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: Express.Multer.File): {
  error?: string;
  valid: boolean;
} {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: `File size exceeds maximum of ${String(MAX_FILE_SIZE / 1024 / 1024)}MB`,
      valid: false,
    };
  }

  // Check MIME type
  if (!file.mimetype || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
      valid: false,
    };
  }

  // For non-SVG images, validate dimensions
  if (file.mimetype !== "image/svg+xml") {
    // Note: We'll validate dimensions after upload to Cloudinary
    // as we need to read the image first
  }

  return { valid: true };
}
