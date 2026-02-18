import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
  width: 2000,
  height: 2000,
};

/**
 * Validate image file
 */
export async function validateImageFile(
  file: Express.Multer.File
): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!file.mimetype || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // For non-SVG images, validate dimensions
  if (file.mimetype !== "image/svg+xml") {
    // Note: We'll validate dimensions after upload to Cloudinary
    // as we need to read the image first
  }

  return { valid: true };
}

/**
 * Generate public ID for business logo
 */
export function generatePublicId(
  workspaceId: number,
  businessId: number
): string {
  return `workspaces/${workspaceId}/businesses/${businessId}/logo`;
}

/**
 * Upload business logo to Cloudinary
 * Accepts a multer file object
 */
export async function uploadBusinessLogo(
  file: Express.Multer.File,
  workspaceId: number,
  businessId: number
): Promise<UploadApiResponse> {
  const publicId = generatePublicId(workspaceId, businessId);

  try {
    const uploadOptions = {
      public_id: publicId,
      folder: `workspaces/${workspaceId}/businesses/${businessId}`,
      resource_type: "image" as const,
      transformation: [
        {
          width: MAX_DIMENSIONS.width,
          height: MAX_DIMENSIONS.height,
          crop: "limit" as const,
          quality: "auto" as const,
          fetch_format: "auto" as const,
        },
        {
          strip_metadata: true, // Remove EXIF data
        },
      ],
      overwrite: true,
      invalidate: true, // Invalidate CDN cache
    };

    // Convert buffer to base64 data URI for Cloudinary
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64, uploadOptions);

    return result;
  } catch (error) {
    const uploadError = error as UploadApiErrorResponse;
    throw new Error(
      `Cloudinary upload failed: ${uploadError.message || "Unknown error"}`
    );
  }
}

/**
 * Delete business logo from Cloudinary
 */
export async function deleteBusinessLogo(
  publicId: string
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

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
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

