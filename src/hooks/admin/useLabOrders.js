import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLabOrders,
  getLabOrderStats,
  getLabOrder,
  createLabOrder,
  updateLabOrder,
  recordLabOrderPayment,
  archiveLabOrder,
  unarchiveLabOrder,
} from "../../api/admin/labOrders.api";

export const useLabOrders = (params = {}) =>
  useQuery({
    queryKey: ["admin", "lab-orders", params],
    queryFn: () => getLabOrders(params),
    staleTime: 60 * 1000,
  });

export const useLabOrderStats = (params = {}) =>
  useQuery({
    queryKey: ["admin", "lab-orders", "stats", params],
    queryFn: () => getLabOrderStats(params),
    staleTime: 60 * 1000,
  });

export const useLabOrder = (id) =>
  useQuery({
    queryKey: ["admin", "lab-orders", id],
    queryFn: () => getLabOrder(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useLabOrderMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "lab-orders"] });

  const create = useMutation({ mutationFn: createLabOrder, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, data }) => updateLabOrder(id, data),
    onSuccess: invalidate,
  });
  const payment = useMutation({
    mutationFn: ({ id, data }) => recordLabOrderPayment(id, data),
    onSuccess: invalidate,
  });
  const archive = useMutation({ mutationFn: archiveLabOrder, onSuccess: invalidate });
  const unarchive = useMutation({ mutationFn: unarchiveLabOrder, onSuccess: invalidate });

  return {
    createLabOrder: create.mutate,
    createLabOrderAsync: create.mutateAsync,
    isCreating: create.isPending,
    updateLabOrder: update.mutate,
    isUpdating: update.isPending,
    recordPayment: payment.mutate,
    isRecordingPayment: payment.isPending,
    archiveLabOrder: archive.mutate,
    isArchiving: archive.isPending,
    unarchiveLabOrder: unarchive.mutate,
    isUnarchiving: unarchive.isPending,
  };
};
