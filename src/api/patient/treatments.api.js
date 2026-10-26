/**
 * Patient Treatments API
 *
 * API functions for patients to view their treatment history.
 */
import api from "../axios";

/**
 * Get patient's treatments (paginated)
 * @param {string} patientId - Patient ID
 * @param {Object} params - { status, page, limit }
 */
export const getMyTreatments = (patientId, params = {}) =>
  api.get(`/patients/${patientId}/treatments`, { params }).then((res) => res.data);

/**
 * Get the public treatment catalog (the same list the public site uses).
 * @returns {Promise} { data: { treatmentTypes: [...] } }
 */
export const getTreatmentCatalog = () =>
  api.get("/treatments/master", { params: { active: "true", sort: "name" } }).then((res) => res.data);

/**
 * Create a Razorpay order for a treatment payment.
 * The server resolves the price + membership discount; client amount is ignored.
 * @param {Object} data - { treatmentId, type: "treatment" }
 */
export const createTreatmentPaymentOrder = (data) =>
  api.post("/payments/razorpay/create-order", data).then((res) => res.data);

/**
 * Verify a Razorpay treatment payment.
 * @param {Object} data - { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId }
 */
export const verifyTreatmentPayment = (data) =>
  api.post("/payments/razorpay/verify", data).then((res) => res.data);

/**
 * Book a treatment to pay at the clinic (creates a pending payment record).
 * @param {Object} data - { treatmentId }
 */
export const payTreatmentAtClinic = (data) =>
  api.post("/payments/pay-at-clinic", data).then((res) => res.data);
