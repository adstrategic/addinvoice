import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import {
  proposalResponseSchema,
  type ProposalResponse,
  type ProposalDescriptiveItemResponse,
  type CreateProposalDescriptiveItemDTO,
  type UpdateProposalDTO,
  type UpdateProposalDescriptiveItemDTO,
  proposalDescriptiveItemResponseSchema,
} from "@addinvoice/schemas";

import {
  proposalResponseListSchema,
  type ProposalResponseList,
} from "../schemas/proposal.schema";

const BASE_URL = "/proposals";

export type ListProposalsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: number;
  businessId?: number;
};

export type ConvertProposalToInvoiceResponse = {
  id: number;
  sequence: number;
  invoiceNumber: string;
};

async function listProposals(
  params?: ListProposalsParams,
): Promise<ProposalResponseList> {
  try {
    const { data } = await apiClient.get<ProposalResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        status: params?.status,
        clientId: params?.clientId,
        businessId: params?.businessId,
      },
    });
    return proposalResponseListSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getProposalBySequence(
  sequence: number,
): Promise<ProposalResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<ProposalResponse>>(
      `${BASE_URL}/${sequence}`,
    );
    return proposalResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateProposal(
  id: number,
  dto: UpdateProposalDTO,
): Promise<ProposalResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<ProposalResponse>
    >(`${BASE_URL}/${id}`, dto);
    return proposalResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function markAsAccepted(proposalId: number): Promise<ProposalResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<ProposalResponse>
    >(`${BASE_URL}/${proposalId}/accept`);
    return proposalResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function sendProposal(sequence: number): Promise<ProposalResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<ProposalResponse>>(
      `${BASE_URL}/${sequence}/send`,
    );
    return proposalResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function convertProposalToInvoice(
  sequence: number,
): Promise<ConvertProposalToInvoiceResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<ConvertProposalToInvoiceResponse>
    >(`${BASE_URL}/${sequence}/convert-to-invoice`);
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteProposal(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

async function createProposalDescriptiveItem(
  proposalId: number,
  dto: CreateProposalDescriptiveItemDTO,
): Promise<ProposalDescriptiveItemResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<ProposalDescriptiveItemResponse>
    >(`${BASE_URL}/${proposalId}/descriptive-items`, dto);
    return proposalDescriptiveItemResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateProposalDescriptiveItem(
  proposalId: number,
  descriptiveItemId: number,
  dto: UpdateProposalDescriptiveItemDTO,
): Promise<ProposalDescriptiveItemResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<ProposalDescriptiveItemResponse>
    >(`${BASE_URL}/${proposalId}/descriptive-items/${descriptiveItemId}`, dto);
    return proposalDescriptiveItemResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteProposalDescriptiveItem(
  proposalId: number,
  descriptiveItemId: number,
): Promise<void> {
  try {
    await apiClient.delete(
      `${BASE_URL}/${proposalId}/descriptive-items/${descriptiveItemId}`,
    );
  } catch (error) {
    handleApiError(error);
  }
}

export const proposalsService = {
  list: listProposals,
  getBySequence: getProposalBySequence,
  update: updateProposal,
  markAsAccepted,
  send: sendProposal,
  convertToInvoice: convertProposalToInvoice,
  delete: deleteProposal,
  createDescriptiveItem: createProposalDescriptiveItem,
  updateDescriptiveItem: updateProposalDescriptiveItem,
  deleteDescriptiveItem: deleteProposalDescriptiveItem,
};
