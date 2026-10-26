/**
 * Shared helpers for the billing + payments demo handlers. Ports of the
 * Invoice / Payment model methods, statics and controller-level helpers
 * (calculateTotals, invoice/payment numbering, getStats, real-paid map,
 * voided-invoice exclusion, IST date ranges).
 */
import { all, findById, insert, newId, nowIso, update } from "../core/db.js";
import { currentPatient, currentUser } from "../core/auth.js";
import { DemoError } from "../core/http.js";
import { escapeRegex, populate, where } from "../core/query.js";

const IST = "+05:30";
const DAY_MS = 24 * 60 * 60 * 1000;

export const isObjectId = (value) => typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

// ---------------------------------------------------------------- dates

const dateOnly = (input) => String(input).slice(0, 10);
export const istStartOfDay = (input) => new Date(`${dateOnly(input)}T00:00:00.000${IST}`);
export const istEndOfDay = (input) => new Date(`${dateOnly(input)}T23:59:59.999${IST}`);

/** utils/istDateRange.js parseIstDateRange */
export const parseIstDateRange = (from, to) => {
  const range = {};
  if (from) range.$gte = istStartOfDay(from);
  if (to) range.$lte = istEndOfDay(to);
  return range;
};

// ---------------------------------------------------------------- auth

/** anyAuth middleware: staff user or patient. */
export function requireAny(req) {
  const user = currentUser(req);
  if (user && user.isActive !== false) return { user, patient: null, userType: "admin" };
  const patient = currentPatient(req);
  if (patient && patient.isActive !== false) return { user: null, patient, userType: "patient" };
  throw new DemoError(401, "Not authorized. Please log in.");
}

// ---------------------------------------------------------------- populate

/** Patient schema has toJSON virtuals (hasMembership, currentDiscount, calculatedAge, id). */
export function patientVirtuals(patient) {
  if (!patient || typeof patient !== "object") return patient;
  const m = patient.membership;
  const hasMembership = Boolean(
    m && m.status === "active" && m.expiryDate && Date.parse(m.expiryDate) > Date.now(),
  );
  const calculatedAge = patient.dateOfBirth
    ? Math.floor((Date.now() - Date.parse(patient.dateOfBirth)) / (DAY_MS * 365.25))
    : null;
  return {
    ...patient,
    hasMembership,
    currentDiscount: hasMembership ? m.discountPercent || 0 : 0,
    calculatedAge,
    id: String(patient._id),
  };
}

/** .populate("patient", select) on a non-lean query (virtuals included). */
export function populatePatient(doc, select, path = "patient") {
  const out = populate(doc, path, "Patient", select);
  if (out && out[path] && typeof out[path] === "object") out[path] = patientVirtuals(out[path]);
  return out;
}

/** Patient ids whose name/phone match a search term. */
export function patientIdsMatching(search) {
  const regex = new RegExp(escapeRegex(search.trim()), "i");
  return where("Patient", { $or: [{ name: regex }, { phone: regex }] }).map((p) => String(p._id));
}

// ---------------------------------------------------------------- invoices

/** Invoice.methods.calculateTotals — mutates in place. */
export function calculateTotals(invoice) {
  invoice.items = invoice.items || [];
  invoice.discount = invoice.discount || { percentage: 0, amount: 0 };
  invoice.amountPaid = Number(invoice.amountPaid) || 0;

  for (const item of invoice.items) {
    item.discount = item.discount || { percentage: 0, amount: 0 };
    item.quantity = Number(item.quantity) || 1;
    item.unitPrice = Number(item.unitPrice) || 0;
    item.taxRate = Number(item.taxRate) || 0;
    let amount = item.unitPrice * item.quantity;
    if (item.discount.percentage > 0) amount -= (amount * item.discount.percentage) / 100;
    if (item.discount.amount > 0) amount -= item.discount.amount;
    item.amount = Math.max(0, amount);
    item.taxAmount = (item.amount * item.taxRate) / 100;
    item.total = item.amount + item.taxAmount;
  }

  invoice.subtotal = invoice.items.reduce((s, i) => s + i.amount, 0);
  invoice.totalTax = invoice.items.reduce((s, i) => s + i.taxAmount, 0);

  let discounted = invoice.subtotal;
  if (invoice.discount.percentage > 0) discounted -= (discounted * invoice.discount.percentage) / 100;
  if (invoice.discount.amount > 0) discounted -= invoice.discount.amount;

  invoice.grandTotal = Math.max(0, Math.round(discounted + invoice.totalTax));
  invoice.balanceDue = Math.max(0, invoice.grandTotal - invoice.amountPaid);

  if (invoice.amountPaid >= invoice.grandTotal) {
    invoice.paymentStatus = "paid";
    if (invoice.status !== "cancelled") invoice.status = "paid";
  } else if (invoice.amountPaid > 0) {
    invoice.paymentStatus = "partial";
    if (invoice.status !== "cancelled") invoice.status = "partially_paid";
  } else {
    invoice.paymentStatus = "unpaid";
    if (["paid", "partially_paid"].includes(invoice.status)) invoice.status = "sent";
  }
  return invoice;
}

