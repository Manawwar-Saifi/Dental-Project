/**
 * Dental labs and lab orders (backend: modules/labs — lab.controller.js and
 * labOrder.controller.js). Admin-only.
 */
import { all, findById, insert, update } from "../core/db.js";
import { badRequest, created, notFound, ok, paginated } from "../core/http.js";
import { requireUser } from "../core/auth.js";
import { escapeRegex, matches, paginate, populate, sortBy, sumBy, where } from "../core/query.js";
import {
  firstParam,
  isValidId,
  istDateRange,
  loadOr404,
  toIso,
  withSubId,
} from "../lib/clinical-util.js";

const PRICING_TYPES = ["per_unit", "per_arch", "fixed", "fixed_plus_per_unit"];

// ---------------------------------------------------------------- lab order model logic

/** labOrderSchema.methods.calculateTotals — mutates `order`. */
function calculateTotals(order) {
  order.items = (order.items || []).map((it) => {
    const qty = Number(it.quantity) || 0;
    const unit = Number(it.unitPrice) || 0;
    const base = Number(it.basePrice) || 0;
    let totalPrice;
    if (it.pricingType === "fixed") totalPrice = unit;
    else if (it.pricingType === "fixed_plus_per_unit") totalPrice = base + qty * unit;
    else totalPrice = qty * unit;
    return { ...it, totalPrice };
  });
  order.totalAmount = order.items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
  order.amountPaid = Number(order.amountPaid) || 0;
  order.balanceDue = Math.max(0, order.totalAmount - order.amountPaid);
  if (order.totalAmount > 0 && order.amountPaid >= order.totalAmount) order.paymentStatus = "paid";
  else if (order.amountPaid > 0) order.paymentStatus = "partially_paid";
  else order.paymentStatus = "unpaid";
  return order;
}

/** Pre-save order number: LO-YYMM-XXXX (walks forward past taken numbers). */
function nextOrderNumber() {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  let n = where("LabOrder", { createdAt: { $gte: monthStart, $lte: monthEnd } }).length + 1;
  const taken = new Set(all("LabOrder").map((o) => o.orderNumber));
  let candidate;
  do {
    candidate = `LO-${yy}${mm}-${String(n++).padStart(4, "0")}`;
  } while (taken.has(candidate));
  return candidate;
}

const populateListOrder = (order) =>
  populate(populate(order, "lab", "Lab", "name phone"), "patient", "Patient", "name phone");

const loadOrder = (id) => loadOr404("LabOrder", id, "Lab order", "Invalid order ID");

