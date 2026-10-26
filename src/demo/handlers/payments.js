/**
 * /api/payments/* — port of modules/payments/payment.controller.js.
 * Razorpay is simulated: orders get "order_demo…" ids, any signature verifies,
 * refunds succeed, and payment links are fake rzp.io URLs.
 */
import { all, findById, newId, nowIso, remove } from "../core/db.js";
import { currentPatient, requirePatient, requireUser } from "../core/auth.js";
import { DemoError, badRequest, created, file, notFound, notInDemo, ok, paginated } from "../core/http.js";
import { findWhere, paginate, populate, sortBy, where } from "../core/query.js";
import {
  CLINIC_NAME,
  MODE_LABELS,
  PAYMENT_TYPE_LABELS,
  createPaymentDoc,
  demoId,
  excludeVoided,
  generateInvoice,
  istEndOfDay,
  istStartOfDay,
  isObjectId,
  parseIstDateRange,
  patientIdsMatching,
  paymentPostSave,
  populatePatient,
  requireAny,
  saveInvoice,
} from "../lib/billing-common.js";

const DEMO_KEY_ID = "rzp_test_demo";

/** Razorpay orders created in this session: orderId -> { amount, invoiceId, patientId }. */
const orders = new Map();
/** Payment links generated in this session: linkId -> amount (rupees). */
const linkAmounts = new Map();

function buildPaymentQuery({ patient, status, paymentMode, type, clinic, from, to, appointment } = {}) {
  const query = {};
  if (patient && isObjectId(patient)) query.patient = patient;
  if (appointment && isObjectId(appointment)) query.appointment = appointment;
  if (status) {
    query.status = String(status).includes(",") ? { $in: String(status).split(",").map((s) => s.trim()) } : status;
  }
  if (paymentMode) query.paymentMode = paymentMode;
  if (type) query.type = type;
  if (clinic && isObjectId(clinic)) query.clinic = clinic;
  if (from || to) query.createdAt = parseIstDateRange(from, to);
  return query;
}

function getPaymentOr404(id) {
  if (!isObjectId(id)) throw badRequest("Invalid payment ID");
  const payment = findById("Payment", id);
  if (!payment) throw notFound("Payment");
  return payment;
}

const withRefs = (payment, { patient = "name phone", invoice = "invoiceNumber grandTotal", clinic = "name code" } = {}) => {
  let doc = patient ? populatePatient(payment, patient) : payment;
  if (invoice) doc = populate(doc, "invoice", "Invoice", invoice);
  if (clinic) doc = populate(doc, "clinic", "Clinic", clinic);
  return doc;
};

const settled = (invoice, appliedAmount, previousAmountPaid) => ({
  invoiceId: invoice._id,
  invoiceNumber: invoice.invoiceNumber,
  appliedAmount,
  previousAmountPaid,
  _id: newId(),
});

/** Apply `amount` to an invoice the way the controllers do before invoice.save(). */
function applyToInvoice(invoice, amount) {
  const previous = invoice.amountPaid || 0;
  invoice.amountPaid = previous + amount;
  saveInvoice(invoice);
  return previous;
}

/** FIFO settlement across a patient's pending invoices (recordAdminPayment / verifyPendingPayment). */
function settleOldestFirst(invoices, amount) {
  let remaining = amount;
  const out = [];
  for (const invoice of invoices) {
    if (remaining <= 0) break;
    const due = invoice.balanceDue || Math.max(0, invoice.grandTotal - (invoice.amountPaid || 0));
    const apply = Math.min(remaining, due);
    if (apply <= 0) continue;
    const previous = applyToInvoice(invoice, apply);
    out.push(settled(invoice, apply, previous));
    remaining -= apply;
  }
  return out;
}

/** resolveTreatmentCharge */
function resolveTreatmentCharge(treatmentId, patientDoc) {
  if (!treatmentId || !isObjectId(treatmentId)) throw badRequest("A valid treatmentId is required");
  const treatment = findById("TreatmentMaster", treatmentId);
  if (!treatment || !treatment.isActive) throw notFound("Treatment");
  const baseAmount = treatment.price;
  if (!baseAmount || baseAmount <= 0) throw badRequest("This treatment does not have a valid price set");
  const m = patientDoc?.membership;
  const hasMembership = Boolean(m && m.status === "active" && m.expiryDate && Date.parse(m.expiryDate) > Date.now());
  const discountPercent = hasMembership ? m.discountPercent || 0 : 0;
  const finalAmount = Math.max(1, Math.round(baseAmount * (1 - discountPercent / 100)));
  return { treatment, baseAmount, discountPercent, finalAmount };
}

const treatmentNotes = ({ treatment, baseAmount, discountPercent }) =>
  discountPercent > 0
    ? `Treatment: ${treatment.name} (${discountPercent}% member discount on ₹${baseAmount})`
    : `Treatment: ${treatment.name}`;

// ---------------------------------------------------------------- CSV helpers

const MTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(new Date(d).getTime() + 5.5 * 60 * 60 * 1000);
  return `${String(dt.getUTCDate()).padStart(2, "0")} ${MTH[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
};
const esc = (v) => {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRow = (...cells) => cells.map(esc).join(",");
const inr = (n) => Number(n || 0).toLocaleString("en-IN");

export default function register(r) {
  // ==================== LIST / READ ====================

  r.get("/payments", (req) => {
    requireUser(req);
    const { search, patient } = req.query;
    let searchIds = null;
    if (search && String(search).trim()) {
      searchIds = patientIdsMatching(String(search));
      if (searchIds.length === 0) {
        const { page, limit } = paginate([], req.query, 10);
        return paginated([], { page, limit, total: 0 });
      }
    }
    const query = buildPaymentQuery(req.query);
    if (searchIds) {
      if (query.patient) query.patient = searchIds.includes(String(patient)) ? query.patient : { $in: [] };
      else query.patient = { $in: searchIds };
    }
    const sorted = sortBy(where("Payment", query), "-createdAt");
    const page = paginate(sorted, req.query, 10);
    const items = page.items.map((p) => {
      let doc = withRefs(p);
      doc = populate(doc, "receivedBy", "User", "name");
      doc = populate(doc, "appointment", "Appointment", "visitType treatmentStatus treatmentClosedAt");
      return doc;
    });
    return paginated(items, page);
  });

  r.get("/payments/stats", (req) => {
    requireUser(req);
    const { clinic, from, to } = req.query;
    const range = parseIstDateRange(from, to);
    const now = new Date();
    const startDate = range.$gte || istStartOfDay(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString());
    const endDate = range.$lte || now;
    const match = {
      status: "paid",
      ...(from || to
        ? {
            $or: [
              { paidAt: { $gte: startDate, $lte: endDate } },
              { paidAt: null, createdAt: { $gte: startDate, $lte: endDate } },
            ],
          }
        : { paidAt: { $gte: startDate, $lte: endDate } }),
    };
    if (clinic && isObjectId(clinic)) match.clinic = clinic;
    excludeVoided(match);

    const list = where("Payment", match);
    const collection = { total: 0, count: 0, byMode: {}, byType: {} };
    for (const p of list) {
      const mode = (collection.byMode[p.paymentMode] ??= { total: 0, count: 0 });
      mode.total += p.amount || 0;
      mode.count += 1;
      const type = (collection.byType[p.type] ??= { total: 0, count: 0 });
      type.total += p.amount || 0;
      type.count += 1;
      collection.total += p.amount || 0;
      collection.count += 1;
    }
    return ok({ stats: collection, dateRange: { from: startDate, to: endDate } }, "Payment statistics fetched successfully");
  });

  r.get("/payments/summary-stats", (req) => {
    requireUser(req);
    const { from, to } = req.query;
    const range = parseIstDateRange(from, to);

    const collectedMatch = excludeVoided({ status: { $in: ["paid", "refunded", "refund_pending"] } });
    if (from || to) collectedMatch.createdAt = range;
    const refundedMatch = { status: { $in: ["refunded", "refund_pending"] }, "refund.amount": { $exists: true, $ne: null } };
    if (from || to) refundedMatch["refund.refundedAt"] = range;
    const transactionMatch = { status: "paid" };
    if (from || to) transactionMatch.createdAt = range;

    const patientCollected = where("Payment", collectedMatch).reduce((s, p) => s + (p.amount || 0), 0);
    const totalRefunded = where("Payment", refundedMatch).reduce((s, p) => s + (p.refund?.amount || 0), 0);
    const transactionCount = where("Payment", transactionMatch).length;

    const incomeMatch = { isVoided: false };
    if (from || to) incomeMatch.date = range;
    const externalIncome = where("ExternalIncome", incomeMatch).reduce((s, i) => s + (i.amount || 0), 0);
    const totalCollected = patientCollected + externalIncome;

    return ok(
      { totalCollected, externalIncome, totalRefunded, netCollection: totalCollected - totalRefunded, transactionCount },
      "Payment summary stats fetched successfully",
    );
  });

  r.get("/payments/daily-collection", (req) => {
    requireUser(req);
    const { clinic, date } = req.query;
    if (!clinic || !isObjectId(clinic)) throw badRequest("Valid clinic ID is required");
    const reportDate = date ? new Date(date) : new Date();
    const day = new Date(reportDate.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const list = where("Payment", {
      clinic,
      status: "paid",
      paidAt: { $gte: istStartOfDay(day), $lte: istEndOfDay(day) },
    });
    const collection = { total: 0, byMethod: {}, count: 0 };
    for (const p of list) {
      const m = (collection.byMethod[p.paymentMode] ??= { total: 0, count: 0 });
      m.total += p.amount || 0;
      m.count += 1;
      collection.total += p.amount || 0;
      collection.count += 1;
    }
    return ok({ collection, date: reportDate, clinic }, "Daily collection fetched successfully");
  });

  r.get("/payments/number/:paymentNumber", (req) => {
    requireUser(req);
    const payment = findWhere("Payment", { paymentNumber: req.params.paymentNumber });
    if (!payment) throw notFound("Payment");
    return ok({ payment: withRefs(payment, { patient: "name phone email" }) }, "Payment fetched successfully");
  });

  r.get("/payments/export/pdf", (req) => {
    requireUser(req);
    throw notInDemo();
  });

  r.get("/payments/export/csv", (req) => {
    requireUser(req);
    const { status, from, to } = req.query;
    const payments = sortBy(where("Payment", buildPaymentQuery(req.query)), "-createdAt")
      .slice(0, 5000)
      .map((p) => populate(populate(p, "patient", "Patient", "name"), "invoice", "Invoice", "invoiceNumber"));
    const isRefunded = String(status || "").includes("refunded") || String(status || "").includes("reversed");
    const tabLabel = isRefunded ? "Refunded & Voided" : "Paid";
    const today = fmtDate(new Date());
    const base = ["Date", "Receipt No.", "Patient", "Invoice No.", "Service", "Amount (Rs.)", "Mode"];
    const headers = isRefunded ? [...base, "Refunded On", "Reason"] : base;
    const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const lines = [
      csvRow(CLINIC_NAME, "", `Payment History — ${tabLabel}`),
      csvRow("Exported:", today, from ? `From: ${fmtDate(from)}` : "", to ? `To: ${fmtDate(to)}` : ""),
      csvRow(`Records: ${payments.length}`, `Total: Rs. ${inr(total)}`),
      "",
      csvRow(...headers),
    ];
    for (const p of payments) {
      const row = [
        fmtDate(p.paidAt || p.createdAt),
        p.paymentNumber || "-",
        p.patient?.name || "-",
        p.invoice?.invoiceNumber || "-",
        p.treatmentName || PAYMENT_TYPE_LABELS[p.type] || p.type || "-",
        inr(p.amount),
        MODE_LABELS[p.paymentMode] || p.paymentMode || "-",
      ];
      lines.push(csvRow(...(isRefunded ? [...row, fmtDate(p.refund?.refundedAt), p.refund?.reason || "-"] : row)));
    }
    lines.push("", csvRow(isRefunded ? "Total Refunded:" : "Total Collected:", `Rs. ${inr(total)}`), csvRow("Records:", String(payments.length)));
    const filename = `payment-history-${tabLabel.toLowerCase().replace(/\s+&\s+|\s+/g, "-")}-${today.replace(/ /g, "-")}.csv`;
    return file("﻿" + lines.join("\r\n"), { filename, type: "text/csv; charset=utf-8" });
  });

  r.get("/payments/export/combined", (req) => {
    requireUser(req);
    const { from, to, format = "pdf" } = req.query;
    if (format !== "csv") throw notInDemo();

    const paymentQuery = excludeVoided({ status: { $in: ["paid", "refunded", "refund_pending"] } });
    if (from || to) paymentQuery.createdAt = parseIstDateRange(from, to);
    const payments = sortBy(where("Payment", paymentQuery), "-createdAt")
      .slice(0, 5000)
      .map((p) => {
        let d = populate(p, "patient", "Patient", "name");
        d = populate(d, "invoice", "Invoice", "invoiceNumber");
        return populate(d, "recordedBy", "User", "name");
      });
    const incomeQuery = { isVoided: false };
    if (from || to) incomeQuery.date = parseIstDateRange(from, to);
    const incomes = sortBy(where("ExternalIncome", incomeQuery), "-date").map((i) => populate(i, "recordedBy", "User", "name"));

    const pmtRows = payments.map((p) => {
      const isRefund = p.status === "refunded" || p.status === "refund_pending";
      return {
        type: isRefund ? "Refund" : "Payment",
        date: p.paidAt || p.createdAt,
        patientSource: p.patient?.name || "-",
        description: p.treatmentName || PAYMENT_TYPE_LABELS[p.type] || p.type || "-",
        amount: isRefund ? p.refund?.amount ?? p.amount ?? 0 : p.amount || 0,
        mode: MODE_LABELS[p.paymentMode] || p.paymentMode || "-",
        reference: p.invoice?.invoiceNumber || p.paymentNumber || "-",
        recordedBy: p.recordedBy?.name || "-",
      };
    });
    const incomeRows = incomes.map((i) => ({
      type: "External Income",
      date: i.date,
      patientSource: i.clinicName || "-",
      description: i.notes || i.treatment || "-",
      amount: i.amount || 0,
      mode: "-",
      reference: i.treatment || "-",
      recordedBy: i.recordedBy?.name || "-",
    }));
    const rows = [...pmtRows, ...incomeRows].sort((a, b) => new Date(b.date) - new Date(a.date));

    const patientCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalRefunds = payments
      .filter((p) => p.status === "refunded" || p.status === "refund_pending")
      .reduce((s, p) => s + (p.refund?.amount || 0), 0);
    const totalExternal = incomes.reduce((s, i) => s + (i.amount || 0), 0);
    const totalCollected = patientCollected + totalExternal;
    const net = totalCollected - totalRefunds;
    const today = fmtDate(new Date());

    const lines = [
      csvRow(CLINIC_NAME, "", "", "Payment History — All Sources", "", "", "", ""),
      csvRow("Exported:", today, from ? `From: ${from}` : "", to ? `To: ${to}` : "", "", "", "", ""),
      csvRow(
        `Records: ${rows.length}`,
        `Payments: ${pmtRows.filter((r) => r.type === "Payment").length}`,
        `Refunds: ${pmtRows.filter((r) => r.type === "Refund").length}`,
        `External: ${incomeRows.length}`,
        "", "", "", "",
      ),
      csvRow(
        `Patient Collected: Rs. ${inr(patientCollected)}`,
        `Refunds: Rs. ${inr(totalRefunds)}`,
        `External: Rs. ${inr(totalExternal)}`,
        `Total Collected: Rs. ${inr(totalCollected)}`,
        `Net: Rs. ${inr(net)}`,
        "", "", "",
      ),
      "",
      csvRow("Date", "Type", "Patient / Source", "Description", "Amount (Rs.)", "Mode", "Reference", "Recorded By"),
      ...rows.map((row) =>
        csvRow(fmtDate(row.date), row.type, row.patientSource, row.description, row.amount, row.mode, row.reference, row.recordedBy),
      ),
      "",
      csvRow("", "", "", "TOTALS", "", "", "", ""),
      csvRow("", "", "", "Patient Collected (gross)", inr(patientCollected), "", "", ""),
      csvRow("", "", "", "Total Refunds", inr(totalRefunds), "", "", ""),
      csvRow("", "", "", "Total External Income", inr(totalExternal), "", "", ""),
      csvRow("", "", "", "Total Collected", inr(totalCollected), "", "", ""),
      csvRow("", "", "", "Net Collection", inr(net), "", "", ""),
    ];
    return file("﻿" + lines.join("\r\n"), {
      filename: `payment-history-all-${today.replace(/ /g, "-")}.csv`,
      type: "text/csv; charset=utf-8",
    });
  });

  r.get("/payments/patient/:patientId/summary", (req) => {
    requireUser(req);
    if (!isObjectId(req.params.patientId)) throw badRequest("Invalid patient ID");
    const list = where("Payment", excludeVoided({ patient: req.params.patientId, status: "paid" }));
    const summary = { totalPaid: list.reduce((s, p) => s + (p.amount || 0), 0), paymentCount: list.length };
    return ok({ summary }, "Patient payment summary fetched successfully");
  });

  r.get("/payments/:id", (req) => {
    requireAny(req);
    const payment = getPaymentOr404(req.params.id);
    let doc = withRefs(payment, { patient: "name phone email", invoice: "invoiceNumber grandTotal balanceDue items" });
    doc = populate(doc, "appointment", "Appointment");
    doc = populate(doc, "receivedBy", "User", "name");
    doc = populate(doc, "refund.refundedBy", "User", "name");
    return ok({ payment: doc }, "Payment fetched successfully");
  });

  // ==================== RECORD ====================

  r.post("/payments", (req) => {
    const user = requireUser(req);
    const { patient, invoice, appointment, clinic, paymentMode, type, referenceNumber, notes } = req.body || {};
    const amount = Number(req.body?.amount);
    if (!patient || !clinic || !amount || !paymentMode) {
      throw badRequest("Patient, clinic, amount and payment mode are required");
    }
    if (amount <= 0) throw badRequest("Amount must be greater than 0");
    if (!findById("Patient", patient)) throw notFound("Patient");
    if (invoice) {
      const inv = findById("Invoice", invoice);
      if (!inv) throw notFound("Invoice");
      if (inv.status === "cancelled") throw badRequest("Cannot record payment for cancelled invoice");
      if (inv.paymentStatus === "paid" || inv.status === "paid") throw badRequest("Invoice is already fully paid");
      if (amount > inv.balanceDue) {
        throw badRequest(`Payment amount (${amount}) exceeds invoice balance due (${inv.balanceDue})`);
      }
    }
    const payment = createPaymentDoc({
      patient,
      invoice,
      appointment,
      clinic,
      amount,
      paymentMode,
      type: type || (invoice ? "invoice_payment" : "advance"),
      status: "paid",
      paidAt: nowIso(),
      referenceNumber,
      receivedBy: user._id,
      notes,
    });
    const doc = withRefs(payment, { invoice: "invoiceNumber grandTotal balanceDue paymentStatus" });
    return created({ payment: doc }, "Payment recorded successfully");
  });

  r.post("/payments/opd", (req) => {
    const user = requireUser(req);
    const { patient, clinic, appointment, paymentMode, referenceNumber, notes } = req.body || {};
    const amount = Number(req.body?.amount);
    if (!patient || !clinic || !amount || !paymentMode) {
      throw badRequest("Patient, clinic, amount and payment mode are required");
    }
    const payment = createPaymentDoc({
      patient,
      clinic,
      appointment,
      amount,
      paymentMode,
      type: "opd_fee",
      status: "paid",
      paidAt: nowIso(),
      referenceNumber,
      receivedBy: user._id,
      notes: notes || "OPD Fee",
    });
    return created({ payment: withRefs(payment, { invoice: null }) }, "OPD payment recorded successfully");
  });

  r.post("/payments/membership", (req) => {
    const user = requireUser(req);
    const { patient, clinic, paymentMode, referenceNumber, planName, notes } = req.body || {};
    const amount = Number(req.body?.amount);
    if (!patient || !clinic || !amount || !paymentMode) {
      throw badRequest("Patient, clinic, amount and payment mode are required");
    }
    const payment = createPaymentDoc({
      patient,
      clinic,
      amount,
      paymentMode,
      type: "membership",
      status: "paid",
      paidAt: nowIso(),
      referenceNumber,
      receivedBy: user._id,
      notes: notes || `Membership: ${planName || "Plan"}`,
    });
    return created({ payment: withRefs(payment, { invoice: null }) }, "Membership payment recorded successfully");
  });

  r.post("/payments/pay-at-clinic", (req) => {
    const patient = requirePatient(req);
    const charge = resolveTreatmentCharge(req.body?.treatmentId, patient);
    const payment = createPaymentDoc({
      patient: patient._id,
      amount: charge.finalAmount,
      paymentMode: "cash",
      type: "treatment",
      status: "pending",
      treatmentType: charge.treatment._id,
      treatmentName: charge.treatment.name,
      notes: `Pay at clinic — ${treatmentNotes(charge)}`,
    });
    return created(
      { payment, amount: charge.finalAmount, treatmentName: charge.treatment.name },
      "Treatment booked. Please pay at the clinic.",
    );
  });

  // ==================== RAZORPAY (simulated) ====================

  r.post("/payments/razorpay/create-order", (req) => {
    const { invoiceId, patient, clinic, type, isOnlineBooking, planId, isEmergency, treatmentId } = req.body || {};
    if (!isOnlineBooking && type !== "membership" && type !== "treatment" && (!patient || !clinic)) {
      throw badRequest("Patient and clinic are required");
    }
    const authPatient = currentPatient(req);
    const treatmentPatientId = authPatient?._id || patient;
    let amount;
    let plan = null;
    let charge = null;

    if (type === "treatment") {
      const patientDoc = treatmentPatientId ? findById("Patient", treatmentPatientId) : null;
      charge = resolveTreatmentCharge(treatmentId, patientDoc);
      amount = charge.finalAmount;
    } else if (type === "membership") {
      if (!planId) throw badRequest("planId is required for membership payment");
      plan = findById("MembershipPlan", planId);
      if (!plan) throw notFound("Membership plan");
      amount = plan.price;
    } else if (type === "opd_fee" || type === "consultation") {
      const fees = all("SystemSettings")[0]?.feeSettings || {};
      amount = type === "consultation" ? fees.consultationFee : isEmergency ? fees.opdFeeEmergency : fees.opdFeeRegular;
    } else if (invoiceId) {
      const inv = findById("Invoice", invoiceId);
      if (!inv) throw notFound("Invoice");
      amount = inv.balanceDue;
    } else {
      throw badRequest("Unable to determine payment amount for this request");
    }
    if (!amount || amount <= 0) throw badRequest("Could not determine a valid payment amount");

    const receipt = `rcpt_${Date.now()}`;
    const order = { id: demoId("order"), amount: Math.round(amount * 100), currency: "INR" };
    const data = {
      invoice: invoiceId,
      ...(clinic && { clinic }),
      amount,
      paymentMode: "razorpay",
      type: type || (invoiceId ? "invoice_payment" : "advance"),
      status: "pending",
      razorpayOrderId: order.id,
      razorpayDetails: { receipt },
    };
    if (patient) data.patient = patient;
    if (plan) data.notes = `Membership: ${plan.name}`;
    if (charge) {
      data.type = "treatment";
      data.treatmentType = charge.treatment._id;
      data.treatmentName = charge.treatment.name;
      data.notes = treatmentNotes(charge);
      if (treatmentPatientId) data.patient = String(treatmentPatientId);
    }
    const payment = createPaymentDoc(data);
    orders.set(order.id, { amount, invoiceId: invoiceId || null, patientId: data.patient || null });

    return ok({ order, paymentId: payment._id, key_id: DEMO_KEY_ID }, "Razorpay order created successfully");
  });

  r.post("/payments/razorpay/verify", (req) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw badRequest("Missing Razorpay payment details");
    }
    const payment = paymentId ? findById("Payment", paymentId) : findWhere("Payment", { razorpayOrderId: razorpay_order_id });
    if (!payment) throw new DemoError(404, "Payment record not found");

    if (payment.status !== "paid") {
      Object.assign(payment, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
        paidAt: nowIso(),
        updatedAt: nowIso(),
      });
      paymentPostSave(payment);

      if (payment.type === "treatment" && payment.treatmentType && payment.patient && !payment.invoice) {
        const invoice = generateInvoice({
          patient: payment.patient,
          clinic: payment.clinic || undefined,
          items: [{ itemType: "treatment", description: payment.treatmentName || "Treatment", unitPrice: payment.amount }],
          amountPaid: 0,
          paymentMethod: "razorpay",
          applyMembershipDiscount: false,
        });
        payment.invoice = invoice._id;
        paymentPostSave(payment);
      }
    }

    const doc = withRefs(payment, { invoice: "invoiceNumber grandTotal balanceDue paymentStatus", clinic: null });
    return ok({ payment: doc }, "Payment verified successfully");
  });

  r.post("/payments/razorpay/webhook", () => ({ status: "ok" }));

  // Payment links are fake in the demo, so "verify with Razorpay" treats any
  // generated link as paid and reconciles it (same path as the real webhook).
  r.post("/payments/verify-razorpay-link/:invoiceId", (req) => {
    requireUser(req);
    const { invoiceId } = req.params;
    if (!isObjectId(invoiceId)) throw badRequest("Invalid invoice ID");
    const invoice = findById("Invoice", invoiceId);
    if (!invoice) throw notFound("Invoice");
    const linkId = invoice.paymentLink?.id;
    if (!linkId) {
      throw badRequest("No Razorpay payment link was generated for this invoice, so there is nothing to verify.");
    }
    const existing = findWhere("Payment", { razorpayPaymentLinkId: linkId });
    if (existing || invoice.paymentLink?.status === "paid") {
      return ok(
        { outcome: "already_reconciled", razorpayStatus: invoice.paymentLink?.status || "paid", invoice, payment: existing || null },
        "This payment was already recorded — no action taken.",
      );
    }
    const previousAmountPaid = invoice.amountPaid || 0;
    const due = Math.max(0, invoice.grandTotal - previousAmountPaid);
    const applyAmount = Math.min(linkAmounts.get(linkId) || due, due) || due;
    if (applyAmount <= 0) {
      return ok({ outcome: "not_paid", razorpayStatus: "created", amountPaid: 0 }, `Razorpay shows this link as "created" — no payment has been received, so nothing was changed.`);
    }
    invoice.amountPaid = previousAmountPaid + applyAmount;
    invoice.paymentLink = { ...invoice.paymentLink, status: "paid", paidAt: nowIso() };
    saveInvoice(invoice);
    const payment = createPaymentDoc(
      {
        patient: invoice.patient,
        clinic: invoice.clinic,
        appointment: invoice.appointment,
        amount: applyAmount,
        paymentMode: "razorpay",
        type: invoice.items?.[0]?.itemType === "opd_fee" ? "opd_fee" : "treatment",
        status: "paid",
        paidAt: nowIso(),
        razorpayPaymentLinkId: linkId,
        notes: `Paid via Razorpay Payment Link (${linkId}) — reconciled manually via Verify Payment`,
        settledInvoices: [settled(invoice, applyAmount, previousAmountPaid)],
      },
      { skipHook: true },
    );
    if (invoice.appointment) {
      const appt = findById("Appointment", invoice.appointment);
      if (appt) {
        appt.opdFeePaid = true;
        if (invoice.paymentStatus === "paid") appt.paymentStatus = "paid";
        appt.paymentLinkStatus = "paid";
        appt.updatedAt = nowIso();
      }
    }
    return ok(
      { outcome: "reconciled", razorpayStatus: "paid", appliedAmount: applyAmount, payment, invoice },
      `Payment verified with Razorpay and recorded (₹${applyAmount}).`,
    );
  });

  // ==================== DELETE / REFUNDS ====================

  r.delete("/payments/:id", (req) => {
    requireUser(req);
    const payment = getPaymentOr404(req.params.id);
    remove("Payment", payment._id);
    return ok(null, "Payment deleted permanently");
  });

  r.post("/payments/:id/refund", (req) => {
    const user = requireUser(req);
    const payment = getPaymentOr404(req.params.id);
    const { reason } = req.body || {};
    if (payment.status === "refunded") throw badRequest("Payment is already refunded");
    if (payment.status !== "paid") throw badRequest("Can only refund paid payments");
    const refundAmount = Number(req.body?.amount) || payment.amount;
    if (refundAmount <= 0) throw badRequest("Refund amount must be greater than 0");

    // resolveTreatmentClosure: closed treatments get a 1-year goodwill window.
    let appt = payment.appointment ? findById("Appointment", payment.appointment) : null;
    if (!appt && payment.invoice) appt = findById("Appointment", findById("Invoice", payment.invoice)?.appointment);
    if (!appt && payment.settledInvoices?.length === 1) {
      appt = findById("Appointment", findById("Invoice", payment.settledInvoices[0].invoiceId)?.appointment);
    }
    const closed = appt && appt.visitType === "treatment" && appt.treatmentStatus && appt.treatmentClosedAt ? appt : null;
    const exceeds = refundAmount > payment.amount;
    if (closed) {
      if ((Date.now() - Date.parse(closed.treatmentClosedAt)) / 86400000 > 365) {
        throw badRequest("Refund window has expired for this completed treatment (1 year limit)");
      }
    } else if (exceeds) {
      throw badRequest("Refund amount cannot exceed payment amount");
    }

    const isRazorpay = payment.paymentMode === "razorpay" && payment.razorpayPaymentId;
    Object.assign(payment, {
      status: "refunded",
      refund: {
        amount: refundAmount,
        refundedAt: nowIso(),
        refundedBy: user._id,
        reason,
        ...(isRazorpay ? { razorpayRefundId: demoId("rfnd") } : {}),
        exceedsCollectedAmount: exceeds,
      },
      updatedAt: nowIso(),
    });
    if (payment.invoice) {
      const invoice = findById("Invoice", payment.invoice);
      if (invoice) {
        invoice.amountPaid -= refundAmount;
        saveInvoice(invoice);
      }
    }
    const doc = withRefs(payment, { invoice: "invoiceNumber grandTotal balanceDue", clinic: null });
    return ok({ payment: doc }, "Refund processed successfully");
  });

  r.post("/payments/:id/confirm-manual-refund", (req) => {
    const user = requireUser(req);
    const { manualMethod } = req.body || {};
    if (!["cash", "upi", "bank_transfer"].includes(manualMethod)) {
      throw badRequest("manualMethod must be cash, upi, or bank_transfer");
    }
    const payment = getPaymentOr404(req.params.id);
    if (payment.status !== "refund_pending") throw badRequest("Only refund_pending payments can be manually confirmed");
    Object.assign(payment, {
      status: "refunded",
      refund: { ...payment.refund, manualMethod, confirmedManuallyAt: nowIso(), confirmedManuallyBy: user._id },
      updatedAt: nowIso(),
    });
    const doc = withRefs(payment, { invoice: "invoiceNumber grandTotal balanceDue", clinic: null });
    return ok({ payment: doc }, "Refund confirmed as manually processed");
  });

  // ==================== ADMIN MANUAL PAYMENT ====================

  r.post("/payments/admin/record-payment", (req) => {
    const user = requireUser(req);
    const { patientId, mode, reference } = req.body || {};
    if (!patientId || !isObjectId(patientId)) throw badRequest("Valid patientId is required");
    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0) throw badRequest("Amount must be greater than 0");
    const normalizedMode = String(mode || "").toLowerCase();
    if (!["cash", "card", "upi"].includes(normalizedMode)) throw badRequest("Mode must be cash, card, or upi");
    if (!findById("Patient", patientId)) throw notFound("Patient");

    // (The backend doesn't exclude cancelled/voided invoices here; the demo
    // does, so the total matches the pending-amount shown in the modal.)
    const invoices = sortBy(
      where("Invoice", {
        patient: patientId,
        paymentStatus: { $in: ["unpaid", "partial"] },
        status: { $ne: "cancelled" },
        isVoided: { $ne: true },
      }),
      "createdAt",
    );
    const totalPending = invoices.reduce((s, inv) => s + (inv.balanceDue || 0), 0);
    if (totalPending <= 0) throw badRequest("No pending invoices for this patient");
    if (amount > totalPending + 0.01) {
      throw badRequest(`Amount ₹${amount} exceeds total pending ₹${totalPending.toFixed(2)}`);
    }
    const settledInvoices = settleOldestFirst(invoices, amount);
    const payment = createPaymentDoc(
      {
        patient: patientId,
        amount,
        paymentMode: normalizedMode,
        type: "invoice_payment",
        status: "paid",
        paidAt: nowIso(),
        referenceNumber: reference || undefined,
        recordedBy: user._id,
        settledInvoices,
        reversed: false,
      },
      { skipHook: true },
    );
    return ok({ payment, settledInvoices }, "Payment recorded successfully");
  });

  r.post("/payments/admin/reverse-payment", (req) => {
    const user = requireUser(req);
    const { paymentId, reason } = req.body || {};
    if (!paymentId || !isObjectId(paymentId)) throw badRequest("Valid paymentId is required");
    if (!reason?.trim()) throw badRequest("Reversal reason is required");
    const payment = findById("Payment", paymentId);
    if (!payment) throw notFound("Payment");
    if (payment.reversed) throw badRequest("Payment already reversed");
    if (!payment.settledInvoices?.length) {
      throw badRequest("This payment has no settlement history — only admin-recorded payments can be reversed here");
    }
    for (const s of payment.settledInvoices) {
      const invoice = findById("Invoice", s.invoiceId);
      if (!invoice) continue;
      invoice.amountPaid = s.previousAmountPaid || 0;
      saveInvoice(invoice);
    }
    Object.assign(payment, {
      reversed: true,
      reversalReason: reason.trim(),
      reversedAt: nowIso(),
      reversedBy: user._id,
      status: "reversed",
      updatedAt: nowIso(),
    });
    return ok({ success: true }, "Payment reversed successfully");
  });

  r.post("/payments/admin/collect", (req) => {
    const user = requireUser(req);
    const { invoiceId, mode, reference, notes, appointmentId } = req.body || {};
    if (!invoiceId || !isObjectId(invoiceId)) throw badRequest("Valid invoiceId is required");
    if (appointmentId && !isObjectId(appointmentId)) throw badRequest("Invalid appointmentId");
    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0) throw badRequest("Amount must be greater than 0");
    const normalizedMode = String(mode || "").toLowerCase();
    if (!["cash", "card", "upi", "razorpay"].includes(normalizedMode)) {
      throw badRequest("Mode must be cash, card, upi, or razorpay");
    }
    const invoice = findById("Invoice", invoiceId);
    if (!invoice) throw notFound("Invoice");
    if (invoice.status === "cancelled") throw badRequest("Cannot collect payment on a cancelled invoice");
    if (invoice.paymentStatus === "paid") throw badRequest("Invoice is already fully paid");
    const balanceDue = Math.max(0, (invoice.grandTotal || 0) - (invoice.amountPaid || 0));
    if (amount > balanceDue + 0.01) {
      throw badRequest(`Amount ₹${amount} exceeds balance due ₹${balanceDue.toFixed(2)}`);
    }

    if (normalizedMode === "razorpay") {
      if (!findById("Patient", invoice.patient)) throw new DemoError(404, "Patient not found for this invoice");
      const paymentLinkId = demoId("plink");
      const shortUrl = `https://rzp.io/i/${paymentLinkId.slice(-8)}`;
      linkAmounts.set(paymentLinkId, amount);
      invoice.paymentLink = { id: paymentLinkId, shortUrl, status: "created", createdAt: nowIso(), paidAt: null };
      saveInvoice(invoice);
      return ok(
        { paymentLink: { shortUrl, paymentLinkId, whatsappSent: false }, updatedInvoice: invoice },
        "Payment link generated successfully",
      );
    }

    const previousAmountPaid = applyToInvoice(invoice, amount);
    const payment = createPaymentDoc(
      {
        patient: invoice.patient,
        amount,
        paymentMode: normalizedMode,
        type: "invoice_payment",
        status: "paid",
        paidAt: nowIso(),
        referenceNumber: reference || undefined,
        notes: notes || undefined,
        recordedBy: user._id,
        ...(appointmentId ? { appointment: appointmentId } : {}),
        settledInvoices: [settled(invoice, amount, previousAmountPaid)],
        reversed: false,
      },
      { skipHook: true },
    );
    return ok({ payment, updatedInvoice: invoice }, "Payment collected successfully");
  });

  // ==================== PATIENT PENDING PAYMENT (Razorpay) ====================

  r.post("/payments/patient/create-pending-order", (req) => {
    const patient = requirePatient(req);
    const amount = Number(req.body?.amount);
    const { invoiceId } = req.body || {};
    if (!amount || Number.isNaN(amount) || amount <= 0) throw badRequest("Amount must be greater than 0");

    let totalPending;
    if (invoiceId) {
      if (!isObjectId(invoiceId)) throw badRequest("Invalid invoice ID");
      const invoice = findById("Invoice", invoiceId);
      if (!invoice || String(invoice.patient) !== String(patient._id)) throw notFound("Invoice");
      if (invoice.paymentStatus === "paid") throw badRequest("This invoice is already fully paid");
      if (!invoice.balanceDue || invoice.balanceDue <= 0) throw badRequest("No outstanding balance on this invoice");
      totalPending = invoice.balanceDue;
    } else {
      totalPending = where("Invoice", { patient: patient._id, paymentStatus: { $in: ["unpaid", "partial"] }, status: { $ne: "cancelled" }, isVoided: { $ne: true } }).reduce(
        (s, inv) => s + (inv.balanceDue || 0),
        0,
      );
      if (totalPending <= 0) throw badRequest("No pending amount to pay");
    }
    if (amount > totalPending + 0.01) {
      throw badRequest(`Amount cannot exceed total pending ₹${totalPending.toFixed(2)}`);
    }
    const orderId = demoId("order");
    orders.set(orderId, { amount, invoiceId: invoiceId ? String(invoiceId) : null, patientId: String(patient._id) });
    return ok({ orderId, amount, currency: "INR", keyId: DEMO_KEY_ID }, "Order created successfully");
  });

  r.post("/payments/patient/verify-pending-payment", (req) => {
    const patient = requirePatient(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw badRequest("Missing Razorpay payment details");
    }
    const order = orders.get(razorpay_order_id);
    const verifiedAmount = Number(order?.amount ?? req.body?.amount);
    const scopedInvoiceId = order?.invoiceId || null;
    if (!verifiedAmount || verifiedAmount <= 0) throw badRequest("Payment has not been captured yet");
    if (findWhere("Payment", { razorpayOrderId: razorpay_order_id, status: "paid" })) {
      return ok({ success: true }, "Payment successful");
    }
    orders.delete(razorpay_order_id);

    const rzp = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    };
    if (scopedInvoiceId) {
      const invoice = findWhere("Invoice", { _id: scopedInvoiceId, patient: patient._id });
      if (!invoice) throw notFound("Invoice");
      const previous = applyToInvoice(invoice, verifiedAmount);
      createPaymentDoc(
        {
          patient: patient._id,
          amount: verifiedAmount,
          paymentMode: "razorpay",
          type: "invoice_payment",
          status: "paid",
          paidAt: nowIso(),
          ...rzp,
          settledInvoices: [settled(invoice, verifiedAmount, previous)],
          notes: `Invoice payment via Razorpay — ${invoice.invoiceNumber}`,
        },
        { skipHook: true },
      );
    } else {
      const invoices = sortBy(
        where("Invoice", { patient: patient._id, paymentStatus: { $in: ["unpaid", "partial"] }, status: { $ne: "cancelled" }, isVoided: { $ne: true } }),
        "invoiceDate createdAt",
      );
      const settledInvoices = settleOldestFirst(invoices, verifiedAmount);
      createPaymentDoc(
        {
          patient: patient._id,
          amount: verifiedAmount,
          paymentMode: "razorpay",
          type: "invoice_payment",
          status: "paid",
          paidAt: nowIso(),
          ...rzp,
          settledInvoices,
          notes: "Pending amount payment via Razorpay",
        },
        { skipHook: true },
      );
    }
    return ok({ success: true }, "Payment successful");
  });
}
