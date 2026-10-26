/**
 * Admin Enquiries/Leads API
 *
 * API functions for lead management.
 * Backend endpoints: /api/enquiries
 */
import api from "../axios";

// ==================== LIST & GET ====================

export const getEnquiries = (params = {}) =>
  api.get("/enquiries", { params }).then((res) => res.data);

export const getEnquiry = (id) =>
  api.get(`/enquiries/${id}`).then((res) => res.data);

export const getEnquiryStats = (params = {}) =>
  api.get("/enquiries/stats", { params }).then((res) => res.data);

export const getTodayEnquiries = () =>
  api.get("/enquiries/today").then((res) => res.data);

export const getPendingFollowUps = () =>
  api.get("/enquiries/pending-follow-ups").then((res) => res.data);

// ==================== STATUS & ACTIONS ====================

export const updateEnquiryStatus = (id, data) =>
  api.patch(`/enquiries/${id}/status`, data).then((res) => res.data);

export const assignEnquiry = (id, data) =>
  api.patch(`/enquiries/${id}/assign`, data).then((res) => res.data);

export const scheduleFollowUp = (id, data) =>
  api.patch(`/enquiries/${id}/follow-up`, data).then((res) => res.data);

export const markAsSpam = (id, data) =>
  api.patch(`/enquiries/${id}/spam`, data).then((res) => res.data);

export const markConverted = (id, data) =>
  api.patch(`/enquiries/${id}/convert`, data).then((res) => res.data);

export const addNote = (id, data) =>
  api.post(`/enquiries/${id}/notes`, data).then((res) => res.data);

// ==================== UPDATE & DELETE ====================

export const updateEnquiry = (id, data) =>
  api.patch(`/enquiries/${id}`, data).then((res) => res.data);

export const deleteEnquiry = (id) =>
  api.delete(`/enquiries/${id}`).then((res) => res.data);
