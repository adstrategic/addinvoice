import { useRouter } from "next/navigation";
import {
  useUpdateProposal,
  useDeleteProposal,
  useConvertProposalToInvoice,
  useSendProposal,
} from "./useProposals";
import type { UpdateProposalDTO } from "@addinvoice/schemas";
import type { ProposalDashboardResponse } from "@addinvoice/schemas";

export interface ProposalMutationCallbacks {
  onSuccess?: () => void;
}

export interface ProposalDeleteCallbacks {
  onSuccess?: () => void;
}

export function useProposalActions() {
  const router = useRouter();
  const updateMutation = useUpdateProposal();
  const deleteMutation = useDeleteProposal();
  const convertToInvoiceMutation = useConvertProposalToInvoice();
  const sendMutation = useSendProposal();

  const handleUpdate = (
    id: number,
    data: UpdateProposalDTO,
    callbacks?: ProposalMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: ProposalDeleteCallbacks,
  ) => {
    deleteMutation.mutate(
      { id, sequence },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  const handleConvertToInvoice = (proposal: { sequence: number }) => {
    convertToInvoiceMutation.mutate(
      { sequence: proposal.sequence },
      {
        onSuccess: (invoice) => {
          router.push(`/invoices/${invoice.sequence}`);
        },
      },
    );
  };

  const handleSend = (proposal: { sequence: number }) => {
    sendMutation.mutate({ sequence: proposal.sequence });
  };

  return {
    handleUpdate,
    handleDelete,
    handleConvertToInvoice,
    handleSend,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isConvertingToInvoice: convertToInvoiceMutation.isPending,
    isSending: sendMutation.isPending,
    isMutating:
      updateMutation.isPending ||
      convertToInvoiceMutation.isPending ||
      sendMutation.isPending,
  };
}
