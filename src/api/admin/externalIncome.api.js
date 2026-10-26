import api from "../axios";

const buildParams = (obj) => {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.append(k, v);
  });
  return params;
};

export const getExternalIncomes = (params = {}) =>
  api.get("/external-income", { params: buildParams(params) }).then((r) => r.data);

export const createExternalIncome = (data) =>
  api.post("/external-income", data).then((r) => r.data);

export const updateExternalIncome = (id, data) =>
  api.put(`/external-income/${id}`, data).then((r) => r.data);

export const voidExternalIncome = (id, data) =>
  api.post(`/external-income/${id}/void`, data).then((r) => r.data);

export const getExternalIncomeStats = (params = {}) =>
  api.get("/external-income/stats", { params: buildParams(params) }).then((r) => r.data);

export const getExternalIncomeStaff = () =>
  api.get("/external-income/staff").then((r) => r.data);
