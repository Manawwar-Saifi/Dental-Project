/**
 * Admin Billing Hook (React Query)
 *
 * Custom hooks for invoice management.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  addInvoiceItem,
  removeInvoiceItem,
  issueInvoice,
  cancelInvoice,
  voidInvoice,
  correctInvoice,
  recordInvoicePayment,
  getBillingStats,
  getOverdueInvoices,
  deleteInvoice,
} from "../../api/admin/billing.api";

/**
 * Hook for fetching invoices (paginated, filterable)
 * @param {Object} params - Query parameters
 */
export const useInvoices = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "billing", "invoices", params],
    queryFn: () => getInvoices(params),
    staleTime: 2 * 60 * 1000,
  });
};

// Alias for barrel export compatibility
export const useBilling = useInvoices;

/**
 * Hook for fetching single invoice
 * @param {string} id - Invoice ID
 */
export const useInvoice = (id) => {
  return useQuery({
    queryKey: ["admin", "billing", "invoices", id],
    queryFn: () => getInvoice(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook for billing statistics
 * @param {Object} params - { clinic, from, to }
 */
export const useBillingStats = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "billing", "stats", params],
    queryFn: () => getBillingStats(params),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook for overdue invoices
 */
export const useOverdueInvoices = () => {
  return useQuery({
    queryKey: ["admin", "billing", "overdue"],
    queryFn: () => getOverdueInvoices(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for all billing mutations
 */
export const useBillingMutations = () => {
  const queryClient = useQueryClient();

  const invalidateBilling = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
  };

  const create = useMutation({
    mutationFn: createInvoice,
    onSuccess: invalidateBilling,
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => updateInvoice(id, data),
    onSuccess: invalidateBilling,
  });

  const issue = useMutation({
    mutationFn: (id) => issueInvoice(id),
    onSuccess: invalidateBilling,
  });

  const cancel = useMutation({
    mutationFn: ({ id, data }) => cancelInvoice(id, data),
    onSuccess: invalidateBilling,
  });

  const voidInv = useMutation({
    mutationFn: ({ id, data }) => voidInvoice(id, data),
    onSuccess: invalidateBilling,
  });

  const correct = useMutation({
    mutationFn: ({ id, data }) => correctInvoice(id, data),
    onSuccess: invalidateBilling,
  });

  const recordPayment = useMutation({
    mutationFn: ({ id, data }) => recordInvoicePayment(id, data),
    onSuccess: invalidateBilling,
  });

  const addItem = useMutation({
    mutationFn: ({ id, itemData }) => addInvoiceItem(id, itemData),
    onSuccess: invalidateBilling,
  });

  const removeItem = useMutation({
    mutationFn: ({ id, itemId }) => removeInvoiceItem(id, itemId),
    onSuccess: invalidateBilling,
  });

  const remove = useMutation({
    mutationFn: (id) => deleteInvoice(id),
    onSuccess: invalidateBilling,
  });

  return {
    createInvoice: create.mutate,
    createInvoiceAsync: create.mutateAsync,
    isCreating: create.isPending,

    updateInvoice: update.mutate,
    isUpdating: update.isPending,

    issueInvoice: issue.mutate,
    isIssuing: issue.isPending,

    cancelInvoice: cancel.mutate,
    isCancelling: cancel.isPending,

    voidInvoice: voidInv.mutate,
    voidInvoiceAsync: voidInv.mutateAsync,
    isVoiding: voidInv.isPending,

    correctInvoice: correct.mutate,
    correctInvoiceAsync: correct.mutateAsync,
    isCorrecting: correct.isPending,

    recordPayment: recordPayment.mutate,
    isRecordingPayment: recordPayment.isPending,

    addItem: addItem.mutate,
    isAddingItem: addItem.isPending,

    removeItem: removeItem.mutate,
    isRemovingItem: removeItem.isPending,

    deleteInvoice: remove.mutate,
    isDeleting: remove.isPending,
  };
};

export default useInvoices;
