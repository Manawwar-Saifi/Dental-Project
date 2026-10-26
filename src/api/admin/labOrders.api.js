import api from "../axios";

/**
 * Admin Lab Orders API.
 */
export const getLabOrders = (params = {}) =>
  api.get("/lab-orders", { params }).then((res) => res.data);

export const getLabOrderStats = (params = {}) =>
  api.get("/lab-orders/stats", { params }).then((res) => res.data);

export const getLabOrder = (id) =>
  api.get(`/lab-orders/${id}`).then((res) => res.data);

export const createLabOrder = (data) =>
  api.post("/lab-orders", data).then((res) => res.data);

export const updateLabOrder = (id, data) =>
  api.patch(`/lab-orders/${id}`, data).then((res) => res.data);

export const recordLabOrderPayment = (id, data) =>
  api.post(`/lab-orders/${id}/payment`, data).then((res) => res.data);

export const archiveLabOrder = (id) =>
  api.patch(`/lab-orders/${id}/archive`).then((res) => res.data);

export const unarchiveLabOrder = (id) =>
  api.patch(`/lab-orders/${id}/unarchive`).then((res) => res.data);
