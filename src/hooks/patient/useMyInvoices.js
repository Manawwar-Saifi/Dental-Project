/**
 * Patient Invoices Hook (React Query)
 *
 * Custom hook for patients to access their own invoices.
 */
import { useQuery } from "@tanstack/react-query";
import { getMyInvoices, getMyBillingSummary } from "../../api/patient/invoices.api";
import { useAuthStore } from "../../store/auth.store";

/**
 * Hook for fetching the logged-in patient's invoices
 * @param {Object} params - { page, limit, status }
 */
export const useMyInvoices = (params = {}) => {
  // Endpoint derives the patient from the auth token, so we only gate on being
  // logged in (no dependency on the store carrying `_id`).
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const patientId = useAuthStore((state) => state.patient?._id);

  return useQuery({
    queryKey: ["patient", "invoices", patientId, params],
    queryFn: () => getMyInvoices(params),
    enabled: !!isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Hook for fetching the logged-in patient's billing summary (outstanding balance).
 * Same invoice-based source as the admin Billing page, scoped to this patient.
 */
export const useMyBillingSummary = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const patientId = useAuthStore((state) => state.patient?._id);

  return useQuery({
    queryKey: ["patient", "billing-summary", patientId],
    queryFn: () => getMyBillingSummary(),
    enabled: !!isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export default useMyInvoices;
