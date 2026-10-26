/**
 * /api/billing/* — port of modules/billing/billing.controller.js.
 */
import { findById, newId, nowIso, remove } from "../core/db.js";
import { requirePatient, requireUser } from "../core/auth.js";
import { DemoError, badRequest, created, notFound, notInDemo, ok, paginated } from "../core/http.js";
import { findWhere, paginate, populate, sortBy, where } from "../core/query.js";
import {
  PAYMENT_TYPE_LABELS,
  createInvoiceDoc,
  createPaymentDoc,
  invoiceStats,
  isLinkedToVoided,
  isObjectId,
  parseIstDateRange,
  patientIdsMatching,
  populatePatient,
  processItem,
  realPaidByInvoiceMap,
  recordInvoicePayment,
  requireAny,
  saveInvoice,
  voidedInvoiceIds,
} from "../lib/billing-common.js";

const err = (status, message) => new DemoError(status, message);

function getInvoiceOr404(id) {
  if (!isObjectId(id)) throw badRequest("Invalid invoice ID");
  const invoice = findById("Invoice", id);
  if (!invoice) throw notFound("Invoice");
  return invoice;
}

function buildInvoiceQuery({ patient, status, paymentStatus, clinic, from, to, itemType, voided, search }) {
  const query = {};
  if (search && search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const ids = patientIdsMatching(search);
    query.$or = [{ invoiceNumber: regex }, ...(ids.length ? [{ patient: { $in: ids } }] : [])];
  }
  query.isVoided = voided === "true" ? true : { $ne: true };
  if (patient && isObjectId(patient)) query.patient = patient;
  if (status) query.status = status;
  if (paymentStatus) {
    const statuses = String(paymentStatus).split(",").filter((s) => ["unpaid", "partial", "paid"].includes(s));
    if (statuses.length > 1) query.paymentStatus = { $in: statuses };
    else if (statuses.length === 1) query.paymentStatus = statuses[0];
  }
  if (clinic && isObjectId(clinic)) query.clinic = clinic;
  if (itemType) query["items.itemType"] = itemType;
  if (from || to) query.invoiceDate = parseIstDateRange(from, to);
  return query;
}

/** .populate("patient", ...).populate("clinic", ...) helper */
const withPatientClinic = (invoice, patientSelect = "name phone", clinicSelect = "name code") => {
  let out = populatePatient(invoice, patientSelect);
  if (clinicSelect) out = populate(out, "clinic", "Clinic", clinicSelect);
  return out;
};

/** getPatientTotalPaid */
function patientTotalPaid(patientId) {
  const voidedSet = new Set(voidedInvoiceIds());
  const realPayments = where("Payment", { patient: patientId, status: "paid" }).filter(
    (p) => !isLinkedToVoided(p, voidedSet),
  );
  const paymentsSum = realPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const linked = new Set(
    realPayments.flatMap((p) => [
      ...(p.invoice ? [String(p.invoice)] : []),
      ...(p.settledInvoices || []).map((s) => String(s.invoiceId)),
    ]),
  );
  const unlinkedSum = where("Invoice", {
    patient: patientId,
    amountPaid: { $gt: 0 },
    status: { $ne: "cancelled" },
    isVoided: { $ne: true },
  })
    .filter((inv) => !linked.has(String(inv._id)))
    .reduce((s, inv) => s + (inv.amountPaid || 0), 0);
  return paymentsSum + unlinkedSum;
}

const perInvoiceDue = (invoices) => {
  const real = realPaidByInvoiceMap(invoices.map((i) => i._id));
  return invoices.reduce((sum, inv) => sum + Math.max(0, (inv.grandTotal || 0) - (real.get(String(inv._id)) || 0)), 0);
};

const ITEM_TYPE_LABELS = {
  opd_fee: "OPD Fee",
  treatment: "Treatment",
  surgery: "Surgery",
  test: "Test",
  medicine: "Medicine",
  membership: "Membership",
  other: "Other",
};

