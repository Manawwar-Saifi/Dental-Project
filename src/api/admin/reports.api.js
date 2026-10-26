/**
 * Admin Reports API
 *
 * API functions for managing reports.
 *
 * Endpoints:
 * - GET /reports - Get all reports with pagination
 * - GET /reports/:id - Get single report
 * - POST /reports - Upload new report (multipart form data)
 * - PUT /reports/:id - Update report
 * - DELETE /reports/:id - Delete report
 */
import api from "../axios";

/**
 * Get all reports with pagination and filters
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getReports = (params = {}) =>
  api.get("/reports", { params }).then((res) => res.data);

/**
 * Get single report by ID
 * @param {string} id - Report ID
 * @returns {Promise}
 */
export const getReport = (id) =>
  api.get(`/reports/${id}`).then((res) => res.data);

/**
 * Upload new report with file
 * Create a report from ALREADY-UPLOADED files.
 *
 * The browser uploads each file straight to Cloudinary first (see
 * utils/directUpload.js) and this call carries only the resulting metadata --
 * a few hundred bytes. Files no longer stream through our API, which runs as a
 * Vercel serverless function with a hard ~4.5MB request body limit that
 * rejected every phone-camera photo and applied cumulatively across all files
 * in one request.
 *
 * Still accepts a FormData (legacy multipart path) so any older caller keeps
 * working; the backend supports both shapes.
 *
 * @param {Object|FormData} payload - { files: [...], patient, title, ... }
 * @returns {Promise}
 */
export const uploadReport = (payload) =>
  api
    .post(
      "/reports",
      payload,
      payload instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined
    )
    .then((res) => res.data);

/**
 * Update report
 * @param {string} id - Report ID
 * @param {Object} data - Report data to update
 * @returns {Promise}
 */
export const updateReport = (id, data) =>
  api.patch(`/reports/${id}`, data).then((res) => res.data);

/**
 * Delete report
 * @param {string} id - Report ID
 * @returns {Promise}
 */
export const deleteReport = (id) =>
  api.delete(`/reports/${id}?hardDelete=true`).then((res) => res.data);

/**
 * Replace report file (deletes old, uploads new)
 * @param {string} id - Report ID
 * @param {FormData} formData - Form data with new file
 * @returns {Promise}
 */
/**
 * Get signed download URL for report
 * @param {string} id - Report ID
 * @returns {Promise}
 */
export const downloadReport = (id) =>
  api.get(`/reports/${id}/download`).then((res) => res.data);

export const replaceReportFile = (id, formData) =>
  api
    .put(`/reports/${id}/file`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);