import api from "../axios";

const buildParams = (obj) => {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.append(k, v);
  });
  return params;
};

export const getExpenses = (filters = {}) =>
  api.get("/expenses", { params: buildParams(filters) }).then((r) => r.data);

export const getExpenseById = (id) =>
  api.get(`/expenses/${id}`).then((r) => r.data);

export const createExpense = (data) =>
  api.post("/expenses", data).then((r) => r.data);

export const updateExpense = (id, data) =>
  api.patch(`/expenses/${id}`, data).then((r) => r.data);

export const voidExpense = (id, reason) =>
  api.post(`/expenses/${id}/void`, { reason }).then((r) => r.data);

export const getExpenseStats = (filters = {}) =>
  api.get("/expenses/stats", { params: buildParams(filters) }).then((r) => r.data);

export const getProfitLoss = (filters = {}) =>
  api.get("/expenses/pnl", { params: buildParams(filters) }).then((r) => r.data);

export const getExpenseStaff = () =>
  api.get("/expenses/staff").then((r) => r.data);

export const permanentDeleteExpense = (id) =>
  api.delete(`/expenses/${id}/permanent`).then((r) => r.data);

export const exportExpensesCsv = (filters = {}) =>
  api.get("/expenses/export/csv", { params: buildParams(filters), responseType: "blob" }).then((r) => r.data);

export const exportExpensesPdf = (filters = {}) =>
  api.get("/expenses/export/pdf", { params: buildParams(filters), responseType: "blob" }).then((r) => r.data);
