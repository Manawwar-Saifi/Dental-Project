/**
 * Shared helpers for the finance mocks (expenses, external income, P&L).
 */
import { all, findOne } from "../core/db.js";
import { requireUser } from "../core/auth.js";
import { DemoError, badRequest } from "../core/http.js";
import { istDateString, pick, populate, sortBy } from "../core/query.js";

const IST_OFFSET = "+05:30";
const dateOnly = (input) => String(input).slice(0, 10);

export const istStartOfDay = (input) => new Date(`${dateOnly(input)}T00:00:00.000${IST_OFFSET}`);
export const istEndOfDay = (input) => new Date(`${dateOnly(input)}T23:59:59.999${IST_OFFSET}`);

/** Same as backend utils/istDateRange.parseIstDateRange. */
export const parseIstDateRange = (from, to) => {
  const range = {};
  if (from) range.$gte = istStartOfDay(from);
  if (to) range.$lte = istEndOfDay(to);
  return range;
};

export const isObjectId = (value) => typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

/** authProtect + checkPermission(module, action): looks up the role's Permission doc. */
export function requirePermission(req, module, action) {
  const user = requireUser(req);
  const perm = findOne("Permission", (p) => p.role === user.role && p.module === module);
  if (!perm || !perm[action]) {
    throw new DemoError(403, `No ${action} permission for ${module}`);
  }
  return user;
}

/** IST-aware "is date in the future?" (expense.controller isFutureDate). */
export const isFutureDate = (dateStr) => String(dateStr).slice(0, 10) > istDateString(new Date());

/** Mongoose-style Date cast for a request value; 400 on garbage. */
export function toIsoDate(value, field = "date") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw badRequest(`Invalid ${field}`);
  return date.toISOString();
}

const USER_FIELDS = "name email role";

/** Chain several .populate() calls: [[path, model, select], ...]. */
export const populateMany = (doc, specs) =>
  specs.reduce((acc, [path, model, select]) => populate(acc, path, model, select), doc);

export const userRef = (path) => [path, "User", USER_FIELDS];

/** GET /expenses/staff and /external-income/staff. */
export const activeStaff = () =>
  sortBy(
    all("User").filter((u) => u.isActive === true),
    "name"
  ).map((u) => pick(u, "name email role"));

const MTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "05 Oct 2026" in IST (export formatting). */
export const fmtExportDate = (d) => {
  if (!d) return "";
  const [y, m, day] = istDateString(new Date(d)).split("-");
  return `${day} ${MTH[Number(m) - 1]} ${y}`;
};