/** invoice.save(): pre-save recalculation + updatedAt bump. */
export function saveInvoice(invoice) {
  calculateTotals(invoice);
  invoice.updatedAt = nowIso();
  return invoice;
}

/** Invoice.statics.findAvailableInvoiceNumber */
export function nextInvoiceNumber() {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString();
  const prefix = `INV-${ist.slice(2, 4)}${ist.slice(5, 7)}-`;
  const taken = new Set(all("Invoice").map((i) => i.invoiceNumber));
  const count = all("Invoice").filter((i) => String(i.invoiceNumber || "").startsWith(prefix)).length;
  let n = count + 1;
  while (taken.has(`${prefix}${String(n).padStart(4, "0")}`)) n++;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/** Line item processing shared by createInvoice / invoice.service generateInvoice. */
export function processItem(item, patientDoc, applyMembershipDiscount = true) {
  const quantity = Number(item.quantity) || 1;
  const unitPrice = Number(item.unitPrice ?? item.amount ?? 0);
  const virt = patientVirtuals(patientDoc || {});
  let itemDiscount = { percentage: 0, amount: 0 };
  if (applyMembershipDiscount && virt.hasMembership && !item.discount?.percentage) {
    itemDiscount.percentage = virt.currentDiscount || 0;
  } else if (item.discount) {
    itemDiscount = { percentage: 0, amount: 0, ...item.discount };
  }
  let amount = unitPrice * quantity;
  if (itemDiscount.percentage > 0) amount -= (amount * itemDiscount.percentage) / 100;
  if (itemDiscount.amount > 0) amount -= itemDiscount.amount;
  amount = Math.max(0, amount);
  const taxRate = Number(item.taxRate) || 0;
  const taxAmount = (amount * taxRate) / 100;
  return {
    itemType: item.itemType || "other",
    ...(item.itemRef ? { itemRef: item.itemRef } : {}),
    ...(item.itemRefModel ? { itemRefModel: item.itemRefModel } : {}),
    description: item.description,
    quantity,
    unitPrice,
    discount: itemDiscount,
    taxRate,
    amount,
    taxAmount,
    total: amount + taxAmount,
    _id: newId(),
  };
}

/** Invoice.create(...) with schema defaults + pre-save hook. */
export function createInvoiceDoc(data) {
  const now = Date.now();
  const doc = {
    invoiceNumber: nextInvoiceNumber(),
    invoiceDate: new Date(now).toISOString(),
    dueDate: new Date(now + 7 * DAY_MS).toISOString(),
    items: [],
    subtotal: 0,
    discount: { percentage: 0, amount: 0 },
    totalTax: 0,
    grandTotal: 0,
    amountPaid: 0,
    balanceDue: 0,
    status: "draft",
    paymentStatus: "unpaid",
    isVoided: false,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    lastEditedAt: null,
    lastEditedBy: null,
    editHistory: [],
    paymentLink: { id: null, shortUrl: null, status: null, createdAt: null, paidAt: null },
    ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
    __v: 0,
  };
  calculateTotals(doc);
  return insert("Invoice", doc);
}

/** invoice.service generateInvoice */
export function generateInvoice({ patient, clinic, appointment, items, discount, amountPaid = 0, paymentMethod, notes, createdBy, applyMembershipDiscount = true }) {
  const patientDoc = typeof patient === "object" ? patient : findById("Patient", patient);
  if (!patientDoc) throw new DemoError(404, "Patient not found for invoice generation");
  return createInvoiceDoc({
    patient: String(patientDoc._id),
    ...(clinic ? { clinic: String(clinic) } : {}),
    ...(appointment ? { appointment: String(appointment) } : {}),
    items: (items || []).map((i) => processItem(i, patientDoc, applyMembershipDiscount)),
    discount: discount || { percentage: 0, amount: 0 },
    amountPaid: Math.max(0, Number(amountPaid) || 0),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(notes ? { notes } : {}),
    ...(createdBy ? { createdBy: String(createdBy) } : {}),
  });
}

/** Invoice.recordPayment(amount) */
export function recordInvoicePayment(invoice, amount) {
  invoice.amountPaid = (Number(invoice.amountPaid) || 0) + Number(amount);
  return saveInvoice(invoice);
}

/** Invoice.statics.getStats over an already-filtered list. */
export function invoiceStats(list) {
  if (list.length === 0) {
    return { totalInvoices: 0, totalAmount: 0, totalPaid: 0, totalDue: 0, paidCount: 0, partialCount: 0, unpaidCount: 0, opdCollection: 0 };
  }
  const stats = { _id: null, totalInvoices: 0, totalAmount: 0, totalPaid: 0, totalDue: 0, paidCount: 0, partialCount: 0, unpaidCount: 0, opdCollection: 0 };
  for (const inv of list) {
    stats.totalInvoices += 1;
    stats.totalAmount += inv.grandTotal || 0;
    stats.totalPaid += inv.amountPaid || 0;
    stats.totalDue += inv.balanceDue || 0;
    if (inv.paymentStatus === "paid") stats.paidCount += 1;
    if (inv.paymentStatus === "partial") stats.partialCount += 1;
    if (inv.paymentStatus === "unpaid") stats.unpaidCount += 1;
    const opdTotal = (inv.items || []).filter((i) => i.itemType === "opd_fee").reduce((s, i) => s + (i.total || 0), 0);
    if (opdTotal > 0 && (inv.amountPaid || 0) > 0) stats.opdCollection += inv.amountPaid;
  }
  return stats;
}

// ---------------------------------------------------------------- payments / ledger

export const voidedInvoiceIds = () => all("Invoice").filter((i) => i.isVoided === true).map((i) => String(i._id));

/** Payment filter fragment excluding payments tied to a voided invoice. */
export function excludeVoided(filter) {
  const ids = voidedInvoiceIds();
  if (ids.length > 0) {
    filter.invoice = { $nin: ids };
    filter["settledInvoices.invoiceId"] = { $nin: ids };
  }
  return filter;
}

export const isLinkedToVoided = (payment, voidedSet) => {
  if (payment.invoice && voidedSet.has(String(payment.invoice))) return true;
  if (Array.isArray(payment.settledInvoices)) return payment.settledInvoices.some((s) => voidedSet.has(String(s.invoiceId)));
  return false;
};

/** billing.controller getRealPaidByInvoiceMap */
export function realPaidByInvoiceMap(invoiceIds) {
  const idSet = new Set(invoiceIds.map(String));
  const map = new Map();
  if (idSet.size === 0) return map;
  for (const p of all("Payment")) {
    if (!["paid", "refunded", "refund_pending"].includes(p.status)) continue;
    if (Array.isArray(p.settledInvoices) && p.settledInvoices.length > 0) {
      for (const s of p.settledInvoices) {
        const id = String(s.invoiceId);
        if (!idSet.has(id)) continue;
        const applied = s.appliedAmount != null ? s.appliedAmount : p.amount;
        map.set(id, (map.get(id) || 0) + (applied || 0));
      }
    } else if (p.invoice && idSet.has(String(p.invoice))) {
      const id = String(p.invoice);
      map.set(id, (map.get(id) || 0) + (p.amount || 0));
    }
  }
  return map;
}

/** Payment.model generatePaymentNumber (unique within the demo db). */
export function nextPaymentNumber() {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString();
  const ddmm = `${ist.slice(8, 10)}${ist.slice(5, 7)}`;
  const taken = new Set(all("Payment").map((p) => p.paymentNumber));
  let candidate;
  do candidate = `PAY-${ddmm}-${Math.floor(1000 + Math.random() * 9000)}`;
  while (taken.has(candidate));
  return candidate;
}

/**
 * Payment.create(...) with schema defaults. Runs the model's post-save hook
 * (paid + invoice link => invoice.recordPayment) unless `skipHook`.
 */
export function createPaymentDoc(data, { skipHook = false } = {}) {
  const doc = insert("Payment", {
    paymentNumber: nextPaymentNumber(),
    status: "pending",
    type: "opd_fee",
    refund: { razorpayError: null, manualMethod: null, confirmedManuallyAt: null, confirmedManuallyBy: null, exceedsCollectedAmount: false },
    settledInvoices: [],
    reversed: false,
    ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "")),
    __v: 0,
  });
  if (!skipHook) paymentPostSave(doc);
  return doc;
}

/** payment.model post("save"): paid + invoice => invoice.recordPayment(amount). */
export function paymentPostSave(payment) {
  if (payment.status === "paid" && payment.invoice) {
    const invoice = findById("Invoice", payment.invoice);
    if (invoice) recordInvoicePayment(invoice, payment.amount);
  }
}

export const savePayment = (payment, patch = {}) => update("Payment", payment._id, patch);

export const PAYMENT_TYPE_LABELS = {
  opd_fee: "OPD Fee",
  consultation: "Consultation",
  treatment: "Treatment",
  test: "Test",
  invoice_payment: "Invoice Payment",
  advance: "Advance",
  membership: "Membership",
  refund: "Refund",
  other: "Other",
};

export const MODE_LABELS = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  razorpay: "Razorpay",
  netbanking: "Net Banking",
  other: "Other",
};

export const CLINIC_NAME = "Dental Clinic";

export const demoId = (prefix) => `${prefix}_demo${Math.random().toString(36).slice(2, 12)}`;
