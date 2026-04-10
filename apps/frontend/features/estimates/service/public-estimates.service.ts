import { publicApiClient } from "@/lib/api/public-client";
import {
  publicEstimateSummarySchema,
  type PublicEstimateSummary,
} from "@addinvoice/schemas";

/** Re-export for consumers that import from this service */
export { PublicEstimateError } from "@/lib/errors/handler";

const PUBLIC_ESTIMATES_BASE = "/public/estimates";

/**
 * Fetch estimate summary by accept token (public, no auth).
 * Throws on 404, 410, or network errors (publicApiClient interceptor).
 */
export async function getEstimateByAcceptToken(
  token: string,
): Promise<PublicEstimateSummary> {
  try {
    const { data } = await publicApiClient.get<{ data: unknown }>(
      `${PUBLIC_ESTIMATES_BASE}/accept/${encodeURIComponent(token)}`,
    );
    return publicEstimateSummarySchema.parse(data.data);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Fetch estimate PDF by accept token (public, no auth).
 */
export async function getEstimatePdfByAcceptToken(
  token: string,
): Promise<Uint8Array> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/estimates/accept/${encodeURIComponent(token)}/pdf`,
  );

  if (!response.ok) {
    throw new Error("Failed to load PDF preview");
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Payload for accepting a estimate by token */
export type AcceptEstimateByTokenBody = {
  fullName: string;
  signatureData?: {
    fullName: string;
    signedAt: string;
    signatureImage?: string;
  };
};

/**
 * Accept estimate by token (public, no auth).
 * Throws PublicEstimateError on 409, ApiError on other errors (publicApiClient interceptor).
 */
export async function acceptEstimateByToken(
  token: string,
  body: AcceptEstimateByTokenBody,
): Promise<{ message: string }> {
  const { data } = await publicApiClient.post<{ message?: string }>(
    `${PUBLIC_ESTIMATES_BASE}/accept/${encodeURIComponent(token)}`,
    body,
  );
  return { message: data?.message ?? "Estimate accepted" };
}

/** Payload for rejecting a estimate by token */
export type RejectEstimateByTokenBody = {
  rejectionReason?: string;
};

/**
 * Reject estimate by token (public, no auth).
 * Throws PublicEstimateError on 409, ApiError on other errors (publicApiClient interceptor).
 */
export async function rejectEstimateByToken(
  token: string,
  body: RejectEstimateByTokenBody,
): Promise<{ message: string }> {
  const { data } = await publicApiClient.post<{ message?: string }>(
    `${PUBLIC_ESTIMATES_BASE}/reject/${encodeURIComponent(token)}`,
    body,
  );
  return { message: data?.message ?? "Estimate rejected" };
}
