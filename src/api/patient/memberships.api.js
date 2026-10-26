/**
 * Patient Memberships API
 *
 * API functions for patients to view membership plans.
 */
import api from "../axios";

/**
 * Get all available membership plans (public)
 * @returns {Promise}
 */
export const getMembershipPlans = () =>
  api.get("/memberships/plans").then((res) => res.data);

/**
 * Get single membership plan by ID
 * @param {string} id - Plan ID
 * @returns {Promise}
 */
export const getMembershipPlan = (id) =>
  api.get(`/memberships/plans/${id}`).then((res) => res.data);

/**
 * Get patient's current membership
 * @param {string} patientId - Patient ID
 * @returns {Promise}
 */
export const getMyMembership = (patientId) =>
  api.get(`/patients/${patientId}/membership`).then((res) => res.data);

/**
 * Get own current membership with full plan details (uses patient auth token, no patientId needed)
 * @returns {Promise}
 */
export const getMyPlan = () =>
  api.get("/memberships/my-plan").then((res) => res.data);

/**
 * Create Razorpay order for membership payment
 * @param {Object} data - { amount, clinic, type }
 * @returns {Promise}
 */
export const createMembershipPaymentOrder = (data) =>
  api.post("/payments/razorpay/create-order", data).then((res) => res.data);

/**
 * Verify Razorpay payment
 * @param {Object} data - { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId }
 * @returns {Promise}
 */
export const verifyMembershipPayment = (data) =>
  api.post("/payments/razorpay/verify", data).then((res) => res.data);

/**
 * Purchase membership after payment verification
 * @param {Object} data - { planId, paymentId }
 * @returns {Promise}
 */
export const purchaseMembership = (data) =>
  api.post("/memberships/purchase", data).then((res) => res.data);
