/**
 * Admin Appointments API
 *
 * API functions for managing appointments.
 */
import api from "../axios";

/**
 * Get all appointments with pagination and filters
 */
export const getAppointments = (params = {}) =>
  api.get("/appointments", { params }).then((res) => res.data);

/**
 * Get single appointment by ID
 */
export const getAppointment = (id) =>
  api.get(`/appointments/${id}`).then((res) => res.data);

/**
 * Get today's appointments
 */
export const getTodayAppointments = () =>
  api.get("/appointments/today").then((res) => res.data);

/**
 * Get available slots for a date
 */
export const getAvailableSlots = (clinicId, date) =>
  api
    .get(`/appointments/available-slots`, { params: { clinic: clinicId, date } })
    .then((res) => res.data);

/**
 * Create new appointment
 */
export const createAppointment = (data) =>
  api.post("/appointments", data).then((res) => res.data);

/**
 * Update appointment
 */
export const updateAppointment = (id, data) =>
  api.patch(`/appointments/${id}`, data).then((res) => res.data);

/**
 * Update appointment status
 */
export const updateAppointmentStatus = (id, status, reason) =>
  api.patch(`/appointments/${id}/status`, { status, reason }).then((res) => res.data);

/**
 * Cancel appointment
 */
export const cancelAppointment = (id, reason) =>
  api.post(`/appointments/${id}/cancel`, { reason }).then((res) => res.data);

/**
 * Delete appointment permanently
 */
export const deleteAppointment = (id) =>
  api.delete(`/appointments/${id}`).then((res) => res.data);

/**
 * Reschedule appointment
 */
export const rescheduleAppointment = (id, data) =>
  api.post(`/appointments/${id}/reschedule`, data).then((res) => res.data);

/**
 * Reopen a closed treatment plan
 */
export const reopenTreatment = (id, reason) =>
  api.post(`/appointments/${id}/reopen-treatment`, { reason }).then((res) => res.data);

/**
 * Edit a treatment plan's name/line items/discount -- available throughout
 * the active lifecycle (locked once treatmentStatus is set, enforced
 * server-side too).
 */
export const updateTreatmentItems = (id, data) =>
  api.patch(`/appointments/${id}/treatment-items`, data).then((res) => res.data);