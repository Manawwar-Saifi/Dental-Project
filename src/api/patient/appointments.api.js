/**
 * Patient Appointments API
 *
 * API functions for patients to manage their appointments.
 */
import api from "../axios";

/**
 * Get my appointments (by phone)
 * @param {string} phone - Patient's phone number
 * @returns {Promise}
 */
export const getMyAppointments = (phone) =>
  api.get(`/appointments/${phone}`).then((res) => res.data);

/**
 * Get available time slots for a clinic on a date (public endpoint).
 * @param {string} clinicId
 * @param {string} date - yyyy-mm-dd
 * @returns {Promise}
 */
export const getAvailableSlots = (clinicId, date, bookingType) =>
  api
    .get(`/appointments/available-slots`, {
      params: { clinic: clinicId, date, ...(bookingType ? { bookingType } : {}) },
    })
    .then((res) => res.data);

/**
 * Book a new appointment
 * @param {Object} data - Appointment data (patient info, clinic, date, time, reason)
 * @returns {Promise}
 */
export const bookAppointment = (data) =>
  api.post("/appointments", data).then((res) => res.data);

/**
 * Cancel an appointment
 * @param {string} id - Appointment ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise}
 */
export const cancelAppointment = (id, reason) =>
  api.post(`/appointments/${id}/cancel`, { reason }).then((res) => res.data);

/**
 * Reschedule an appointment
 * @param {string} id - Appointment ID
 * @param {Object} data - New date and time
 * @returns {Promise}
 */
export const rescheduleAppointment = (id, data) =>
  api.post(`/appointments/${id}/reschedule`, data).then((res) => res.data);

/**
 * Get all clinics (for clinic selection)
 * @returns {Promise}
 */
export const getClinics = () =>
  api.get("/clinics").then((res) => res.data);

/**
 * Get fee settings (OPD fees)
 * @returns {Promise}
 */
export const getFeeSettings = () =>
  api.get("/settings/fees").then((res) => res.data);

/**
 * Create Razorpay order for appointment payment
 * @param {Object} data - { amount, patient, clinic, type }
 * @returns {Promise}
 */
export const createPaymentOrder = (data) =>
  api.post("/payments/razorpay/create-order", data).then((res) => res.data);

/**
 * Verify Razorpay payment
 * @param {Object} data - { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId }
 * @returns {Promise}
 */
export const verifyPayment = (data) =>
  api.post("/payments/razorpay/verify", data).then((res) => res.data);

/**
 * Book appointment after payment verification
 * @param {Object} data - Appointment data with paymentId
 * @returns {Promise}
 */
export const bookAppointmentWithPayment = (data) =>
  api.post("/appointments/book-with-payment", data).then((res) => res.data);

/**
 * Step 1 of the pending-hold booking flow.
 * Validates the slot, creates a PENDING appointment (invisible everywhere),
 * and returns a Razorpay order for the patient to complete payment.
 * @param {Object} data - { name, phone, email, clinic, date, timeSlot, reason, type, bookingType, captchaToken }
 * @returns {Promise<{ pendingAppointmentId, paymentId, order, key_id }>}
 */
export const initiateBooking = (data) =>
  api.post("/appointments/initiate-booking", data).then((res) => res.data);

/**
 * Step 2 of the pending-hold booking flow.
 * Confirms the pending appointment after Razorpay payment succeeds.
 * Assigns appointment number, generates invoice, sends notifications.
 * @param {Object} data - { pendingAppointmentId, paymentId }
 * @returns {Promise}
 */
export const confirmBooking = (data) =>
  api.post("/appointments/confirm-booking", data).then((res) => res.data);

/**
 * Book a free OPD appointment for a logged-in patient with an active membership.
 * Requires patient JWT (patientProtect). Server re-verifies membership server-side.
 * @param {Object} data - { clinic, date, timeSlot, reason, type, bookingType }
 * @returns {Promise}
 */
export const bookAppointmentFree = (data) =>
  api.post("/appointments/book-free", data).then((res) => res.data);

/**
 * Book an OPD appointment WITHOUT collecting payment online -- fee stays
 * unpaid, patient pays at the clinic. Fallback path used when online
 * payments are disabled site-wide (see utils/paymentFlags.js). Reuses the
 * same public POST /appointments endpoint the admin panel's walk-in booking
 * uses, just with opdFeePaid left false (its default).
 * @param {Object} data - { name, phone, clinic, date, timeSlot, reason, type, appointmentType }
 * @returns {Promise}
 */
export const bookAppointmentPayAtClinic = (data) =>
  api.post("/appointments", data).then((res) => res.data);
