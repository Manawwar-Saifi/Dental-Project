/**
 * Patient Invoices API
 *
 * API functions for patients to view their own invoices. The list endpoint is
 * IDOR-protected server-side (anyAuth + patientSelfOrAdmin); the single-invoice
 * endpoint enforces ownership for patients.
 */
import api from "../axios";

/**
 * Get the logged-in patient's invoices (paginated).
 * Uses the token-derived endpoint so it never depends on a client-supplied id.
 * @param {Object} params - { page, limit, status }
 */
export const getMyInvoices = (params = {}) =>
  api.get("/billing/invoices/my-invoices", { params }).then((res) => res.data);

/**
 * Get a single invoice's full details (ownership enforced for patients).
 * @param {string} invoiceId - Invoice ID
 */
export const getMyInvoice = (invoiceId) =>
  api.get(`/billing/invoices/${invoiceId}`).then((res) => res.data);

/**
 * Get the logged-in patient's billing summary (outstanding balance etc.).
 * Token-derived & IDOR-safe; uses the same invoice aggregation as the admin
 * Billing page, so Pending Amount = sum of per-invoice balanceDue (totalDue).
 */
export const getMyBillingSummary = () =>
  api.get("/billing/my-summary").then((res) => res.data);

/**
 * Get the logged-in patient's payment history derived from invoices where
 * amountPaid > 0. Token-derived & IDOR-safe. Returns payment-shaped entries
 * even for invoices settled via invoice.amountPaid (no Payment doc needed).
 */
export const getMyPaymentHistory = () =>
  api.get("/billing/invoices/my-payment-history").then((res) => res.data);
