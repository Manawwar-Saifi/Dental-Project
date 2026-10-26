import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExternalIncomes,
  createExternalIncome,
  updateExternalIncome,
  voidExternalIncome,
  getExternalIncomeStats,
  getExternalIncomeStaff,
} from "../../api/admin/externalIncome.api";

export const useExternalIncomes = (params = {}) =>
  useQuery({
    queryKey: ["external-income", params],
    queryFn: () => getExternalIncomes(params),
    staleTime: 30 * 1000,
  });

export const useExternalIncomeStats = (params = {}) =>
  useQuery({
    queryKey: ["external-income-stats", params],
    queryFn: () => getExternalIncomeStats(params),
    staleTime: 30 * 1000,
  });

export const useExternalIncomeStaff = () =>
  useQuery({
    queryKey: ["external-income-staff"],
    queryFn: getExternalIncomeStaff,
    staleTime: 5 * 60 * 1000,
  });

/** Invalidate all external income queries + shared revenue caches. */
const invalidateAll = (qc) => {
  qc.invalidateQueries({ queryKey: ["external-income"] });
  qc.invalidateQueries({ queryKey: ["external-income-stats"] });
  // Shared revenue figures — P&L and Payment History summary stats
  qc.invalidateQueries({ queryKey: ["pnl"] });
  qc.invalidateQueries({ queryKey: ["admin", "payments", "summary-stats"] });
};

export const useCreateExternalIncome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExternalIncome,
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateExternalIncome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateExternalIncome(id, data),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useVoidExternalIncome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, voidReason }) => voidExternalIncome(id, { voidReason }),
    onSuccess: () => invalidateAll(qc),
  });
};
