/**
 * Admin Permissions Hooks (React Query)
 *
 * usePermissions() -- the current user's own role permissions, driving the
 * dynamic sidebar, route guards, and high-risk action-button gating.
 * usePermissionMatrix() / usePermissionMutations() -- admin-only, for the
 * Permission Manager matrix editor.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyPermissions, getAllPermissions, updatePermission } from "../../api/admin/permissions.api";
import { useAdminStore } from "../../store/admin.store";

export const usePermissions = () => {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ["admin", "permissions", "mine"],
    queryFn: getMyPermissions,
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const rows = query.data?.data?.permissions || [];

  /** true/false for a given module+action; defaults to false (fail closed) while loading/unknown. */
  const hasPermission = (module, action) => {
    const row = rows.find((r) => r.module === module);
    return !!row?.[action];
  };

  /** Modules this role can at least view -- drives the sidebar. */
  const viewableModules = rows.filter((r) => r.view).map((r) => r.module);

  return {
    permissions: rows,
    hasPermission,
    viewableModules,
    isLoading: query.isLoading,
    isReady: !query.isLoading && !!query.data,
  };
};

export const usePermissionMatrix = () => {
  return useQuery({
    queryKey: ["admin", "permissions", "matrix"],
    queryFn: getAllPermissions,
    staleTime: 30 * 1000,
  });
};

export const usePermissionMutations = () => {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: ({ role, module, data }) => updatePermission(role, module, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
    },
  });

  return {
    updatePermission: update.mutate,
    updatePermissionAsync: update.mutateAsync,
    isUpdating: update.isPending,
  };
};
