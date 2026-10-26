/**
 * Patient Memberships Hook (React Query)
 *
 * Custom hooks for patients to view membership plans and their membership status.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMembershipPlans,
  getMembershipPlan,
  getMyMembership,
  getMyPlan,
  purchaseMembership,
} from "../../api/patient/memberships.api";
import { useAuthStore } from "../../store/auth.store";

/**
 * Hook for fetching all membership plans (public)
 */
export const useMembershipPlans = () => {
  return useQuery({
    queryKey: ["patient", "membership-plans"],
    queryFn: getMembershipPlans,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Hook for fetching single membership plan
 * @param {string} id - Plan ID
 */
export const useMembershipPlan = (id) => {
  return useQuery({
    queryKey: ["patient", "membership-plans", id],
    queryFn: () => getMembershipPlan(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching patient's current membership
 */
export const useMyMembership = () => {
  const patient = useAuthStore((state) => state.patient);

  return useQuery({
    queryKey: ["patient", "my-membership", patient?._id],
    queryFn: () => getMyMembership(patient?._id),
    enabled: !!patient?._id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Hook for fetching the patient's own membership with full plan details.
 * Uses patientProtect on the backend — no patientId needed in the URL.
 * staleTime: 0 ensures the API is always called on mount (visible in Network tab).
 */
export const useMyPlan = () => {
  const patient = useAuthStore((state) => state.patient);
  return useQuery({
    queryKey: ["patient", "my-plan"],
    queryFn: getMyPlan,
    enabled: !!patient,
    staleTime: 0,
  });
};

/**
 * Hook for purchasing membership
 */
export const usePurchaseMembership = () => {
  const queryClient = useQueryClient();
  const patient = useAuthStore((state) => state.patient);
  const updatePatient = useAuthStore((state) => state.updatePatient);

  return useMutation({
    mutationFn: purchaseMembership,
    onSuccess: (data) => {
      // Invalidate membership queries
      queryClient.invalidateQueries({ queryKey: ["patient", "my-membership"] });
      // Update patient in auth store with new membership
      if (data?.data?.patient) {
        updatePatient(data.data.patient);
      }
    },
  });
};

export default useMembershipPlans;
