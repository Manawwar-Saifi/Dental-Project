/**
 * Shared appointment logic for the demo (ported from
 * appointment.controller.js / appointment.model.js / invoice.service.js):
 * slot validation, appointment numbers, daily tokens, auto-invoices and
 * payment records.
 */
import { all, findById, insert, newId, nowIso } from "../core/db.js";
import { DemoError } from "../core/http.js";
import { count, istDateString, istDayRange, where } from "../core/query.js";
import { currentDiscount, hasActiveMembership } from "./patients-shape.js";

export const SLOT_BASE_CAPACITY = 2;
export const EMERGENCY_EXTRA = 1;
export const MIN_BACKDATE_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const slotCapacityFor = (bookingType) =>
  SLOT_BASE_CAPACITY + (bookingType === "emergency" ? EMERGENCY_EXTRA : 0);

export const canBackdate = (user) => !!user && ["admin", "clinic_manager"].includes(user.role);

export const isObjectId = (value) => typeof value === "string" && /^[0-9a-f]{24}$/i.test(value);

/** { hour, minute } of now in IST. */
export const istHourMinute = (date = new Date()) => {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return { hour: ist.getUTCHours(), minute: ist.getUTCMinutes() };
};

/** IST midnight (as a Date) of a "YYYY-MM-DD" string or an instant. */
export const istStartOfDay = (date) => istDayRange(normalizeDay(date)).start;
export const istEndOfDay = (date) => istDayRange(normalizeDay(date)).end;

const normalizeDay = (date) => {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date) && !date.includes("T")) return date.slice(0, 10);
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/.test(date)) return date.slice(0, 10);
  return istDateString(new Date(date));
};

/** Mongoose casts "yyyy-mm-dd" with new Date() -> UTC midnight. */
export const toDateIso = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new DemoError(400, "Invalid date format");
  return d.toISOString();
};

/** Active (non-cancelled, non-expired-hold) appointments in a clinic slot. */
export function countSlot({ clinic, date, timeSlot, excludeId }) {
  const start = istStartOfDay(date);
  const end = istEndOfDay(date);
  const now = Date.now();
  return all("Appointment").filter(
    (a) =>
      String(a.clinic) === String(clinic) &&
      a.timeSlot === timeSlot &&
      (!excludeId || String(a._id) !== String(excludeId)) &&
      Date.parse(a.date) >= start.getTime() &&
      Date.parse(a.date) <= end.getTime() &&
      (!["cancelled", "pending"].includes(a.status) ||
        (a.status === "pending" && a.pendingExpiry && Date.parse(a.pendingExpiry) > now))
  ).length;
}

/** validateAppointmentSlot — throws a DemoError when the slot is not bookable. */
export function validateAppointmentSlot({ clinic, date, timeSlot, bookingType, allowBackdate = false }) {
  if (Number.isNaN(new Date(date).getTime())) throw new DemoError(400, "Invalid date format");
  const dayStart = istStartOfDay(date);
  const todayStart = istStartOfDay(istDateString());

  if (allowBackdate) {
    const earliest = new Date(todayStart.getTime() - MIN_BACKDATE_DAYS * DAY_MS);
    if (dayStart < earliest) {
      throw new DemoError(400, `Cannot backdate an appointment more than ${MIN_BACKDATE_DAYS} days`);
    }
  } else if (dayStart < todayStart) {
    throw new DemoError(400, "Cannot book an appointment in the past");
  }

  const isToday = dayStart.getTime() === todayStart.getTime();
  if (isToday && timeSlot && !allowBackdate) {
    const [h, m] = String(timeSlot).split(":").map(Number);
    const { hour, minute } = istHourMinute();
    if (h * 60 + m <= hour * 60 + minute) throw new DemoError(400, "This time slot has already passed");
  }

  const capacity = slotCapacityFor(bookingType);
  if (countSlot({ clinic, date, timeSlot }) >= capacity) {
    throw new DemoError(
      409,
      bookingType === "emergency"
        ? "This time slot is fully booked (no emergency seat left)"
        : "This time slot is fully booked"
    );
  }
}

