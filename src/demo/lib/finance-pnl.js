/**
 * Revenue / lab-cost / P&L computations ported from expense.controller.js
 * and utils/computeExternalIncomeTotal.js.
 */
import { all } from "../core/db.js";
import { istDateString, matches, sumBy, where } from "../core/query.js";
import { istEndOfDay, istStartOfDay, isObjectId, parseIstDateRange } from "./finance-common.js";

/** utils/computeExternalIncomeTotal: non-voided external income in range. */
export function computeExternalIncomeTotal({ from, to } = {}) {
  const match = { isVoided: false };
  if (from || to) match.date = parseIstDateRange(from, to);
  return sumBy(where("ExternalIncome", match), "amount");
}

/** Gross collected + refunds (+ external income), same as getBillingStats. */
export function computeRevenue({ from, to, clinic } = {}) {
  const paymentMatch = { status: { $in: ["paid", "refunded", "refund_pending"] } };
  if (from || to) paymentMatch.createdAt = parseIstDateRange(from, to);
  if (clinic && isObjectId(clinic)) paymentMatch.clinic = clinic;

  const voidedIds = where("Invoice", { isVoided: true }).map((i) => i._id);
  if (voidedIds.length > 0) {
    paymentMatch.invoice = { $nin: voidedIds };
    paymentMatch["settledInvoices.invoiceId"] = { $nin: voidedIds };
  }
  const grossRevenue = sumBy(where("Payment", paymentMatch), "amount");

  const refundMatch = {
    status: { $in: ["refunded", "refund_pending"] },
    "refund.amount": { $gt: 0 },
  };
  if (from || to) refundMatch["refund.refundedAt"] = parseIstDateRange(from, to);
  const totalRefunds = sumBy(where("Payment", refundMatch), "refund.amount");

  const externalIncome = computeExternalIncomeTotal({ from, to });

  return {
    grossRevenue: grossRevenue + externalIncome,
    totalRefunds,
    netRevenue: grossRevenue + externalIncome - totalRefunds,
    externalIncome,
  };
}

/** Cash-basis lab costs: LabOrder.paymentHistory[] entries dated in range. */
export function computeLabCosts({ from, to } = {}) {
  const range = from || to ? parseIstDateRange(from, to) : null;
  let total = 0;
  let count = 0;
  for (const order of all("LabOrder")) {
    for (const entry of order.paymentHistory || []) {
      if (range && !matches(entry, { date: range })) continue;
      total += Number(entry.amount) || 0;
      count += 1;
    }
  }
  return { labCosts: total, labPaymentCount: count };
}

const getPreviousPeriod = (from, to) => {
  if (!from || !to) return null;
  const start = istStartOfDay(from);
  const end = istEndOfDay(to);
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { from: istDateString(prevStart), to: istDateString(prevEnd) };
};

const expenseGroups = (match) => {
  const groups = {};
  for (const e of where("Expense", match)) {
    const g = (groups[e.category] ??= { _id: e.category, total: 0, count: 0 });
    g.total += Number(e.amount) || 0;
    g.count += 1;
  }
  return Object.values(groups).sort((a, b) => b.total - a.total);
};

/** GET /expenses/pnl data payload. */
export function computeProfitLoss({ from, to, clinic } = {}) {
  const { grossRevenue, totalRefunds, netRevenue, externalIncome } = computeRevenue({ from, to, clinic });
  const { labCosts, labPaymentCount } = computeLabCosts({ from, to });

  const expenseMatch = { isVoided: { $ne: true } };
  if (from || to) expenseMatch.date = parseIstDateRange(from, to);
  if (clinic && isObjectId(clinic)) expenseMatch.clinic = clinic;
  const expenseAgg = expenseGroups(expenseMatch);

  const labRows = expenseAgg.filter((e) => e._id === "lab");
  const nonLabRows = expenseAgg.filter((e) => e._id !== "lab");
  const labExpensesTotal = labRows.reduce((s, e) => s + e.total, 0);
  const labExpensesCount = labRows.reduce((s, e) => s + e.count, 0);

  const totalLabCosts = labCosts + labExpensesTotal;
  const totalOtherExpenses = nonLabRows.reduce((s, e) => s + e.total, 0);
  const totalExpenses = totalLabCosts + totalOtherExpenses;
  const netProfit = netRevenue - totalExpenses;

  const expenseBreakdown = nonLabRows.map((e) => ({
    category: e._id,
    total: e.total,
    count: e.count,
    pct: totalExpenses > 0 ? Math.round((e.total / totalExpenses) * 100) : 0,
  }));

  const labBreakdown =
    totalLabCosts > 0
      ? {
          category: "lab_orders",
          label: "Lab Orders (paid)",
          total: totalLabCosts,
          count: labPaymentCount + labExpensesCount,
          pct: totalExpenses > 0 ? Math.round((totalLabCosts / totalExpenses) * 100) : 0,
        }
      : null;

  const unpaidLabMatch = { paymentStatus: { $in: ["unpaid", "partially_paid"] } };
  if (from || to) unpaidLabMatch.orderDate = parseIstDateRange(from, to);
  const unpaidLabOrders = where("LabOrder", unpaidLabMatch);

  const prevRange = getPreviousPeriod(from, to);
  let previousPeriod = null;
  if (prevRange) {
    const prevRevenue = computeRevenue({ ...prevRange, clinic });
    const prevLab = computeLabCosts(prevRange);
    const prevMatch = { isVoided: { $ne: true }, date: parseIstDateRange(prevRange.from, prevRange.to) };
    if (clinic && isObjectId(clinic)) prevMatch.clinic = clinic;
    const prevAgg = expenseGroups(prevMatch);
    const prevLabExp = prevAgg.filter((e) => e._id === "lab").reduce((s, e) => s + e.total, 0);
    const prevOtherExp = prevAgg.filter((e) => e._id !== "lab").reduce((s, e) => s + e.total, 0);
    const prevTotalExp = prevLab.labCosts + prevLabExp + prevOtherExp;
    const prevNetProfit = prevRevenue.netRevenue - prevTotalExp;
    const pct = (curr, prev) => (prev === 0 ? null : Math.round(((curr - prev) / Math.abs(prev)) * 100));

    previousPeriod = {
      from: prevRange.from,
      to: prevRange.to,
      netRevenue: prevRevenue.netRevenue,
      totalExpenses: prevTotalExp,
      netProfit: prevNetProfit,
      changes: {
        netRevenuePct: pct(netRevenue, prevRevenue.netRevenue),
        totalExpensesPct: pct(totalExpenses, prevTotalExp),
        netProfitPct: pct(netProfit, prevNetProfit),
      },
    };
  }

  return {
    period: { from: from || null, to: to || null },
    revenue: { gross: grossRevenue, refunds: totalRefunds, net: netRevenue, externalIncome },
    expenses: {
      lab: totalLabCosts,
      labOrderPayments: labCosts,
      other: totalOtherExpenses,
      total: totalExpenses,
      breakdown: labBreakdown ? [labBreakdown, ...expenseBreakdown] : expenseBreakdown,
    },
    netProfit,
    unpaidLab: {
      count: unpaidLabOrders.length,
      balanceDue: sumBy(unpaidLabOrders, "balanceDue"),
    },
    previousPeriod,
  };
}
