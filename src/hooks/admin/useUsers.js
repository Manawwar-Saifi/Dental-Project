/**
 * Admin Users Hook (React Query)
 *
 * Custom hooks for staff/user management.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  permanentDeleteUser,
} from "../../api/admin/users.api";

/**
 * Hook for fetching users list (paginated)
 * @param {Object} params - { page, limit, search, isActive }
 */
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getUsers(params),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook for fetching single user
 * @param {string} id - User ID
 */
export const useUser = (id) => {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
};

/**
 * Hook for user mutations
 */
export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: invalidateUsers,
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: invalidateUsers,
  });

  const deactivate = useMutation({
    mutationFn: deactivateUser,
    onSuccess: invalidateUsers,
  });

  const reactivate = useMutation({
    mutationFn: reactivateUser,
    onSuccess: invalidateUsers,
  });

  const permanentDelete = useMutation({
    mutationFn: permanentDeleteUser,
    onSuccess: invalidateUsers,
  });

  return {
    createUser: create.mutate,
    createUserAsync: create.mutateAsync,
    isCreating: create.isPending,

    updateUser: update.mutate,
    isUpdating: update.isPending,

    deactivateUser: deactivate.mutate,
    isDeactivating: deactivate.isPending,

    reactivateUser: reactivate.mutate,
    isReactivating: reactivate.isPending,

    permanentDeleteUser: permanentDelete.mutate,
    isPermanentDeleting: permanentDelete.isPending,
  };
};

export default useUsers;
