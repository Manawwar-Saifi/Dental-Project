/**
 * Patient Payments API
 *
 * API functions for patients to view their payment history.
 */
import api from "../axios";

/**
 * Get patient's payments (paginated)
 * @param {string} patientId - Patient ID
 * @param {Object} params - { page, limit }
 */
export const getMyPayments = (patientId, params = {}) =>
  api.get(`/patients/${patientId}/payments`, { params }).then((res) => res.data);

export const createPendingOrder = (amount, invoiceId) => {
  const body = { amount };
  if (invoiceId) body.invoiceId = invoiceId;
  return api.post("/payments/patient/create-pending-order", body).then((res) => res.data);
};

export const verifyPendingPayment = (data) =>
  api.post("/payments/patient/verify-pending-payment", data).then((res) => res.data);
