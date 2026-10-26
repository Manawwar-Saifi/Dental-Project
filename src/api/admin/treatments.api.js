/**
 * Admin Treatments API
 *
 * API functions for treatment master management.
 */
import api from "../axios";

/**
 * Get all treatment types (master)
 */
export const getTreatmentMaster = async () => {
  const res = await api.get("/treatments/master");
  return res.data;
};

/**
 * Get single treatment type
 */
export const getTreatmentType = async (id) => {
  const res = await api.get(`/treatments/master/${id}`);
  return res.data;
};

/**
 * Create new treatment type
 */
export const createTreatmentType = async (data) => {
  const res = await api.post("/treatments/master", data);
  return res.data;
};

/**
 * Update treatment type
 */
export const updateTreatmentType = async (id, data) => {
  const res = await api.patch(`/treatments/master/${id}`, data);
  return res.data;
};

/**
 * Delete (soft) treatment type
 */
export const deleteTreatmentType = async (id) => {
  const res = await api.delete(`/treatments/master/${id}`);
  return res.data;
};

/**
 * Get treatment categories
 */
export const getTreatmentCategories = async () => {
  const res = await api.get("/treatments/categories");
  return res.data;
};
