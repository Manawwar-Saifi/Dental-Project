/**
 * Admin Patients Hook (React Query)
 *
 * Custom hook for managing patients data.
 *
 * Features:
 * - Fetch patients with pagination
 * - Search patients
 * - Create, update, delete patients
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  reactivatePatient,
  getPatientActiveContext,
} from "../../api/admin/patients.api";

/**
 * Hook for fetching patients list
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 */
export const usePatients = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "patients", params],
    queryFn: () => getPatients(params),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook for fetching single patient
 * @param {string} id - Patient ID
 */
export const usePatient = (id) => {
  return useQuery({
    queryKey: ["admin", "patients", id],
    queryFn: () => getPatient(id),
    enabled: !!id,
  });
};

/**
 * Hook for patient mutations (create, update, delete)
 */
export const usePatientMutations = () => {
  const queryClient = useQueryClient();

  const invalidatePatients = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "patients"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => invalidatePatients(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePatient(id, data),
    onSuccess: () => invalidatePatients(),
    onSettled: () => invalidatePatients(),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => invalidatePatients(),
    onSettled: () => invalidatePatients(),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivatePatient,
    onSuccess: () => invalidatePatients(),
    onSettled: () => invalidatePatients(),
  });

  return {
    createPatient: createMutation.mutate,
    createPatientAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePatient: updateMutation.mutate,
    updatePatientAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deletePatient: deleteMutation.mutate,
    deletePatientAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    reactivatePatient: reactivateMutation.mutate,
    reactivatePatientAsync: reactivateMutation.mutateAsync,
    isReactivating: reactivateMutation.isPending,
  };
};

export const usePatientActiveContext = (patientId, options = {}) =>
  useQuery({
    queryKey: ["admin", "patients", patientId, "active-context"],
    queryFn: () => getPatientActiveContext(patientId),
    enabled: !!patientId,
    staleTime: 30_000,
    ...options,
  });

export default usePatients;