export default function register(r) {
  // ==================== LISTS ====================

  r.get("/billing/invoices", (req) => {
    requireUser(req);
    const query = buildInvoiceQuery(req.query);
    const sorted = sortBy(where("Invoice", query), "-createdAt");
    const page = paginate(sorted, req.query, 10);
    const real = realPaidByInvoiceMap(page.items.map((i) => i._id));
    const items = page.items.map((inv) => {
      let doc = withPatientClinic(inv, "name phone email", "name code");
      doc = populate(doc, "createdBy", "User", "name");
      const realPaid = real.get(String(inv._id)) || 0;
      doc.amountPaid = realPaid;
      doc.balanceDue = Math.max(0, (doc.grandTotal || 0) - realPaid);
      doc.paymentStatus = realPaid >= doc.grandTotal ? "paid" : realPaid > 0 ? "partial" : "unpaid";
      return doc;
    });
    return paginated(items, page);
  });

  r.get("/billing/stats", (req) => {
    requireUser(req);
    const { clinic, from, to, patient } = req.query;
    const matchQuery = { status: { $ne: "cancelled" }, isVoided: { $ne: true } };
    let startDate = null;
    let endDate = null;
    if (from || to) {
      matchQuery.invoiceDate = parseIstDateRange(from, to);
      startDate = matchQuery.invoiceDate.$gte || null;
      endDate = matchQuery.invoiceDate.$lte || null;
    }
    if (patient && isObjectId(patient)) matchQuery.patient = patient;
    if (clinic && isObjectId(clinic)) matchQuery.clinic = clinic;

    const invoices = where("Invoice", matchQuery);
    const result = invoiceStats(invoices);

    const paymentMatch = { status: { $in: ["paid", "refunded", "refund_pending"] } };
    if (startDate || endDate) {
      paymentMatch.createdAt = {};
      if (startDate) paymentMatch.createdAt.$gte = startDate;
      if (endDate) paymentMatch.createdAt.$lte = endDate;
    }
    if (patient && isObjectId(patient)) paymentMatch.patient = patient;
    if (clinic && isObjectId(clinic)) paymentMatch.clinic = clinic;
    const voided = voidedInvoiceIds();
    if (voided.length > 0) {
      paymentMatch.invoice = { $nin: voided };
      paymentMatch["settledInvoices.invoiceId"] = { $nin: voided };
    }
    const totalPaid = where("Payment", paymentMatch).reduce((s, p) => s + (p.amount || 0), 0);
    const totalDue = perInvoiceDue(invoices);

    return ok(
      { stats: { ...result, totalPaid, totalDue }, dateRange: { from: startDate, to: endDate } },
      "Billing statistics fetched successfully",
    );
  });

  r.get("/billing/overdue", (req) => {
    requireUser(req);
    const now = new Date();
    for (const inv of where("Invoice", {
      dueDate: { $lt: now },
      paymentStatus: { $in: ["unpaid", "partial"] },
      status: { $nin: ["paid", "cancelled", "overdue"] },
    })) {
      inv.status = "overdue";
      inv.updatedAt = nowIso();
    }
    const invoices = sortBy(where("Invoice", { status: "overdue" }), "dueDate").map((inv) =>
      populatePatient(inv, "name phone"),
    );
    return ok({ invoices }, "Overdue invoices fetched successfully");
  });

  // PDF statement export — generated server-side with pdfkit.
  r.get("/billing/export", (req) => {
    requireUser(req);
    throw notInDemo();
  });

  r.get("/billing/invoices/number/:invoiceNumber", (req) => {
    requireUser(req);
    const invoice = findWhere("Invoice", { invoiceNumber: req.params.invoiceNumber });
    if (!invoice) throw notFound("Invoice");
    let doc = withPatientClinic(invoice, "name phone email address", "name code address phone");
    doc = populate(doc, "appointment", "Appointment");
    return ok({ invoice: doc }, "Invoice fetched successfully");
  });

  // ==================== PATIENT (token-derived) ====================

  r.get("/billing/invoices/my-invoices", (req) => {
    const patient = requirePatient(req);
    const query = { patient: patient._id, isVoided: { $ne: true } };
    if (req.query.status) query.status = req.query.status;
    const sorted = sortBy(where("Invoice", query), "-invoiceDate -createdAt");
    const page = paginate(sorted, req.query, 50);
    const items = page.items.map((inv) => populate(inv, "clinic", "Clinic", "name code"));
    return paginated(items, page);
  });

  r.get("/billing/invoices/my-payment-history", (req) => {
    const patient = requirePatient(req);
    const patientId = patient._id;

    const rawPayments = sortBy(where("Payment", { patient: patientId, status: "paid" }), "-createdAt").map((p) =>
      populate(p, "invoice", "Invoice", "invoiceNumber grandTotal"),
    );
    const linked = new Set(
      rawPayments.flatMap((p) => [
        ...(p.invoice ? [String(p.invoice._id)] : []),
        ...(p.settledInvoices || []).map((s) => String(s.invoiceId)),
      ]),
    );

    const unlinkedEntries = where("Invoice", {
      patient: patientId,
      amountPaid: { $gt: 0 },
      status: { $ne: "cancelled" },
      isVoided: { $ne: true },
    })
      .filter((inv) => !linked.has(String(inv._id)))
      .map((inv) => {
        const first = inv.items?.[0];
        let paymentMode = inv.paymentMethod || "cash";
        if (paymentMode === "pay-at-clinic") paymentMode = "cash";
        return {
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          date: inv.invoiceDate,
          service: first?.description || ITEM_TYPE_LABELS[first?.itemType] || "Treatment",
          amountPaid: inv.amountPaid,
          paymentMethod: paymentMode,
          paymentStatus: inv.paymentStatus,
          grandTotal: inv.grandTotal,
          dueAfterThisPayment: null,
        };
      });

    const paymentEntries = rawPayments.map((p) => {
      let paymentMode = p.paymentMode || "cash";
      if (paymentMode === "pay-at-clinic") paymentMode = "cash";
      const primary = p.settledInvoices?.[0];
      let dueAfterThisPayment = null;
      if (primary) {
        const inv = findById("Invoice", primary.invoiceId);
        if (inv && inv.grandTotal !== undefined) {
          const cumulative = (primary.previousAmountPaid || 0) + (primary.appliedAmount || 0);
          dueAfterThisPayment = Math.max(0, inv.grandTotal - cumulative);
        }
      }
      return {
        _id: p._id,
        invoiceNumber: p.invoice?.invoiceNumber || null,
        date: p.createdAt,
        service: PAYMENT_TYPE_LABELS[p.type] || "Payment",
        amountPaid: p.amount,
        paymentMethod: paymentMode,
        paymentStatus: "paid",
        grandTotal: p.invoice?.grandTotal ?? p.amount,
        dueAfterThisPayment,
      };
    });

    const payments = [...paymentEntries, ...unlinkedEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
    return ok(payments, "Payment history fetched successfully");
  });

  r.get("/billing/my-summary", (req) => {
    const patient = requirePatient(req);
    const matchQuery = { patient: patient._id, status: { $ne: "cancelled" }, isVoided: { $ne: true } };
    const invoices = where("Invoice", matchQuery);
    const stats = invoiceStats(invoices);
    const totalPaid = patientTotalPaid(patient._id);
    const totalDue = perInvoiceDue(invoices);
    return ok({ stats: { ...stats, totalPaid, totalDue } }, "Billing summary fetched successfully");
  });

  // ==================== SINGLE INVOICE ====================

  r.get("/billing/invoices/:id", (req) => {
    const auth = requireAny(req);
    const invoice = getInvoiceOr404(req.params.id);
    if (auth.userType === "patient" && String(invoice.patient) !== String(auth.patient._id)) {
      throw err(403, "Not authorized to access this invoice");
    }
    let doc = withPatientClinic(invoice, "name phone email address membership", "name code address phone");
    doc = populate(doc, "appointment", "Appointment");
    doc = populate(doc, "createdBy", "User", "name");
    doc = populate(doc, "cancelledBy", "User", "name");
    return ok({ invoice: doc }, "Invoice fetched successfully");
  });

  // Invoice PDFs are rendered client-side (InvoicePDF + html2pdf); the
  // server pdfkit endpoint isn't simulated.
  r.get("/billing/invoices/:id/pdf", (req) => {
    requireAny(req);
    getInvoiceOr404(req.params.id);
    throw notInDemo();
  });

  r.post("/billing/invoices", (req) => {
    const user = requireUser(req);
    const { patient, clinic, appointment, items, discount, notes, terms, amountPaid, paymentMethod } = req.body || {};
    if (items?.some((i) => i.itemType === "opd_fee")) {
      throw badRequest("OPD Fee invoices must be created through appointment booking, not manually.");
    }
    if (items?.some((i) => i.itemType === "treatment")) {
      throw badRequest("Treatment invoices must be created through appointment booking, not manually.");
    }
    if (!patient || !clinic || !items || items.length === 0) {
      throw badRequest("Patient, clinic and at least one item are required");
    }
    const patientDoc = findById("Patient", patient);
    if (!patientDoc) throw notFound("Patient");

    const initialPaid = Math.max(0, Number(amountPaid) || 0);
    const invoice = createInvoiceDoc({
      patient: String(patient),
      clinic: String(clinic),
      appointment: appointment || undefined,
      items: items.map((i) => processItem({ ...i, unitPrice: Number(i.unitPrice) }, patientDoc, true)),
      discount: discount || { percentage: 0, amount: 0 },
      amountPaid: initialPaid,
      ...(initialPaid > 0 && paymentMethod ? { paymentMethod } : {}),
      notes,
      terms,
      createdBy: user._id,
    });
    return created({ invoice: withPatientClinic(invoice) }, "Invoice created successfully");
  });

  r.patch("/billing/invoices/:id", (req) => {
    requireUser(req);
    const invoice = getInvoiceOr404(req.params.id);
    if (invoice.status !== "draft") throw badRequest("Only draft invoices can be modified");
    for (const field of ["items", "discount", "notes", "terms", "dueDate"]) {
      if (req.body?.[field] !== undefined) invoice[field] = req.body[field];
    }
    if (req.body?.items) {
      invoice.items = invoice.items.map((i) => ({
        discount: { percentage: 0, amount: 0 },
        taxRate: 0,
        quantity: 1,
        ...i,
        _id: i._id || newId(),
      }));
    }
    saveInvoice(invoice);
    return ok({ invoice: withPatientClinic(invoice) }, "Invoice updated successfully");
  });

  r.post("/billing/invoices/:id/items", (req) => {
    requireUser(req);
    const invoice = getInvoiceOr404(req.params.id);
    if (invoice.status !== "draft") throw badRequest("Can only add items to draft invoices");
    const itemData = req.body || {};
    if (!itemData.description || itemData.unitPrice === undefined) {
      throw badRequest("Item description and unit price are required");
    }
    invoice.items.push(
      processItem(
        { ...itemData, discount: itemData.discount || { percentage: 0, amount: 0 }, unitPrice: Number(itemData.unitPrice) },
        null,
        false,
      ),
    );
    saveInvoice(invoice);
    return ok({ invoice: populatePatient(invoice, "name phone") }, "Item added successfully");
  });

  r.delete("/billing/invoices/:id/items/:itemId", (req) => {
    requireUser(req);
    const invoice = getInvoiceOr404(req.params.id);
    if (invoice.status !== "draft") throw badRequest("Can only remove items from draft invoices");
    invoice.items = invoice.items.filter((i) => String(i._id) !== String(req.params.itemId));
    saveInvoice(invoice);
    return ok({ invoice: populatePatient(invoice, "name phone") }, "Item removed successfully");
  });

  r.delete("/billing/invoices/:id", (req) => {
    requireUser(req);
    const invoice = getInvoiceOr404(req.params.id);
    if (!["draft", "cancelled"].includes(invoice.status)) {
      throw badRequest("Only draft or cancelled invoices can be permanently deleted");
    }
    remove("Invoice", invoice._id);
    return ok(null, "Invoice deleted permanently");
  });

  // ==================== ACTIONS ====================

  r.post("/billing/invoices/:id/issue", (req) => {
    requireUser(req);
    const invoice = getInvoiceOr404(req.params.id);
    if (invoice.status !== "draft") throw badRequest("Only draft invoices can be issued");
    if (!invoice.items?.length) throw badRequest("Cannot issue invoice with no items");
    invoice.status = "sent";
    saveInvoice(invoice);
    return ok({ invoice }, "Invoice issued successfully");
  });

  r.post("/billing/invoices/:id/cancel", (req) => {
    const user = requireUser(req);
    const invoice = getInvoiceOr404(req.params.id);
    if (invoice.paymentStatus === "paid" || invoice.status === "paid") throw badRequest("Cannot cancel a fully paid invoice");
    if (invoice.status === "cancelled") throw badRequest("Invoice is already cancelled");
    if (invoice.amountPaid > 0) throw badRequest("Invoice has payments recorded. Please process refunds first.");
    invoice.status = "cancelled";
    invoice.cancelledAt = nowIso();
    invoice.cancelledBy = user._id;
    invoice.cancellationReason = req.body?.reason || "Cancelled by admin";
    saveInvoice(invoice);
    return ok({ invoice }, "Invoice cancelled successfully");
  });

  r.post("/billing/invoices/:id/void", (req) => {
    const user = requireUser(req);
    const reason = req.body?.reason;
    if (!isObjectId(req.params.id)) throw badRequest("Invalid invoice ID");
    if (!reason || reason.trim().length < 10) {
      throw badRequest("A reason of at least 10 characters is required to void an invoice");
    }
    const invoice = getInvoiceOr404(req.params.id);
    if (invoice.isVoided) throw badRequest("Invoice is already voided");
    Object.assign(invoice, {
      isVoided: true,
      voidedAt: nowIso(),
      voidedBy: user._id,
      voidReason: reason.trim(),
      updatedAt: nowIso(),
    });
    return ok({ invoice: populatePatient(invoice, "name phone") }, "Invoice voided successfully");
  });

  r.patch("/billing/invoices/:id/correct", (req) => {
    const user = requireUser(req);
    const { items, discount, amountPaid, reason } = req.body || {};
    if (!isObjectId(req.params.id)) throw badRequest("Invalid invoice ID");
    if (!reason || reason.trim().length < 10) {
      throw badRequest("A reason of at least 10 characters is required to correct an invoice");
    }
    const invoice = getInvoiceOr404(req.params.id);
    const changes = {};
    const set = {};

    if (items) {
      set.items = items.map((item) => {
        let amount = (item.unitPrice || 0) * (item.quantity || 1);
        const pct = item.discount?.percentage || 0;
        const amt = item.discount?.amount || 0;
        if (pct > 0) amount -= (amount * pct) / 100;
        if (amt > 0) amount -= amt;
        amount = Math.max(0, amount);
        const taxAmount = (amount * (item.taxRate || 0)) / 100;
        return {
          discount: { percentage: 0, amount: 0 },
          taxRate: 0,
          quantity: 1,
          ...item,
          _id: item._id || newId(),
          amount,
          taxAmount,
          total: amount + taxAmount,
        };
      });
      changes.items = { from: invoice.items, to: set.items };
    }
    const finalItems = items ? set.items : invoice.items || [];
    const subtotal = finalItems.reduce((s, it) => s + (it.amount || 0), 0);
    const totalTax = finalItems.reduce((s, it) => s + (it.taxAmount || 0), 0);

    const effectiveDiscount = discount !== undefined ? discount : invoice.discount;
    if (discount !== undefined) {
      set.discount = discount;
      changes.discount = { from: invoice.discount, to: discount };
    }
    let discounted = subtotal;
    if (effectiveDiscount?.percentage > 0) discounted -= (discounted * effectiveDiscount.percentage) / 100;
    if (effectiveDiscount?.amount > 0) discounted -= effectiveDiscount.amount;
    const grandTotal = Math.max(0, Math.round(discounted + totalTax));

    const effectivePaid = amountPaid !== undefined ? Number(amountPaid) : invoice.amountPaid;
    if (amountPaid !== undefined) changes.amountPaid = { from: invoice.amountPaid, to: Number(amountPaid) };

    if (Object.keys(changes).length === 0) throw badRequest("No fields to correct were provided");

    if (items) {
      set.subtotal = subtotal;
      set.totalTax = totalTax;
    }
    set.grandTotal = grandTotal;
    set.balanceDue = Math.max(0, grandTotal - effectivePaid);
    set.paymentStatus = effectivePaid >= grandTotal ? "paid" : effectivePaid > 0 ? "partial" : "unpaid";
    if (amountPaid !== undefined) set.amountPaid = Number(amountPaid);
    set.lastEditedAt = nowIso();
    set.lastEditedBy = user._id;

    Object.assign(invoice, set, { updatedAt: nowIso() });
    invoice.editHistory = [
      ...(invoice.editHistory || []),
      { editedAt: nowIso(), editedBy: user._id, reason: reason.trim(), changes, _id: newId() },
    ];
    return ok({ invoice: populatePatient(invoice, "name phone") }, "Invoice corrected successfully");
  });

  r.post("/billing/invoices/:id/payment", (req) => {
    const user = requireUser(req);
    if (!isObjectId(req.params.id)) throw badRequest("Invalid invoice ID");
    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0) throw badRequest("Valid payment amount is required");
    const invoice = getInvoiceOr404(req.params.id);
    if (invoice.status === "cancelled") throw badRequest("Cannot record payment for cancelled invoice");
    if (invoice.paymentStatus === "paid") throw badRequest("Invoice is already fully paid");
    if (amount > invoice.balanceDue) {
      throw badRequest(`Payment amount (${amount}) exceeds balance due (${invoice.balanceDue})`);
    }
    const previousAmountPaid = invoice.amountPaid || 0;
    recordInvoicePayment(invoice, amount);
    createPaymentDoc({
      patient: invoice.patient,
      amount,
      paymentMode: req.body?.paymentMode || "cash",
      type: "invoice_payment",
      status: "paid",
      settledInvoices: [
        { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, appliedAmount: amount, previousAmountPaid, _id: newId() },
      ],
      recordedBy: user._id,
    });
    return ok({ invoice: populatePatient(invoice, "name phone") }, "Payment recorded successfully");
  });

  // ==================== PATIENT BILLING (admin) ====================

  r.get("/billing/patient/:patientId/pending", (req) => {
    requireUser(req);
    if (!isObjectId(req.params.patientId)) throw badRequest("Invalid patient ID");
    const invoices = sortBy(
      where("Invoice", {
        patient: req.params.patientId,
        paymentStatus: { $in: ["unpaid", "partial"] },
        status: { $ne: "cancelled" },
      }),
      "-createdAt",
    );
    return ok({ invoices }, "Pending invoices fetched successfully");
  });

  r.get("/billing/patient/:patientId/pending-amount", (req) => {
    requireUser(req);
    if (!isObjectId(req.params.patientId)) throw badRequest("Invalid patient ID");
    const invoices = where("Invoice", {
      patient: req.params.patientId,
      paymentStatus: { $in: ["unpaid", "partial"] },
      status: { $ne: "cancelled" },
      isVoided: { $ne: true },
    });
    const pendingAmount = invoices.reduce((s, inv) => s + Math.max(0, (inv.grandTotal || 0) - (inv.amountPaid || 0)), 0);
    return { success: true, pendingAmount: Math.round(pendingAmount * 100) / 100, invoiceCount: invoices.length };
  });

  r.get("/billing/patient/:patientId/unpaid-invoices", (req) => {
    requireUser(req);
    if (!isObjectId(req.params.patientId)) throw badRequest("Invalid patient ID");
    const patient = findById("Patient", req.params.patientId);
    if (!patient) throw notFound("Patient");
    const raw = sortBy(
      where("Invoice", {
        patient: req.params.patientId,
        paymentStatus: { $in: ["unpaid", "partial"] },
        status: { $ne: "cancelled" },
        isVoided: { $ne: true },
      }),
      "createdAt",
    );
    const invoices = raw.map((inv) => {
      const types = (inv.items || []).map((i) => i.itemType);
      let category = "Other";
      if (types.length) {
        if (types.some((t) => ["treatment", "surgery"].includes(t))) category = "Treatment";
        else if (types.includes("membership")) category = "Membership";
        else if (types.includes("opd_fee")) category = "OPD Fee";
        else if (types.includes("test")) category = "Test";
        else if (types.includes("medicine")) category = "Medicine";
      }
      return {
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.invoiceDate,
        dueDate: inv.dueDate,
        totalAmount: inv.grandTotal || 0,
        amountPaid: inv.amountPaid || 0,
        balanceDue: Math.max(0, (inv.grandTotal || 0) - (inv.amountPaid || 0)),
        paymentStatus: inv.paymentStatus,
        status: inv.status,
        category,
      };
    });
    const totalPending = Math.round(invoices.reduce((s, i) => s + i.balanceDue, 0) * 100) / 100;
    return {
      success: true,
      patient: { name: patient.name, phone: patient.phone, email: patient.email },
      totalPending,
      invoices,
    };
  });
}

