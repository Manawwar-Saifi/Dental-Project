/**
 * Admin Payments Hook (React Query)
 *
 * Custom hook for managing payments data.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPayments,
  getPayment,
  createPayment,
  processRefund,
  getPaymentStats,
  getPaymentSummaryStats,
  deletePayment,
  recordAdminPayment,
  collectPayment,
  reverseAdminPayment,
  confirmManualRefund as confirmManualRefundApi,
} from "../../api/admin/payments.api";
import { getPatientUnpaidInvoices } from "../../api/admin/billing.api";

/**
 * Hook for fetching payments list
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 */
export const usePayments = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["admin", "payments", params],
    queryFn: () => getPayments(params),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching single payment
 * @param {string} id - Payment ID
 */
export const usePayment = (id) => {
  return useQuery({
    queryKey: ["admin", "payments", id],
    queryFn: () => getPayment(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching payment statistics
 * @param {Object} params - Query params (clinic, from, to)
 */
export const usePaymentStats = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "payments", "stats", params],
    queryFn: () => getPaymentStats(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for the Payment History page's 4 summary cards (Total Collected/
 * Refunded/Net/Transactions) -- computed from the Payment collection only.
 * @param {Object} params - Query params (from, to)
 */
export const usePaymentSummaryStats = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "payments", "summary-stats", params],
    queryFn: () => getPaymentSummaryStats(params),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook for payment mutations (create, refund)
 */
export const usePaymentMutations = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const refund = useMutation({
    mutationFn: ({ id, data }) => processRefund(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const confirmManual = useMutation({
    mutationFn: ({ id, data }) => confirmManualRefundApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  return {
    createPayment: create.mutate,
    createPaymentAsync: create.mutateAsync,
    isCreating: create.isPending,
    createError: create.error,

    processRefund: refund.mutate,
    isRefunding: refund.isPending,
    refundError: refund.error,

    deletePayment: remove.mutate,
    isDeleting: remove.isPending,

    confirmManualRefund: confirmManual.mutate,
    isConfirmingManual: confirmManual.isPending,
  };
};

/**
 * Hook for fetching a patient's unpaid/partial invoices (for collect-payment flow)
 * @param {string} patientId - Patient ID (query disabled when falsy)
 */
export const usePatientUnpaidInvoices = (patientId) => {
  return useQuery({
    queryKey: ["admin", "unpaid-invoices", patientId],
    queryFn: () => getPatientUnpaidInvoices(patientId),
    enabled: !!patientId,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook for admin-recorded payment mutations (record cash/UPI/card + reversal + per-invoice collect)
 */
export const useAdminPaymentMutations = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "unpaid-invoices"] });
    queryClient.invalidateQueries({ queryKey: ["patient"] });
  };

  const record = useMutation({
    mutationFn: recordAdminPayment,
    onSuccess: invalidateAll,
  });

  const collect = useMutation({
    mutationFn: collectPayment,
    onSuccess: invalidateAll,
  });

  const reverse = useMutation({
    mutationFn: reverseAdminPayment,
    onSuccess: invalidateAll,
  });

  return {
    recordPayment: record.mutateAsync,
    isRecording: record.isPending,
    recordError: record.error,

    collectPayment: collect.mutateAsync,
    isCollecting: collect.isPending,
    collectError: collect.error,

    reversePayment: reverse.mutateAsync,
    isReversing: reverse.isPending,
    reverseError: reverse.error,
  };
};

export default usePayments;
