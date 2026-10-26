/**
 * Admin Memberships API
 *
 * API functions for managing membership plans.
 *
 * Endpoints:
 * - GET /memberships/plans - Get all membership plans
 * - GET /memberships/plans/:id - Get single membership plan
 * - POST /memberships/plans - Create membership plan
 * - PATCH /memberships/plans/:id - Update membership plan
 * - DELETE /memberships/plans/:id - Deactivate membership plan
 * - POST /memberships/plans/seed - Seed default plans
 * - GET /memberships/members - Get active members
 * - GET /memberships/stats - Get membership statistics
 */
import api from "../axios";

// ==================== MEMBERSHIP PLANS ====================

/**
 * Get all membership plans
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getMembershipPlans = (params = {}) =>
  api.get("/memberships/plans", { params }).then((res) => res.data);

/**
 * Get single membership plan by ID
 * @param {string} id - Membership plan ID
 * @returns {Promise}
 */
export const getMembershipPlan = (id) =>
  api.get(`/memberships/plans/${id}`).then((res) => res.data);

/**
 * Create new membership plan
 * @param {Object} planData - Plan data
 * @returns {Promise}
 */
export const createMembershipPlan = (planData) =>
  api.post("/memberships/plans", planData).then((res) => res.data);

/**
 * Update membership plan
 * @param {string} id - Plan ID
 * @param {Object} planData - Updated data
 * @returns {Promise}
 */
export const updateMembershipPlan = (id, planData) =>
  api.patch(`/memberships/plans/${id}`, planData).then((res) => res.data);

/**
 * Delete (deactivate) membership plan
 * @param {string} id - Plan ID
 * @returns {Promise}
 */
export const deleteMembershipPlan = (id) =>
  api.delete(`/memberships/plans/${id}`).then((res) => res.data);

/**
 * Seed default membership plans
 * @returns {Promise}
 */
export const seedDefaultPlans = () =>
  api.post("/memberships/plans/seed").then((res) => res.data);

// ==================== MEMBER MANAGEMENT ====================

/**
 * Get all active members
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getActiveMembers = (params = {}) =>
  api.get("/memberships/members", { params }).then((res) => res.data);

/**
 * Get membership statistics
 * @returns {Promise}
 */
export const getMembershipStats = () =>
  api.get("/memberships/stats").then((res) => res.data);

/**
 * Get active subscriber counts + preview lists for all plans (bulk)
 * @returns {Promise<{ data: { subscriberCounts: Record<string, { count, subscribers, hasMore, moreCount }> } }>}
 */
export const getPlanSubscriberCounts = () =>
  api.get("/memberships/plans/subscriber-counts").then((res) => res.data);

/**
 * Assign membership to patient
 * @param {Object} data - { patientId, planId }
 * @returns {Promise}
 */
export const assignMembership = (data) =>
  api.post("/memberships/assign", data).then((res) => res.data);

/**
 * Manually assign a membership to a patient (no payment gateway).
 * Supports inactive/discontinued plans and fully custom plan names.
 * @param {Object} data - { patientId, planId?, planName?, startDate, endDate,
 *                          amountPaid, paymentMethod, notes }
 * @returns {Promise}
 */
export const assignManualMembership = (data) =>
  api.post("/memberships/assign-manual", data).then((res) => res.data);

/**
 * Renew patient's membership
 * @param {string} patientId - Patient ID
 * @returns {Promise}
 */
export const renewMembership = (patientId) =>
  api.post(`/memberships/renew/${patientId}`).then((res) => res.data);

/**
 * Cancel patient's membership (terminal -- reason required)
 * @param {string} patientId - Patient ID
 * @param {string} reason
 * @returns {Promise}
 */
export const cancelMembership = (patientId, reason) =>
  api.post(`/memberships/cancel/${patientId}`, { reason }).then((res) => res.data);

/**
 * Pause patient's membership (temporary, resumable -- reason required)
 * @param {string} patientId - Patient ID
 * @param {string} reason
 * @returns {Promise}
 */
export const pauseMembership = (patientId, reason) =>
  api.post(`/memberships/pause/${patientId}`, { reason }).then((res) => res.data);

/**
 * Resume a paused membership (reason optional)
 * @param {string} patientId - Patient ID
 * @param {string} [reason]
 * @returns {Promise}
 */
export const resumeMembership = (patientId, reason) =>
  api.post(`/memberships/resume/${patientId}`, { reason }).then((res) => res.data);
