import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLabs,
  getLab,
  createLab,
  updateLab,
  deleteLab,
} from "../../api/admin/labs.api";

export const useLabs = (params = {}) =>
  useQuery({
    queryKey: ["admin", "labs", params],
    queryFn: () => getLabs(params),
    staleTime: 2 * 60 * 1000,
  });

export const useLab = (id) =>
  useQuery({
    queryKey: ["admin", "labs", id],
    queryFn: () => getLab(id),
    enabled: !!id,
  });

export const useLabMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "labs"] });

  const create = useMutation({ mutationFn: createLab, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, data }) => updateLab(id, data),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteLab, onSuccess: invalidate });

  return {
    createLab: create.mutate,
    createLabAsync: create.mutateAsync,
    isCreating: create.isPending,
    updateLab: update.mutate,
    updateLabAsync: update.mutateAsync,
    isUpdating: update.isPending,
    deleteLab: remove.mutate,
    isDeleting: remove.isPending,
  };
};
