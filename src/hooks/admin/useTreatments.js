/**
 * Admin Treatments Hook (React Query)
 *
 * Custom hook for managing treatment master data.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTreatmentMaster,
  getTreatmentType,
  createTreatmentType,
  updateTreatmentType,
  deleteTreatmentType,
  getTreatmentCategories,
} from "../../api/admin/treatments.api";

/**
 * Hook for fetching all treatment types
 */
export const useTreatmentMaster = () => {
  return useQuery({
    queryKey: ["admin", "treatment-master"],
    queryFn: getTreatmentMaster,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching single treatment type
 */
export const useTreatmentType = (id) => {
  return useQuery({
    queryKey: ["admin", "treatment-master", id],
    queryFn: () => getTreatmentType(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching treatment categories
 */
export const useTreatmentCategories = () => {
  return useQuery({
    queryKey: ["admin", "treatment-categories"],
    queryFn: getTreatmentCategories,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook for treatment mutations (create, update, delete)
 */
export const useTreatmentMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTreatmentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "treatment-master"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTreatmentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "treatment-master"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTreatmentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "treatment-master"] });
    },
  });

  return {
    createTreatment: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTreatment: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteTreatment: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

export default useTreatmentMaster;
