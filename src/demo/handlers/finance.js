/**
 * Finance mocks: /expenses/* (incl. P&L) and /external-income/*.
 * Ported from backend modules/expenses and modules/externalIncome.
 */
import { findById, insert, remove, update, nowIso } from "../core/db.js";
import { requireUser } from "../core/auth.js";
import { badRequest, created, file, notFound, notInDemo, ok, paginated } from "../core/http.js";
import { escapeRegex, paginate, sortBy, sumBy, where } from "../core/query.js";
import {
  activeStaff,
  fmtExportDate,
  isFutureDate,
  isObjectId,
  parseIstDateRange,
  populateMany,
  requirePermission,
  toIsoDate,
  userRef,
} from "../lib/finance-common.js";
import { computeProfitLoss } from "../lib/finance-pnl.js";

// ─── Expenses ──────────────────────────────────────────────────────────────

const VENDOR_CATEGORIES = new Set(["lab", "materials", "equipment", "marketing"]);
const VALID_CATEGORIES = ["lab", "salaries", "rent", "utilities", "materials", "equipment", "marketing", "other"];
const VALID_MODES = ["cash", "upi", "net_banking", "card", "cheque", "other"];
const MAX_AMOUNT = 1_000_000;

const CLINIC_REF = ["clinic", "Clinic", "name code"];
const EXPENSE_LIST_REFS = [userRef("spentBy"), userRef("recordedBy"), userRef("editedBy"), userRef("voidedBy"), CLINIC_REF];
const EXPENSE_DETAIL_REFS = [userRef("spentBy"), userRef("recordedBy"), userRef("editedBy"), CLINIC_REF];
const EXPENSE_VOID_REFS = [userRef("spentBy"), userRef("recordedBy"), userRef("voidedBy"), CLINIC_REF];

const searchClause = (search) => {
  if (!search || !String(search).trim()) return undefined;
  const regex = new RegExp(escapeRegex(String(search).trim()), "i");
  return [{ description: regex }, { vendor: regex }];
};

/** buildExpenseQuery / getExpenses filter. */
function expenseQuery(q, { allowVoided = false } = {}) {
  const query = { isVoided: allowVoided && q.voided === "true" ? true : { $ne: true } };
  if (q.from || q.to) query.date = parseIstDateRange(q.from, q.to);
  if (q.category) query.category = q.category;
  if (q.paymentMode) query.paymentMode = q.paymentMode;
  if (q.spentBy && isObjectId(q.spentBy)) query.spentBy = q.spentBy;
  if (q.clinic && isObjectId(q.clinic)) query.clinic = q.clinic;
  const or = searchClause(q.search);
  if (or) query.$or = or;
  return query;
}

const sortedExpenses = (query) => sortBy(where("Expense", query), "-date -createdAt");

const loadExpense = (id) => {
  if (!isObjectId(id)) throw badRequest("Invalid expense ID");
  const expense = findById("Expense", id);
  if (!expense) throw notFound("Expense");
  return expense;
};

const checkAmount = (amount) => {
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt <= 0) throw badRequest("amount must be a positive number greater than zero");
  if (amt > MAX_AMOUNT) {
    throw badRequest(`amount cannot exceed Rs${MAX_AMOUNT.toLocaleString("en-IN")} — check for extra zeros`);
  }
  return amt;
};

