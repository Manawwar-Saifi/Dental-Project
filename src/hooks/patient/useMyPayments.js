/**
 * Patient Payments Hook (React Query)
 *
 * Custom hook for patients to access their payment history.
 */
import { useQuery } from "@tanstack/react-query";
import { getMyPayments } from "../../api/patient/payments.api";
import { getMyPaymentHistory } from "../../api/patient/invoices.api";
import { useAuthStore } from "../../store/auth.store";

/**
 * Hook for fetching patient's payments
 * @param {Object} params - { page, limit }
 */
export const useMyPayments = (params = {}) => {
  const patient = useAuthStore((state) => state.patient);

  return useQuery({
    queryKey: ["patient", "payments", patient?._id, params],
    queryFn: () => getMyPayments(patient?._id, params),
    enabled: !!patient?._id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export default useMyPayments;

/**
 * Hook for fetching patient's payment history derived from invoices.amountPaid.
 * Uses token-derived endpoint — no patient ID param needed (IDOR-safe).
 */
export const useMyPaymentHistory = () => {
  const patient = useAuthStore((state) => state.patient);

  return useQuery({
    queryKey: ["patient", "payment-history", patient?._id],
    queryFn: getMyPaymentHistory,
    enabled: !!patient?._id,
    staleTime: 30 * 1000,
    refetchOnMount: "always",
  });
};
