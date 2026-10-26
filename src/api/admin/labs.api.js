import api from "../axios";

/**
 * Admin Labs API — manage dental labs and their procedure price lists.
 */
export const getLabs = (params = {}) =>
  api.get("/labs", { params }).then((res) => res.data);

export const getLab = (id) =>
  api.get(`/labs/${id}`).then((res) => res.data);

export const createLab = (data) =>
  api.post("/labs", data).then((res) => res.data);

export const updateLab = (id, data) =>
  api.patch(`/labs/${id}`, data).then((res) => res.data);

export const deleteLab = (id) =>
  api.delete(`/labs/${id}`).then((res) => res.data);