function registerExpenses(r) {
  r.get("/expenses/staff", (req) => {
    requirePermission(req, "expenses", "view");
    return ok({ users: activeStaff() });
  });

  r.get("/expenses/stats", (req) => {
    requirePermission(req, "expenses", "view");
    const { from, to, category, clinic } = req.query;
    const match = { isVoided: { $ne: true } };
    if (from || to) match.date = parseIstDateRange(from, to);
    if (category) match.category = category;
    if (clinic && isObjectId(clinic)) match.clinic = clinic;

    const list = where("Expense", match);
    const grandTotal = sumBy(list, "amount");
    const groups = {};
    for (const e of list) {
      const g = (groups[e.category] ??= { category: e.category, total: 0, count: 0 });
      g.total += Number(e.amount) || 0;
      g.count += 1;
    }
    const byCategory = Object.values(groups)
      .sort((a, b) => b.total - a.total)
      .map((c) => ({ ...c, pct: grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0 }));

    return ok({ total: grandTotal, count: list.length, byCategory });
  });

  r.get("/expenses/pnl", (req) => {
    requirePermission(req, "reports", "view");
    const { from, to, clinic } = req.query;
    return ok(computeProfitLoss({ from, to, clinic }), "P&L report generated");
  });

  r.get("/expenses/export/csv", (req) => {
    requirePermission(req, "expenses", "view");
    const expenses = sortedExpenses(expenseQuery(req.query))
      .slice(0, 10000)
      .map((e) => populateMany(e, [["spentBy", "User", "name"], ["recordedBy", "User", "name"]]));

    const esc = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
    const header = ["Date", "Category", "Description", "Amount", "Payment Mode", "Spent By", "Vendor", "Notes", "Recorded By", "Recorded On"];
    const rows = expenses.map((e) => [
      fmtExportDate(e.date),
      e.category,
      esc(e.description),
      e.amount,
      e.paymentMode,
      esc(e.spentBy?.name),
      esc(e.vendor),
      esc(e.notes),
      esc(e.recordedBy?.name),
      fmtExportDate(e.createdAt),
    ]);
    const totalRow = ["", "", "TOTAL", sumBy(expenses, "amount"), "", "", "", "", "", ""];
    const csv = [header, ...rows, [], totalRow].map((row) => row.join(",")).join("\r\n");
    const today = fmtExportDate(new Date()).replace(/ /g, "-");
    return file(csv, { filename: `expenses-${today}.csv`, type: "text/csv" });
  });

  r.get("/expenses/export/pdf", (req) => {
    requirePermission(req, "expenses", "view");
    throw notInDemo("PDF export isn't available in the demo. Try the CSV export instead.");
  });

  r.get("/expenses", (req) => {
    requirePermission(req, "expenses", "view");
    const page = paginate(sortedExpenses(expenseQuery(req.query, { allowVoided: true })), req.query, 10);
    const items = page.items.map((e) => populateMany(e, EXPENSE_LIST_REFS));
    return paginated(items, page, "Expenses fetched successfully");
  });

  r.get("/expenses/:id", (req) => {
    requirePermission(req, "expenses", "view");
    const expense = loadExpense(req.params.id);
    return ok({ expense: populateMany(expense, EXPENSE_DETAIL_REFS) });
  });

  r.post("/expenses", (req) => {
    const user = requirePermission(req, "expenses", "create");
    const { date, category, description, amount, paymentMode, spentBy, vendor, clinic, notes } = req.body || {};

    if (!date || !category || !description || !amount || !paymentMode || !spentBy) {
      throw badRequest("date, category, description, amount, paymentMode, and spentBy are required");
    }
    if (!VALID_CATEGORIES.includes(category)) {
      throw badRequest(`Invalid category. Valid values: ${VALID_CATEGORIES.join(", ")}`);
    }
    const amt = checkAmount(amount);
    if (isFutureDate(date)) throw badRequest("Expense date cannot be in the future");
    if (!isObjectId(spentBy)) throw badRequest("Invalid spentBy user ID");
    if (clinic && !isObjectId(clinic)) throw badRequest("Invalid clinic ID");
    if (!VALID_MODES.includes(paymentMode)) throw badRequest(`\`${paymentMode}\` is not a valid enum value for path \`paymentMode\`.`);

    const safeVendor = VENDOR_CATEGORIES.has(category) ? String(vendor || "").trim() || undefined : undefined;
    const doc = {
      date: toIsoDate(date),
      category,
      description: String(description).trim(),
      amount: amt,
      paymentMode,
      spentBy,
      recordedBy: user._id,
      isVoided: false,
      __v: 0,
    };
    if (safeVendor) doc.vendor = safeVendor;
    if (clinic) doc.clinic = clinic;
    if (notes) doc.notes = String(notes).trim();

    const expense = insert("Expense", doc);
    return created({ expense: populateMany(expense, [userRef("spentBy"), userRef("recordedBy"), CLINIC_REF]) }, "Expense recorded successfully");
  });

  r.patch("/expenses/:id", (req) => {
    const user = requirePermission(req, "expenses", "edit");
    const expense = loadExpense(req.params.id);
    if (expense.isVoided) {
      throw badRequest("Cannot edit a voided expense. Void is permanent — record a corrected entry instead.");
    }

    const { date, category, description, amount, paymentMode, spentBy, vendor, notes } = req.body || {};
    const updates = {};
    if (date !== undefined) {
      if (isFutureDate(date)) throw badRequest("Expense date cannot be in the future");
      updates.date = toIsoDate(date);
    }
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        throw badRequest(`Invalid category. Valid values: ${VALID_CATEGORIES.join(", ")}`);
      }
      updates.category = category;
    }
    if (description !== undefined) updates.description = String(description).trim();
    if (amount !== undefined) updates.amount = checkAmount(amount);
    if (paymentMode !== undefined) updates.paymentMode = paymentMode;
    if (spentBy !== undefined) {
      if (!isObjectId(spentBy)) throw badRequest("Invalid spentBy user ID");
      updates.spentBy = spentBy;
    }
    if (vendor !== undefined) {
      const effectiveCategory = category !== undefined ? category : expense.category;
      updates.vendor = VENDOR_CATEGORIES.has(effectiveCategory) ? String(vendor || "").trim() || undefined : undefined;
    }
    if (notes !== undefined) updates.notes = notes == null ? notes : String(notes).trim();

    update("Expense", expense._id, { ...updates, editedBy: user._id, editedAt: nowIso() });
    if (expense.vendor === undefined) delete expense.vendor;

    return ok({ expense: populateMany(expense, EXPENSE_DETAIL_REFS) }, "Expense updated successfully");
  });

  r.post("/expenses/:id/void", (req) => {
    const user = requirePermission(req, "expenses", "delete");
    if (!isObjectId(req.params.id)) throw badRequest("Invalid expense ID");
    const { reason } = req.body || {};
    if (!reason || String(reason).trim().length < 10) {
      throw badRequest("A reason of at least 10 characters is required");
    }
    const expense = loadExpense(req.params.id);
    if (expense.isVoided) throw badRequest("Expense is already voided");

    update("Expense", expense._id, {
      isVoided: true,
      voidedAt: nowIso(),
      voidedBy: user._id,
      voidReason: String(reason).trim(),
    });
    return ok({ expense: populateMany(expense, EXPENSE_VOID_REFS) }, "Expense voided successfully");
  });

  r.delete("/expenses/:id/permanent", (req) => {
    requireUser(req, "admin");
    const expense = loadExpense(req.params.id);
    if (!expense.isVoided) {
      throw badRequest("Only voided expenses can be permanently deleted. Void the expense first.");
    }
    remove("Expense", expense._id);
    return ok(null, "Expense permanently deleted");
  });
}

