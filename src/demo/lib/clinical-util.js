/**
 * Shared helpers for the clinical demo handlers (treatment/test catalog,
 * labs, lab orders, reports).
 */
import { findById, newId } from "../core/db.js";
import { DemoError, badRequest, notFound } from "../core/http.js";
import { currentPatient, currentUser } from "../core/auth.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** mongoose.Types.ObjectId.isValid, close enough for the demo. */
export const isValidId = (id) => typeof id === "string" && OBJECT_ID.test(id);

/**
 * Validate an :id param and load the document, the way every controller does:
 * 400 "Invalid ... ID" for a malformed id, 404 "<label> not found" otherwise.
 */
export function loadOr404(model, id, label, invalidMessage = `Invalid ${label.toLowerCase()} ID`) {
  if (!isValidId(id)) throw badRequest(invalidMessage);
  const doc = findById(model, id);
  if (!doc) throw notFound(label);
  return doc;
}

/** anyAuth: a staff user OR a patient. Returns { user, patient }. */
export function requireAnyAuth(req) {
  const user = currentUser(req);
  if (user && user.isActive !== false) return { user, patient: null };
  const patient = currentPatient(req);
  if (patient && patient.isActive !== false) return { user: null, patient };
  throw new DemoError(401, "Not authorized. Please log in.");
}

/** Mongoose Date cast -> ISO string (undefined/empty -> undefined). */
export function toIso(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Mongoose Number cast (keeps undefined/null as-is). */
export function toNum(value) {
  if (value === undefined || value === null || value === "") return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

/** parseIstDateRange(from, to) from the backend's utils/istDateRange.js. */
export function istDateRange(from, to) {
  const range = {};
  if (from) range.$gte = new Date(`${String(from).slice(0, 10)}T00:00:00.000+05:30`);
  if (to) range.$lte = new Date(`${String(to).slice(0, 10)}T23:59:59.999+05:30`);
  return range;
}

/** Give subdocuments an _id like Mongoose does for array subdocs. */
export const withSubId = (item) => ({ ...item, _id: item?._id || newId() });

/** First value of an Express query param that may be repeated. */
export const firstParam = (value) => (Array.isArray(value) ? value[0] : value);