/** Next daily token for a clinic + IST date key (max existing + 1). */
export function nextDailyToken(clinic, dateKey) {
  const tokens = all("Appointment")
    .filter((a) => String(a.clinic) === String(clinic) && a.tokenDateKey === dateKey)
    .map((a) => Number(a.tokenNumber) || 0);
  return (tokens.length ? Math.max(...tokens) : 0) + 1;
}

/** appointmentNumber {CC}-{YYMMDD}-{HHMM} (IST booking time) + token, like the pre-save hook. */
export function assignIdentifiers(appointment) {
  const clinic = findById("Clinic", appointment.clinic);
  if (!clinic) throw new DemoError(404, "Clinic not found");
  const now = new Date();
  const [y, mo, d] = istDateString(now).split("-");
  const code = (
    clinic.code ||
    clinic.name?.split(/[\s-]+/).map((w) => w[0]).join("").toUpperCase() ||
    "UC"
  ).slice(0, 2);
  const prefix = `${code}-${y.slice(-2)}${mo}${d}-`;
  let number = null;
  for (let i = 0; i < 30 && !number; i++) {
    const { hour, minute } = istHourMinute(new Date(now.getTime() + i * 60000));
    const candidate = `${prefix}${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}`;
    if (!all("Appointment").some((a) => a.appointmentNumber === candidate)) number = candidate;
  }
  appointment.appointmentNumber = number || `${prefix}${Date.now() % 1000000}`;
  const dateKey = istDateString(now);
  appointment.tokenDateKey = dateKey;
  appointment.tokenNumber = nextDailyToken(appointment.clinic, dateKey);
  return appointment;
}

/** Schema defaults for a new Appointment document. */
export function appointmentDefaults() {
  return {
    type: "regular",
    appointmentType: "regular",
    visitType: "opd",
    parentAppointment: null,
    sessionNumber: null,
    sessionsPlanned: null,
    treatmentStatus: null,
    treatmentClosedAt: null,
    treatmentClosedReason: null,
    originatingOpdAppointment: null,
    treatmentHistory: [],
    status: "scheduled",
    pendingExpiry: null,
    cancellationReason: "",
    statusHistory: [],
    opdFee: 300,
    opdFeePaid: false,
    isFree: false,
    paymentMethod: "cash",
    paymentLinkUrl: null,
    paymentLinkId: null,
    paymentLinkStatus: null,
    invoiceError: { message: null, failedAt: null },
    paymentStatus: "unpaid",
    source: "walk_in",
    reminderSent: false,
    __v: 0,
  };
}

/** Appointment.create(): defaults + identifiers (skipped for pending holds). */
export function createAppointmentDoc(fields) {
  const doc = { ...appointmentDefaults() };
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) doc[k] = v;
  if (doc.date) doc.date = toDateIso(doc.date);
  if (doc.status !== "pending" && !doc.appointmentNumber) assignIdentifiers(doc);
  return insert("Appointment", doc);
}

// ---------------------------------------------------------------- invoices

/** invoice.calculateTotals() — mutates and returns the invoice. */
export function calculateInvoiceTotals(invoice) {
  for (const item of invoice.items || []) {
    const discount = item.discount || { percentage: 0, amount: 0 };
    let amount = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
    if (discount.percentage > 0) amount -= (amount * discount.percentage) / 100;
    if (discount.amount > 0) amount -= discount.amount;
    item.amount = Math.max(0, amount);
    item.taxAmount = (item.amount * (item.taxRate || 0)) / 100;
    item.total = item.amount + item.taxAmount;
  }
  invoice.subtotal = (invoice.items || []).reduce((s, i) => s + i.amount, 0);
  invoice.totalTax = (invoice.items || []).reduce((s, i) => s + i.taxAmount, 0);
  let discounted = invoice.subtotal;
  const disc = invoice.discount || {};
  if (disc.percentage > 0) discounted -= (discounted * disc.percentage) / 100;
  if (disc.amount > 0) discounted -= disc.amount;
  invoice.grandTotal = Math.max(0, Math.round(discounted + invoice.totalTax));
  invoice.balanceDue = Math.max(0, invoice.grandTotal - (invoice.amountPaid || 0));
  if ((invoice.amountPaid || 0) >= invoice.grandTotal) {
    invoice.paymentStatus = "paid";
    if (invoice.status !== "cancelled") invoice.status = "paid";
  } else if ((invoice.amountPaid || 0) > 0) {
    invoice.paymentStatus = "partial";
    if (invoice.status !== "cancelled") invoice.status = "partially_paid";
  } else {
    invoice.paymentStatus = "unpaid";
    if (["paid", "partially_paid"].includes(invoice.status)) invoice.status = "sent";
  }
  invoice.updatedAt = nowIso();
  return invoice;
}