// ─── External income ───────────────────────────────────────────────────────

const INCOME_REFS = [userRef("doctor"), userRef("recordedBy")];
const INCOME_LIST_REFS = [...INCOME_REFS, userRef("voidedBy")];
const INCOME_FIELDS = ["date", "amount", "doctor", "doctorName", "clinicName", "treatment", "notes"];

const loadIncome = (id) => {
  if (!isObjectId(id)) throw badRequest("Invalid external income ID");
  const record = findById("ExternalIncome", id);
  if (!record) throw notFound("External income record");
  return record;
};

function registerExternalIncome(r) {
  r.get("/external-income/staff", (req) => {
    requirePermission(req, "external_income", "view");
    return ok({ users: activeStaff() });
  });

  r.get("/external-income/stats", (req) => {
    requirePermission(req, "external_income", "view");
    const { from, to } = req.query;
    const match = { isVoided: false };
    if (from || to) match.date = parseIstDateRange(from, to);
    const list = where("ExternalIncome", match);
    return ok({ totalAmount: sumBy(list, "amount"), count: list.length }, "External income stats fetched successfully");
  });

  r.get("/external-income/export", (req) => {
    requirePermission(req, "external_income", "view");
    const { from, to, format = "pdf" } = req.query;
    if (format !== "csv") throw notInDemo("PDF export isn't available in the demo. Try the CSV export instead.");

    const query = { isVoided: { $ne: true } };
    if (from || to) query.date = parseIstDateRange(from, to);
    const records = sortBy(where("ExternalIncome", query), "-date")
      .slice(0, 5000)
      .map((rec) => populateMany(rec, [["doctor", "User", "name"], ["recordedBy", "User", "name"]]));

    const today = fmtExportDate(new Date());
    const total = sumBy(records, "amount");
    const esc = (v) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const row = (...cells) => cells.map(esc).join(",");
    const lines = [
      row("Dental Clinic", "", "Payment History — Another Source"),
      row("Exported:", today, from ? `From: ${fmtExportDate(from)}` : "", to ? `To: ${fmtExportDate(to)}` : ""),
      row(`Records: ${records.length}`, `Total: Rs. ${total.toLocaleString("en-IN")}`),
      "",
      row("Date", "Source (Clinic)", "Treatment / Service", "Doctor / Staff", "Amount (Rs.)", "Notes", "Recorded By"),
      ...records.map((rec) =>
        row(
          fmtExportDate(rec.date),
          rec.clinicName || "-",
          rec.treatment || "-",
          rec.doctor?.name || rec.doctorName || "-",
          (rec.amount || 0).toLocaleString("en-IN"),
          rec.notes || "-",
          rec.recordedBy?.name || "-"
        )
      ),
      "",
      row("Total Amount:", `Rs. ${total.toLocaleString("en-IN")}`),
      row("Records:", String(records.length)),
    ];
    return file("﻿" + lines.join("\r\n"), {
      filename: `payment-history-another-source-${today.replace(/ /g, "-")}.csv`,
      type: "text/csv",
    });
  });

  r.get("/external-income", (req) => {
    requirePermission(req, "external_income", "view");
    const { from, to, includeVoided } = req.query;
    const query = {};
    if (includeVoided !== "true") query.isVoided = { $ne: true };
    if (from || to) query.date = parseIstDateRange(from, to);

    const page = paginate(sortBy(where("ExternalIncome", query), "-date -createdAt"), req.query, 20);
    const items = page.items.map((rec) => populateMany(rec, INCOME_LIST_REFS));
    return paginated(items, page, "External income records fetched successfully");
  });

  r.post("/external-income", (req) => {
    const user = requirePermission(req, "external_income", "create");
    const { date, amount, doctor, doctorName, clinicName, treatment, notes } = req.body || {};

    if (!date) throw badRequest("date is required");
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      throw badRequest("amount must be a number greater than 0");
    }
    if (!clinicName || !String(clinicName).trim()) throw badRequest("clinicName is required");
    if (!treatment || !String(treatment).trim()) throw badRequest("treatment is required");

    const hasDoctor = Boolean(doctor) && isObjectId(doctor);
    const hasDoctorName = Boolean(doctorName) && String(doctorName).trim().length > 0;
    if (!hasDoctor && !hasDoctorName) {
      throw badRequest("Either doctor (staff ObjectId) or doctorName (free text) must be provided");
    }
    if (doctor && !isObjectId(doctor)) throw badRequest("Invalid doctor user ID");

    const record = insert("ExternalIncome", {
      date: toIsoDate(date),
      amount: Number(amount),
      doctor: hasDoctor ? doctor : null,
      doctorName: hasDoctorName ? String(doctorName).trim() : "",
      clinicName: String(clinicName).trim(),
      treatment: String(treatment).trim(),
      notes: notes ? String(notes).trim() : "",
      recordedBy: user._id,
      isVoided: false,
      voidedAt: null,
      voidedBy: null,
      voidReason: "",
      __v: 0,
    });
    return created({ record: populateMany(record, INCOME_REFS) }, "External income recorded successfully");
  });

  r.put("/external-income/:id", (req) => {
    requirePermission(req, "external_income", "edit");
    const record = loadIncome(req.params.id);
    if (record.isVoided) throw badRequest("Cannot update a voided record");

    const body = req.body || {};
    const updates = {};
    for (const field of INCOME_FIELDS) if (body[field] !== undefined) updates[field] = body[field];

    if (updates.doctor && !isObjectId(updates.doctor)) throw badRequest("Invalid doctor user ID");
    if (updates.doctor === "") updates.doctor = null;
    if (updates.date) updates.date = toIsoDate(updates.date);
    if (updates.amount !== undefined) {
      if (Number.isNaN(Number(updates.amount)) || Number(updates.amount) <= 0) {
        throw badRequest("amount must be a number greater than 0");
      }
      updates.amount = Number(updates.amount);
    }

    const next = { ...record, ...updates };
    const hasDoctorName = next.doctorName && String(next.doctorName).trim().length > 0;
    if (next.doctor == null && !hasDoctorName) {
      throw badRequest("Either doctor (staff) or doctorName (free text) must be provided");
    }

    update("ExternalIncome", record._id, updates);
    return ok({ record: populateMany(record, INCOME_REFS) }, "External income updated successfully");
  });

  r.post("/external-income/:id/void", (req) => {
    const user = requirePermission(req, "external_income", "delete");
    if (!isObjectId(req.params.id)) throw badRequest("Invalid external income ID");
    const { voidReason } = req.body || {};
    if (!voidReason || String(voidReason).trim().length < 10) {
      throw badRequest("A void reason of at least 10 characters is required");
    }
    const record = loadIncome(req.params.id);
    if (record.isVoided) throw badRequest("Record is already voided");

    update("ExternalIncome", record._id, {
      isVoided: true,
      voidedAt: nowIso(),
      voidedBy: user._id,
      voidReason: String(voidReason).trim(),
    });
    return ok({ record: populateMany(record, INCOME_LIST_REFS) }, "External income record voided successfully");
  });
}

export default function register(r) {
  registerExpenses(r);
  registerExternalIncome(r);
}
