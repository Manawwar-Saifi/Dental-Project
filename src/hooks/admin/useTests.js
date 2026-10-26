/**
 * Admin Tests Hook (React Query)
 *
 * Custom hook for managing diagnostic test master data.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTestMaster,
  getTestType,
  createTestType,
  updateTestType,
  deleteTestType,
  getTestCategories,
} from "../../api/admin/tests.api";

/**
 * Hook for fetching all test types
 */
export const useTestMaster = () => {
  return useQuery({
    queryKey: ["admin", "test-master"],
    queryFn: getTestMaster,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching single test type
 */
export const useTestType = (id) => {
  return useQuery({
    queryKey: ["admin", "test-master", id],
    queryFn: () => getTestType(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching test categories
 */
export const useTestCategories = () => {
  return useQuery({
    queryKey: ["admin", "test-categories"],
    queryFn: getTestCategories,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook for test mutations (create, update, delete)
 */
export const useTestMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTestType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "test-master"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTestType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "test-master"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTestType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "test-master"] });
    },
  });

  return {
    createTest: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTest: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteTest: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

export default useTestMaster;