function nextInvoiceNumber() {
  const [y, m] = istDateString().split("-");
  const prefix = `INV-${y.slice(-2)}${m}-`;
  const taken = new Set(all("Invoice").map((i) => i.invoiceNumber));
  let n = count("Invoice", { invoiceNumber: { $regex: `^${prefix}` } }) + 1;
  while (taken.has(`${prefix}${String(n).padStart(4, "0")}`)) n++;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/** generateInvoice() from invoice.service.js. */
export function generateInvoice({
  patient,
  clinic,
  appointment,
  items,
  discount,
  amountPaid = 0,
  paymentMethod,
  notes,
  createdBy,
  applyMembershipDiscount = true,
}) {
  const patientDoc = typeof patient === "object" ? patient : findById("Patient", patient);
  if (!patientDoc) throw new DemoError(404, "Patient not found for invoice generation");
  const member = hasActiveMembership(patientDoc);

  const processed = (items || []).map((item) => {
    let itemDiscount = { percentage: 0, amount: 0 };
    if (applyMembershipDiscount && member && !item.discount?.percentage) {
      itemDiscount.percentage = currentDiscount(patientDoc);
    } else if (item.discount) {
      itemDiscount = item.discount;
    }
    return {
      itemType: item.itemType || "other",
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: Number(item.unitPrice ?? item.amount ?? 0),
      discount: itemDiscount,
      taxRate: item.taxRate || 0,
      _id: newId(),
    };
  });

  const now = new Date();
  const invoice = {
    invoiceNumber: nextInvoiceNumber(),
    patient: String(patientDoc._id),
    ...(clinic ? { clinic: String(clinic) } : {}),
    ...(appointment ? { appointment: String(appointment) } : {}),
    invoiceDate: now.toISOString(),
    dueDate: new Date(now.getTime() + 7 * DAY_MS).toISOString(),
    items: processed,
    discount: discount ? { percentage: 0, amount: 0, ...discount } : { percentage: 0, amount: 0 },
    amountPaid: Math.max(0, Number(amountPaid) || 0),
    status: "draft",
    paymentStatus: "unpaid",
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(notes ? { notes } : {}),
    ...(createdBy ? { createdBy: String(createdBy) } : {}),
    isVoided: false,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    lastEditedAt: null,
    lastEditedBy: null,
    editHistory: [],
    paymentLink: { id: null, shortUrl: null, status: null, createdAt: null, paidAt: null },
    __v: 0,
  };
  calculateInvoiceTotals(invoice);
  return insert("Invoice", invoice);
}

// ---------------------------------------------------------------- payments

const paymentNumber = () => {
  const [, m, d] = istDateString().split("-");
  return `PAY-${d}${m}-${Math.floor(1000 + Math.random() * 9000)}`;
};

/** Payment.create(); a paid payment linked via `invoice` records itself on that invoice (post-save hook). */
export function createPayment(fields) {
  const payment = insert("Payment", {
    paymentNumber: paymentNumber(),
    status: "pending",
    refund: {
      razorpayError: null,
      manualMethod: null,
      confirmedManuallyAt: null,
      confirmedManuallyBy: null,
      exceedsCollectedAmount: false,
    },
    settledInvoices: [],
    reversed: false,
    __v: 0,
    ...fields,
    ...(fields.status === "paid" && !fields.paidAt ? { paidAt: nowIso() } : {}),
  });
  if (payment.status === "paid" && payment.invoice) {
    const invoice = findById("Invoice", payment.invoice);
    if (invoice) {
      invoice.amountPaid = (invoice.amountPaid || 0) + (Number(payment.amount) || 0);
      calculateInvoiceTotals(invoice);
    }
  }
  return payment;
}

/** Sessions (children) of a treatment parent, optionally filtered. */
export const childSessions = (parentId, filter = {}) =>
  where("Appointment", { parentAppointment: String(parentId), ...filter });
