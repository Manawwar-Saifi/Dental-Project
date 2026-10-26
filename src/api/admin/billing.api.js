/**
 * Admin Billing/Invoices API
 *
 * API functions for invoice management.
 * Backend endpoints: /api/billing
 */
import api from "../axios";

// ==================== INVOICE CRUD ====================

/**
 * Get all invoices (paginated, filterable)
 * @param {Object} params - { page, limit, search, patient, status, paymentStatus, clinic, from, to, itemType }
 */
export const getInvoices = (params = {}) =>
  api.get("/billing/invoices", { params }).then((res) => res.data);

/**
 * Get single invoice by ID
 * @param {string} id - Invoice ID
 */
export const getInvoice = (id) =>
  api.get(`/billing/invoices/${id}`).then((res) => res.data);

/**
 * Get invoice by invoice number
 * @param {string} invoiceNumber - e.g., "INV-2401-0001"
 */
export const getInvoiceByNumber = (invoiceNumber) =>
  api.get(`/billing/invoices/number/${invoiceNumber}`).then((res) => res.data);

/**
 * Create new invoice (draft)
 * @param {Object} data - { patient, clinic, items[], discount, notes, terms }
 */
export const createInvoice = (data) =>
  api.post("/billing/invoices", data).then((res) => res.data);

/**
 * Update invoice (draft only)
 * @param {string} id - Invoice ID
 * @param {Object} data - { items, discount, notes, terms, dueDate }
 */
export const updateInvoice = (id, data) =>
  api.patch(`/billing/invoices/${id}`, data).then((res) => res.data);

// ==================== INVOICE ITEMS ====================

/**
 * Add item to invoice (draft only)
 * @param {string} id - Invoice ID
 * @param {Object} itemData - { itemType, description, quantity, unitPrice, discount, taxRate }
 */
export const addInvoiceItem = (id, itemData) =>
  api.post(`/billing/invoices/${id}/items`, itemData).then((res) => res.data);

/**
 * Remove item from invoice (draft only)
 * @param {string} id - Invoice ID
 * @param {string} itemId - Item ID to remove
 */
export const removeInvoiceItem = (id, itemId) =>
  api.delete(`/billing/invoices/${id}/items/${itemId}`).then((res) => res.data);

// ==================== INVOICE ACTIONS ====================

/**
 * Issue/finalize invoice (draft → sent)
 * @param {string} id - Invoice ID
 */
export const issueInvoice = (id) =>
  api.post(`/billing/invoices/${id}/issue`).then((res) => res.data);

/**
 * Cancel invoice
 * @param {string} id - Invoice ID
 * @param {Object} data - { reason }
 */
export const cancelInvoice = (id, data = {}) =>
  api.post(`/billing/invoices/${id}/cancel`, data).then((res) => res.data);

/**
 * Record payment on invoice
 * @param {string} id - Invoice ID
 * @param {Object} data - { amount }
 */
export const recordInvoicePayment = (id, data) =>
  api.post(`/billing/invoices/${id}/payment`, data).then((res) => res.data);

/**
 * Download invoice PDF
 * @param {string} id - Invoice ID
 */
export const getInvoicePdf = (id) =>
  api.get(`/billing/invoices/${id}/pdf`).then((res) => res.data);

// ==================== STATS & REPORTS ====================

/**
 * Get billing statistics
 * @param {Object} params - { clinic, from, to }
 */
export const getBillingStats = (params = {}) =>
  api.get("/billing/stats", { params }).then((res) => res.data);

/**
 * Get overdue invoices
 */
export const getOverdueInvoices = () =>
  api.get("/billing/overdue").then((res) => res.data);

/**
 * Build the URL for exporting the currently-filtered invoice list as a PDF
 * statement. Same pattern as patients.api.js's getPatientsExportUrl.
 * @param {Object} params - Active filters (search, status, paymentStatus, voided, clinic, from, to, itemType)
 * @returns {string}
 */
export const getBillingExportUrl = (params = {}) => {
  const query = new URLSearchParams();
  query.set("format", "pdf");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const baseURL = api.defaults.baseURL || "";
  return `${baseURL}/billing/export?${query.toString()}`;
};

/**
 * Get patient's pending invoices
 * @param {string} patientId - Patient ID
 */
export const getPatientPendingInvoices = (patientId) =>
  api.get(`/billing/patient/${patientId}/pending`).then((res) => res.data);

export const getPatientPendingAmount = (patientId) =>
  api.get(`/billing/patient/${patientId}/pending-amount`).then((res) => res.data);

export const getPatientUnpaidInvoices = (patientId) =>
  api.get(`/billing/patient/${patientId}/unpaid-invoices`).then((res) => res.data);

/**
 * Delete invoice permanently (draft/cancelled only)
 * @param {string} id - Invoice ID
 */
export const deleteInvoice = (id) =>
  api.delete(`/billing/invoices/${id}`).then((res) => res.data);

/**
 * Void invoice -- self-service correction for phantom/erroneous invoices.
 * Works even on paid invoices (unlike cancelInvoice). Never deletes the
 * record; sets isVoided + audit fields. admin/clinic_manager only.
 * @param {string} id - Invoice ID
 * @param {Object} data - { reason } (required, min 10 chars)
 */
export const voidInvoice = (id, data) =>
  api.post(`/billing/invoices/${id}/void`, data).then((res) => res.data);

/**
 * Manually correct an invoice's items/discount/amountPaid.
 * admin/clinic_manager only. Logs an editHistory entry.
 * @param {string} id - Invoice ID
 * @param {Object} data - { items, discount, amountPaid, reason } (reason required)
 */
export const correctInvoice = (id, data) =>
  api.patch(`/billing/invoices/${id}/correct`, data).then((res) => res.data);
