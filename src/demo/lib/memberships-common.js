/**
 * Shared helpers for the memberships mock: auth guards matching the backend
 * middleware chain, MembershipPlan / Patient toJSON virtuals, and the
 * auto-invoice + Payment side effect of paid membership flows.
 */
import { findById } from "../core/db.js";
import { currentUser, requireUser } from "../core/auth.js";
import { DemoError } from "../core/http.js";
import { findWhere, pick } from "../core/query.js";
// Namespace imports so a renamed export in another domain's lib degrades to
// "no invoice" instead of breaking this module's load.
import * as billing from "./billing-common.js";
import * as appointments from "./appointments-common.js";

export const isObjectId = (value) => typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

/** routes.js app-wide lockdown: a blog_editor token is refused outside /blogs. */
export function blockBlogEditor(req) {
  if (currentUser(req)?.role === "blog_editor") {
    throw new DemoError(403, "Access restricted to blog management only");
  }
}

/** authProtect (+ checkPermission(module, action) when given). */
export function staff(req, action) {
  blockBlogEditor(req);
  const user = requireUser(req);
  if (action) {
    const perm = findWhere("Permission", { role: user.role, module: "memberships" });
    if (!perm || !perm[action]) throw new DemoError(403, `No ${action} permission for memberships`);
  }
  return user;
}

/** authProtect + restrictTo("admin", "clinic_manager"). */
export function manager(req) {
  blockBlogEditor(req);
  return requireUser(req, "admin", "clinic_manager");
}

// ---------------------------------------------------------------- plan JSON

/** MembershipPlan toJSON({ virtuals: true }): priceDisplay, fullName, id. */
export function planJSON(plan) {
  if (!plan || typeof plan !== "object") return plan;
  const out = { ...plan };
  if (typeof plan.price === "number") out.priceDisplay = `₹${plan.price.toLocaleString("en-IN")}/year`;
  if (plan.type && plan.tier) {
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    out.fullName = `${cap(plan.type)} ${cap(plan.tier)}`;
  }
  out.id = String(plan._id);
  return out;
}

/** .populate("membership.plan", select) -> plan JSON (or null when missing). */
export function populatePlanRef(ref, select) {
  if (ref == null) return null;
  if (typeof ref === "object") return ref;
  const plan = findById("MembershipPlan", ref);
  if (!plan) return null;
  return planJSON(select ? pick(plan, select) : plan);
}

// ---------------------------------------------------------------- patient virtuals

export const hasMembership = (patient) =>
  Boolean(
    patient?.membership?.status === "active" &&
      patient.membership.expiryDate &&
      Date.parse(patient.membership.expiryDate) > Date.now()
  );

export const currentDiscount = (patient) =>
  hasMembership(patient) ? patient.membership.discountPercent || 0 : 0;

/** A membership subdoc with membership.plan populated (full plan). */
export function membershipWithPlan(membership, select) {
  if (!membership) return membership;
  return { ...membership, plan: populatePlanRef(membership.plan, select) };
}

/** membership with statusHistory.performedBy populated with the user's name. */
export function membershipWithHistoryUsers(membership) {
  if (!membership) return membership;
  return {
    ...membership,
    statusHistory: (membership.statusHistory || []).map((entry) => {
      if (!entry.performedBy || typeof entry.performedBy === "object") return entry;
      const user = findById("User", entry.performedBy);
      return { ...entry, performedBy: user ? { _id: user._id, name: user.name, id: String(user._id) } : null };
    }),
  };
}

/** Add one month count to an ISO/Date like JS Date#setMonth does. */
export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Number(months || 0));
  return d;
}

// ---------------------------------------------------------------- side effects

const toInvoicePaymentMethod = (method) => {
  if (["cash", "card", "upi", "online"].includes(method)) return method;
  if (method === "bank_transfer") return "online";
  return undefined;
};

const toPaymentMode = (method) => {
  if (["cash", "card", "upi"].includes(method)) return method;
  if (method === "online") return "razorpay";
  if (method === "bank_transfer") return "netbanking";
  return "other";
};

/**
 * generateInvoice(paid) + Payment.create(type "membership"), like the
 * controller's try/catch block. Never throws.
 */
export function recordMembershipPayment({ patient, description, amount, method, paymentMode, recordedBy }) {
  try {
    if (typeof billing.generateInvoice !== "function" || typeof appointments.createPayment !== "function") return;
    const invoice = billing.generateInvoice({
      patient,
      clinic: patient.preferredClinic || undefined,
      items: [{ itemType: "membership", description, unitPrice: amount }],
      amountPaid: amount,
      paymentMethod: method === "online" ? "online" : toInvoicePaymentMethod(method),
      createdBy: recordedBy,
      applyMembershipDiscount: false,
    });
    appointments.createPayment({
      patient: String(patient._id),
      amount,
      paymentMode: paymentMode || toPaymentMode(method),
      type: "membership",
      status: "paid",
      settledInvoices: [
        {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          appliedAmount: amount,
          previousAmountPaid: 0,
        },
      ],
      ...(recordedBy ? { recordedBy: String(recordedBy) } : {}),
    });
  } catch (err) {
    console.error("[demo] Auto-invoice for membership failed:", err?.message);
  }
}