export default function register(r) {
  // ==================== LABS ====================

  r.get("/labs", (req) => {
    requireUser(req);
    const status = firstParam(req.query.status);
    const labs = sortBy(where("Lab", status ? { status } : {}), "name");
    return ok({ labs }, "Labs fetched successfully");
  });

  r.get("/labs/:id", (req) => {
    requireUser(req);
    const lab = loadOr404("Lab", req.params.id, "Lab", "Invalid lab ID");
    return ok({ lab }, "Lab fetched successfully");
  });

  r.post("/labs", (req) => {
    requireUser(req);
    const { name, contactPerson, phone, address, status, procedures } = req.body || {};
    if (!name || !String(name).trim()) throw badRequest("Lab name is required");
    const lab = insert("Lab", {
      name: String(name).trim(),
      ...(contactPerson !== undefined && { contactPerson }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      status: status === "inactive" ? "inactive" : "active",
      procedures: Array.isArray(procedures) ? procedures.map(normalizeProcedure) : [],
      __v: 0,
    });
    return created({ lab }, "Lab created successfully");
  });

  r.patch("/labs/:id", (req) => {
    requireUser(req);
    const doc = loadOr404("Lab", req.params.id, "Lab", "Invalid lab ID");
    const body = req.body || {};
    const patch = {};
    for (const field of ["name", "contactPerson", "phone", "address", "status", "procedures"]) {
      if (body[field] !== undefined) patch[field] = body[field];
    }
    if (typeof patch.name === "string") patch.name = patch.name.trim();
    if (Array.isArray(patch.procedures)) patch.procedures = patch.procedures.map(normalizeProcedure);
    const lab = update("Lab", doc._id, patch);
    return ok({ lab }, "Lab updated successfully");
  });

  r.delete("/labs/:id", (req) => {
    requireUser(req);
    const doc = loadOr404("Lab", req.params.id, "Lab", "Invalid lab ID");
    const lab = update("Lab", doc._id, { status: "inactive" });
    return ok({ lab }, "Lab marked inactive");
  });

  // ==================== LAB ORDERS ====================

  r.get("/lab-orders", (req) => {
    requireUser(req);
    const q = req.query;
    const lab = firstParam(q.lab);
    const deliveryStatus = q.deliveryStatus;
    const paymentStatus = firstParam(q.paymentStatus);
    const from = firstParam(q.from);
    const to = firstParam(q.to);
    const search = firstParam(q.search);

    const filter = {};
    if (lab && isValidId(lab)) filter.lab = lab;
    if (deliveryStatus) {
      const list = [].concat(deliveryStatus).flatMap((s) => String(s).split(",")).map((s) => s.trim());
      filter.deliveryStatus = list.length > 1 ? { $in: list } : list[0];
    }
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    filter.archived = firstParam(q.archived) === "true";
    if (from || to) filter.orderDate = istDateRange(from, to);
    if (search) filter.orderNumber = { $regex: escapeRegex(search), $options: "i" };

    const list = sortBy(
      all("LabOrder").filter((o) => matches({ archived: false, ...o }, filter)),
      "-createdAt"
    );
    const page = paginate(list, q, 10);
    return paginated(page.items.map(populateListOrder), page);
  });

  r.get("/lab-orders/stats", (req) => {
    requireUser(req);
    const from = firstParam(req.query.from);
    const to = firstParam(req.query.to);
    const now = Date.now();

    const orderFilter = {};
    if (from || to) orderFilter.orderDate = istDateRange(from, to);
    const orders = all("LabOrder").filter((o) => !o.archived && matches(o, orderFilter));

    const undeliveredOrders = orders.filter((o) => o.deliveryStatus !== "delivered");
    const overdue = undeliveredOrders.filter(
      (o) => o.expectedDelivery && Date.parse(o.expectedDelivery) < now
    ).length;

    // Cash basis: every payment whose date falls in range, archived or not.
    const range = from || to ? istDateRange(from, to) : null;
    const payments = all("LabOrder")
      .flatMap((o) => o.paymentHistory || [])
      .filter((p) => !range || matches(p, { date: range }));

    return ok(
      {
        totalSpent: sumBy(payments, "amount"),
        undelivered: undeliveredOrders.length,
        totalOrders: orders.length,
        overdue,
      },
      "Lab order stats fetched successfully"
    );
  });

  r.get("/lab-orders/:id", (req) => {
    requireUser(req);
    let order = loadOrder(req.params.id);
    order = populate(order, "lab", "Lab", "name phone contactPerson address");
    order = populate(order, "patient", "Patient", "name phone email");
    order = populate(order, "createdBy", "User", "name");
    return ok({ order }, "Lab order fetched successfully");
  });

  r.post("/lab-orders", (req) => {
    const user = requireUser(req);
    const { lab, patient, doctor, items, expectedDelivery, notes, orderDate } = req.body || {};

    if (!lab || !isValidId(lab)) throw badRequest("A valid lab is required");
    if (!patient || !isValidId(patient)) throw badRequest("A valid patient is required");
    if (!Array.isArray(items) || items.length === 0) throw badRequest("At least one item is required");

    const labDoc = findById("Lab", lab);
    if (!labDoc) throw notFound("Lab");
    if (!findById("Patient", patient)) throw notFound("Patient");

    const cleanItems = items
      .filter((it) => it && it.procedure)
      .map((it) => {
        const proc = (labDoc.procedures || []).find((p) => p.name === it.procedure);
        const pricingType = proc?.pricingType
          ? proc.pricingType
          : PRICING_TYPES.includes(it.pricingType)
            ? it.pricingType
            : "per_unit";
        return withSubId({
          procedure: String(it.procedure),
          quantity: Math.max(1, Number(it.quantity) || 1),
          unitPrice: proc ? Number(proc.price) || 0 : Math.max(0, Number(it.unitPrice) || 0),
          basePrice: proc ? Number(proc.basePrice) || 0 : Math.max(0, Number(it.basePrice) || 0),
          pricingType,
        });
      });
    if (cleanItems.length === 0) throw badRequest("At least one valid item is required");

    const doc = calculateTotals({
      orderNumber: nextOrderNumber(),
      lab,
      patient,
      ...(doctor && { doctor }),
      items: cleanItems,
      amountPaid: 0,
      paymentHistory: [],
      deliveryStatus: "pending",
      archived: false,
      orderDate: toIso(orderDate) || new Date().toISOString(),
      ...(toIso(expectedDelivery) && { expectedDelivery: toIso(expectedDelivery) }),
      ...(notes && { notes }),
      createdBy: user._id,
      __v: 0,
    });
    const order = insert("LabOrder", doc);
    return created({ order: populateListOrder(order) }, "Lab order created successfully");
  });

  r.patch("/lab-orders/:id", (req) => {
    requireUser(req);
    const order = loadOrder(req.params.id);
    const { deliveryStatus, expectedDelivery, deliveredDate, notes } = req.body || {};
    const patch = {};

    if (deliveryStatus !== undefined) {
      if (!["pending", "in_progress", "delivered", "rejected"].includes(deliveryStatus)) {
        throw badRequest(`\`${deliveryStatus}\` is not a valid enum value for path \`deliveryStatus\`.`);
      }
      patch.deliveryStatus = deliveryStatus;
      if (deliveryStatus === "delivered" && !order.deliveredDate) {
        patch.deliveredDate = toIso(deliveredDate) || new Date().toISOString();
      }
    }
    if (expectedDelivery !== undefined) patch.expectedDelivery = toIso(expectedDelivery) ?? null;
    if (deliveredDate !== undefined) patch.deliveredDate = toIso(deliveredDate) ?? null;
    if (notes !== undefined) patch.notes = notes;

    const updated = update("LabOrder", order._id, patch);
    calculateTotals(updated);
    return ok({ order: populateListOrder(updated) }, "Lab order updated successfully");
  });

  r.post("/lab-orders/:id/payment", (req) => {
    requireUser(req);
    if (!isValidId(req.params.id)) throw badRequest("Invalid order ID");
    const order = loadOrder(req.params.id);
    const { amount, method, notes, date } = req.body || {};

    const amt = Number(amount);
    if (!amt || amt <= 0) throw badRequest("Valid payment amount is required");
    if (amt > order.balanceDue + 0.01) {
      throw badRequest(`Payment amount (${amt}) exceeds balance due (${order.balanceDue})`);
    }

    const updated = update("LabOrder", order._id, {
      amountPaid: (Number(order.amountPaid) || 0) + amt,
      paymentHistory: [
        ...(order.paymentHistory || []),
        withSubId({
          amount: amt,
          date: toIso(date) || new Date().toISOString(),
          ...(method !== undefined && { method }),
          ...(notes !== undefined && { notes }),
        }),
      ],
    });
    calculateTotals(updated);
    return ok({ order: populateListOrder(updated) }, "Payment recorded successfully");
  });

  const setArchived = (value) => (req) => {
    requireUser(req);
    const order = loadOrder(req.params.id);
    const updated = update("LabOrder", order._id, { archived: value });
    calculateTotals(updated);
    return ok({ order: updated }, value ? "Lab order archived" : "Lab order restored");
  };
  r.patch("/lab-orders/:id/archive", setArchived(true));
  r.patch("/lab-orders/:id/unarchive", setArchived(false));
}

function normalizeProcedure(p) {
  return withSubId({
    name: String(p?.name ?? "").trim(),
    price: Number(p?.price) || 0,
    basePrice: Number(p?.basePrice) || 0,
    pricingType: PRICING_TYPES.includes(p?.pricingType) ? p.pricingType : "per_unit",
    ...(p?.notes !== undefined && { notes: p.notes }),
  });
}
