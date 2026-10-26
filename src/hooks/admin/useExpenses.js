import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  voidExpense,
  getExpenseStats,
  getProfitLoss,
  getExpenseStaff,
  permanentDeleteExpense,
} from "../../api/admin/expenses.api";

export const useExpenses = (filters = {}) =>
  useQuery({
    queryKey: ["expenses", filters],
    queryFn: () => getExpenses(filters),
    staleTime: 30 * 1000,
  });

export const useExpenseById = (id) =>
  useQuery({
    queryKey: ["expense", id],
    queryFn: () => getExpenseById(id),
    enabled: !!id,
  });

export const useExpenseStats = (filters = {}) =>
  useQuery({
    queryKey: ["expense-stats", filters],
    queryFn: () => getExpenseStats(filters),
    staleTime: 30 * 1000,
  });

export const useProfitLoss = (filters = {}) =>
  useQuery({
    queryKey: ["pnl", filters],
    queryFn: () => getProfitLoss(filters),
    staleTime: 30 * 1000,
  });

export const useExpenseStaff = () =>
  useQuery({
    queryKey: ["expense-staff"],
    queryFn: getExpenseStaff,
    staleTime: 5 * 60 * 1000,
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-stats"] });
      qc.invalidateQueries({ queryKey: ["pnl"] });
    },
  });
};

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-stats"] });
      qc.invalidateQueries({ queryKey: ["pnl"] });
    },
  });
};

export const useVoidExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => voidExpense(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-stats"] });
      qc.invalidateQueries({ queryKey: ["pnl"] });
    },
  });
};

export const usePermanentDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => permanentDeleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-stats"] });
      qc.invalidateQueries({ queryKey: ["pnl"] });
    },
  });
};
