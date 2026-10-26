/**
 * Admin Clinics API
 *
 * API functions for clinic management.
 * Backend endpoints: /api/clinics
 */
import api from "../axios";

/**
 * Get all clinics
 * @param {Object} params - Query params (isActive)
 */
export const getClinics = async (params = {}) => {
  const res = await api.get("/clinics", { params });
  return {
    data: res.data?.data?.clinics || [],
  };
};

/**
 * Get single clinic by ID
 */
export const getClinic = async (id) => {
  const res = await api.get(`/clinics/${id}`);
  return res.data;
};

/**
 * Create new clinic
 */
export const createClinic = async (data) => {
  const res = await api.post("/clinics", data);
  return res.data;
};

/**
 * Update clinic
 */
export const updateClinic = async (id, data) => {
  const res = await api.patch(`/clinics/${id}`, data);
  return res.data;
};

/**
 * Delete (soft) clinic - deactivates the clinic
 */
export const deleteClinic = async (id) => {
  const res = await api.delete(`/clinics/${id}`);
  return res.data;
};

/**
 * Delete (permanent) clinic
 */
export const deleteClinicPermanent = async (id) => {
  const res = await api.delete(`/clinics/${id}/permanent`);
  return res.data;
};
