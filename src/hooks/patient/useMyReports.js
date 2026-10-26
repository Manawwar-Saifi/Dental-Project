/**
 * Patient Reports Hook (React Query)
 *
 * Custom hook for patients to access their reports.
 */
import { useQuery } from "@tanstack/react-query";
import { getMyReports, getReport } from "../../api/patient/reports.api";
import { useAuthStore } from "../../store/auth.store";

/**
 * Hook for fetching patient's reports
 * @param {Object} params - Query parameters (category)
 */
export const useMyReports = (params = {}) => {
  const patient = useAuthStore((state) => state.patient);

  return useQuery({
    queryKey: ["patient", "reports", patient?._id, params],
    queryFn: () => getMyReports(patient?._id, params),
    enabled: !!patient?._id,
    staleTime: 30 * 1000, // 30 seconds - fresher data
    refetchInterval: 60 * 1000, // Auto-refetch every 60 seconds for near real-time updates
  });
};

/**
 * Hook for fetching single report
 * @param {string} id - Report ID
 */
export const useReport = (id) => {
  return useQuery({
    queryKey: ["patient", "reports", id],
    queryFn: () => getReport(id),
    enabled: !!id,
  });
};

export default useMyReports;
