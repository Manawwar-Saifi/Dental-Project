/**
 * Admin Patients API
 *
 * API functions for managing patients.
 *
 * Endpoints:
 * - GET /patients - Get all patients with pagination
 * - GET /patients/:id - Get single patient
 * - POST /patients - Create patient
 * - PATCH /patients/:id - Update patient
 * - DELETE /patients/:id - Deactivate patient
 */
import api from "../axios";

/**
 * Get all patients with pagination and filters
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getPatients = (params = {}) =>
  api.get("/patients", { params }).then((res) => res.data);

/**
 * Get single patient by ID
 * @param {string} id - Patient ID
 * @returns {Promise}
 */
export const getPatient = (id) =>
  api.get(`/patients/${id}`).then((res) => res.data);

/**
 * Search patients by name or phone
 * @param {string} query - Search query
 * @returns {Promise}
 */
export const searchPatients = (query) =>
  api.get(`/patients/search?q=${query}`).then((res) => res.data);

/**
 * Create new patient
 * @param {Object} patientData - Patient data
 * @returns {Promise}
 */
export const createPatient = (patientData) =>
  api.post("/patients", patientData).then((res) => res.data);

/**
 * Update patient
 * @param {string} id - Patient ID
 * @param {Object} patientData - Updated data
 * @returns {Promise}
 */
export const updatePatient = (id, patientData) =>
  api.patch(`/patients/${id}`, patientData).then((res) => res.data);

/**
 * Delete (deactivate) patient
 * @param {string} id - Patient ID
 * @returns {Promise}
 */
export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res.data;
};

/**
 * Reactivate (un-deactivate) patient
 * @param {string} id - Patient ID
 * @returns {Promise}
 */
export const reactivatePatient = (id) =>
  api.patch(`/patients/${id}/reactivate`).then((res) => res.data);

/**
 * Set or reset a patient's password (admin). Pass { generate: true } to have the
 * server create a one-time temporary password (returned once), or { newPassword }
 * to set a specific one. Never returns or exposes the existing password.
 * @param {string} id - Patient ID
 * @param {Object} data - { newPassword } | { generate: true }
 * @returns {Promise}
 */
export const resetPatientPassword = (id, data) =>
  api.patch(`/patients/${id}/reset-password`, data).then((res) => res.data);

/**
 * Get patient profile with summary
 * @param {string} id - Patient ID
 * @returns {Promise}
 */
export const getPatientProfile = (id) =>
  api.get(`/patients/${id}/profile`).then((res) => res.data);

/**
 * Get patient's appointments
 * @param {string} id - Patient ID
 * @param {Object} params - Query params (status, page, limit)
 * @returns {Promise}
 */
export const getPatientAppointments = (id, params = {}) =>
  api.get(`/patients/${id}/appointments`, { params }).then((res) => res.data);

/**
 * Get patient's treatments
 * @param {string} id - Patient ID
 * @param {Object} params - Query params (status, page, limit)
 * @returns {Promise}
 */
export const getPatientTreatments = (id, params = {}) =>
  api.get(`/patients/${id}/treatments`, { params }).then((res) => res.data);

/**
 * Get patient's payments
 * @param {string} id - Patient ID
 * @param {Object} params - Query params (page, limit)
 * @returns {Promise}
 */
export const getPatientPayments = (id, params = {}) =>
  api.get(`/patients/${id}/payments`, { params }).then((res) => res.data);

/**
 * Get patient's reports
 * @param {string} id - Patient ID
 * @param {Object} params - Query params (category, page, limit)
 * @returns {Promise}
 */
export const getPatientReports = (id, params = {}) =>
  api.get(`/patients/${id}/reports`, { params }).then((res) => res.data);

/**
 * Get patient's invoices
 * @param {string} id - Patient ID
 * @param {Object} params - Query params (status, page, limit)
 * @returns {Promise}
 */
export const getPatientInvoices = (id, params = {}) =>
  api.get(`/patients/${id}/invoices`, { params }).then((res) => res.data);

/**
 * Get patient's tests
 * @param {string} id - Patient ID
 * @param {Object} params - Query params (status, page, limit)
 * @returns {Promise}
 */
export const getPatientTests = (id, params = {}) =>
  api.get(`/patients/${id}/tests`, { params }).then((res) => res.data);

export const getPatientActiveContext = (patientId) =>
  api.get(`/patients/${patientId}/active-context`).then((res) => res.data);

/**
 * Build the absolute export URL for the Patients list (CSV or PDF),
 * carrying over the same filters (search/isActive/membership) currently
 * applied on screen. Used with downloadFile() rather than a direct
 * axios.get, since the response is a raw file stream, not JSON.
 * @param {"csv"|"pdf"} format
 * @param {Object} params - Active filters (search, isActive, membership, ...)
 * @returns {string}
 */
export const getPatientsExportUrl = (format, params = {}) => {
  const query = new URLSearchParams();
  query.set("format", format);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const baseURL = api.defaults.baseURL || "";
  return `${baseURL}/patients/export?${query.toString()}`;
};
