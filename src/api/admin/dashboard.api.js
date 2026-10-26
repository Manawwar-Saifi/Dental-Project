/**
 * Admin Dashboard API
 *
 * API functions for fetching dashboard statistics and data.
 * Uses existing backend endpoints to aggregate dashboard data.
 *
 * Backend endpoints used:
 * - GET /patients - Get patients list (for count and recent)
 * - GET /appointments - Get appointments list (for count and recent)
 * - GET /appointments/today - Get today's appointments
 * - GET /payments - Get payments (for pending count)
 */
import api from "../axios";

/**
 * Get dashboard statistics by aggregating multiple endpoints
 * @returns {Promise} - { totalPatients, totalAppointments, pendingPayments, todayAppointments, pendingLabOrders }
 */
export const getDashboardStats = async () => {
  // Fetch data from multiple endpoints in parallel
  const [patientsRes, appointmentsRes, todayRes, pendingPaymentsRes, pendingLabOrdersRes] = await Promise.all([
    api.get("/patients?limit=1"),
    api.get("/appointments?limit=1"),
    api.get("/appointments/today"),
    api.get("/payments?status=pending&limit=1").catch(() => ({ data: { pagination: { total: 0 } } })),
    // Pending = not yet delivered/rejected (terminal states), active (non-archived) orders only.
    api.get("/lab-orders?deliveryStatus=pending,in_progress&archived=false&limit=1").catch(() => ({ data: { pagination: { total: 0 } } })),
  ]);

  return {
    data: {
      totalPatients: patientsRes.data?.pagination?.total || 0,
      totalAppointments: appointmentsRes.data?.pagination?.total || 0,
      todayAppointments: todayRes.data?.data?.length || 0,
      pendingPayments: pendingPaymentsRes.data?.pagination?.total || 0,
      pendingLabOrders: pendingLabOrdersRes.data?.pagination?.total || 0,
    },
  };
};

/**
 * Get recent appointments for dashboard
 * @param {number} limit - Number of appointments to fetch
 * @returns {Promise} - Array of appointments
 */
export const getRecentAppointments = (limit = 5) =>
  api.get(`/appointments?limit=${limit}`).then((res) => ({
    data: res.data?.data || [],
  }));

/**
 * Get recently added patients
 * @param {number} limit - Number of patients to fetch
 * @returns {Promise} - Array of patients
 */
export const getRecentPatients = (limit = 5) =>
  api.get(`/patients?limit=${limit}`).then((res) => ({
    data: res.data?.data || [],
  }));

/**
 * Get today's appointments
 * @returns {Promise} - Array of today's appointments
 */
export const getTodayAppointments = () =>
  api.get("/appointments/today").then((res) => ({
    data: res.data?.data || [],
  }));

/**
 * Get stalled treatments (not yet closed, behind on sessions, no activity in 90+ days)
 * @returns {Promise} - { staleTreatments: [...], count }
 */
export const getStaleTreatments = () =>
  api.get("/appointments/stale-treatments").then((res) => ({
    data: res.data?.data || { staleTreatments: [], count: 0 },
  }));

/**
 * Get chargeable appointments that have NO invoice -- a billing gap.
 *
 * These are invisible to the Billing page by construction (there's no invoice
 * for it to list), so without this alert they're only discovered when someone
 * tries to collect and can't. Exactly how a real patient's ₹300 went unbilled.
 * @returns {Promise} - { unbilledAppointments: [...], count }
 */
export const getUnbilledAppointments = () =>
  api.get("/appointments/unbilled").then((res) => ({
    data: res.data?.data || { unbilledAppointments: [], count: 0 },
  }));
