import api from "./../axios.js";

export const getPatients = (params) =>
  api.get("/patients", { params }).then((res) => res.data);

export const getPatientById = (id) =>
  api.get(`/patients/${id}`).then((res) => res.data);

export const createPatient = (data) =>
  api.post(`/patients/`, data).then((res) => res.data);

/**
 * Update patient profile
 * @param {string} id - Patient ID
 * @param {Object} data - { name, email, address, emergencyContact }
 */
export const updatePatientProfile = (id, data) =>
  api.patch(`/patients/${id}`, data).then((res) => res.data);
