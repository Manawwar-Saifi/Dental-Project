/**
 * Admin Clinics Hook (React Query)
 *
 * Custom hook for managing clinic data.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClinics,
  getClinic,
  createClinic,
  updateClinic,
  deleteClinic,
} from "../../api/admin/clinics.api";

/**
 * Hook for fetching all clinics
 */
export const useClinics = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "clinics", params],
    queryFn: () => getClinics(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching single clinic
 */
export const useClinic = (id) => {
  return useQuery({
    queryKey: ["admin", "clinic", id],
    queryFn: () => getClinic(id),
    enabled: !!id,
  });
};

/**
 * Hook for clinic mutations (create, update, delete)
 */
export const useClinicMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createClinic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateClinic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClinic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] });
    },
  });

  return {
    createClinic: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateClinic: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteClinic: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

export default useClinics;
