/**
 * Patient Reports API
 *
 * API functions for patient to access their reports.
 */
import api from "../axios";

/**
 * Get my reports (for logged-in patient)
 * @param {string} patientId - Patient ID
 * @param {Object} params - Query parameters (category)
 * @returns {Promise}
 */
export const getMyReports = (patientId, params = {}) =>
  api.get(`/reports/patient/${patientId}`, { params }).then((res) => res.data);

/**
 * Get single report
 * @param {string} id - Report ID
 * @returns {Promise}
 */
export const getReport = (id) =>
  api.get(`/reports/${id}`).then((res) => res.data);

/**
 * Download report (get download URL). `fileIndex` selects which file when a
 * report has multiple (files[] array) -- defaults to the first.
 * @param {string} id - Report ID
 * @param {number} [fileIndex]
 * @returns {Promise}
 */
export const downloadReport = (id, fileIndex) =>
  api
    .get(`/reports/${id}/download`, { params: fileIndex != null ? { fileIndex } : {} })
    .then((res) => res.data);
