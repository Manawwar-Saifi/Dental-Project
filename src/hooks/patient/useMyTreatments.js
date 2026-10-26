/**
 * Patient Treatments Hook (React Query)
 *
 * Custom hook for patients to access their treatment history.
 */
import { useQuery } from "@tanstack/react-query";
import { getMyTreatments } from "../../api/patient/treatments.api";
import { useAuthStore } from "../../store/auth.store";

/**
 * Hook for fetching patient's treatments
 * @param {Object} params - { status, page, limit }
 */
export const useMyTreatments = (params = {}) => {
  const patient = useAuthStore((state) => state.patient);

  return useQuery({
    queryKey: ["patient", "treatments", patient?._id, params],
    queryFn: () => getMyTreatments(patient?._id, params),
    enabled: !!patient?._id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export default useMyTreatments;
