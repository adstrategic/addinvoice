import { publicApiClient } from "@/lib/api/public-client";
import {
  publicProposalSummarySchema,
  type PublicProposalSummary,
} from "@addinvoice/schemas";

const PUBLIC_PROPOSALS_BASE = "/public/proposals";

/**
 * Fetch proposal summary by accept token (public, no auth).
 * Throws on 404, 410, or network errors (publicApiClient interceptor).
 */
export async function getProposalByAcceptToken(
  token: string,
): Promise<PublicProposalSummary> {
  try {
    const { data } = await publicApiClient.get<{ data: unknown }>(
      `${PUBLIC_PROPOSALS_BASE}/accept/${encodeURIComponent(token)}`,
    );
    return publicProposalSummarySchema.parse(data.data);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Fetch proposal PDF by accept token (public, no auth).
 */
export async function getProposalPdfByAcceptToken(
  token: string,
): Promise<Uint8Array> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/proposals/accept/${encodeURIComponent(token)}/pdf`,
  );

  if (!response.ok) {
    throw new Error("Failed to load PDF preview");
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Payload for accepting a proposal by token */
export type AcceptProposalByTokenBody = {
  fullName: string;
  signatureData?: {
    fullName: string;
    signedAt: string;
    signatureImage?: string;
  };
};

/**
 * Accept proposal by token (public, no auth).
 * Throws PublicProposalError on 409, ApiError on other errors (publicApiClient interceptor).
 */
export async function acceptProposalByToken(
  token: string,
  body: AcceptProposalByTokenBody,
): Promise<{ message: string }> {
  const { data } = await publicApiClient.post<{ message?: string }>(
    `${PUBLIC_PROPOSALS_BASE}/accept/${encodeURIComponent(token)}`,
    body,
  );
  return { message: data?.message ?? "Proposal accepted" };
}

/** Payload for rejecting a proposal by token */
export type RejectProposalByTokenBody = {
  rejectionReason?: string;
};

/**
 * Reject proposal by token (public, no auth).
 * Throws PublicProposalError on 409, ApiError on other errors (publicApiClient interceptor).
 */
export async function rejectProposalByToken(
  token: string,
  body: RejectProposalByTokenBody,
): Promise<{ message: string }> {
  const { data } = await publicApiClient.post<{ message?: string }>(
    `${PUBLIC_PROPOSALS_BASE}/reject/${encodeURIComponent(token)}`,
    body,
  );
  return { message: data?.message ?? "Proposal rejected" };
}
