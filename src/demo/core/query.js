/**
 * Mongo/Mongoose-flavoured query helpers so demo handlers can port backend
 * controller logic almost line for line:
 *
 *   where("Appointment", { patient: id, status: { $in: ["scheduled"] } })
 *   sortBy(list, "-appointmentDate")      // same spec as .sort()
 *   paginate(list, req.query, 20)         // same defaults as the controller
 *   populate(doc, "patient", "Patient", "name phone email")
 *
 * Values are compared the way Mongo would: ids as strings, dates (Date or ISO
 * string) by timestamp, arrays match when any element matches.
 */
import { all, findById } from "./db.js";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DATE_LIKE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z)?$/;

// ---------------------------------------------------------------- values

/** String id of an ObjectId string or a populated document. */
export const asId = (value) =>
  value == null ? value : typeof value === "object" ? String(value._id) : String(value);

export const sameId = (a, b) => a != null && b != null && asId(a) === asId(b);

const comparable = (value) => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" && DATE_LIKE.test(value)) return Date.parse(value);
  if (value && typeof value === "object" && "_id" in value) return String(value._id);
  return value;
};

const equals = (a, b) => {
  const x = comparable(a);
  const y = comparable(b);
  if (x === y) return true;
  if (typeof x === "object" && typeof y === "object" && x && y) {
    return JSON.stringify(x) === JSON.stringify(y);
  }
  return false;
};

const compare = (a, b) => {
  const x = comparable(a);
  const y = comparable(b);
  if (x == null && y == null) return 0;
  if (x == null) return -1;
  if (y == null) return 1;
  if (typeof x === "number" && typeof y === "number") return x - y;
  if (typeof x === "boolean" && typeof y === "boolean") return Number(x) - Number(y);
  return String(x).localeCompare(String(y));
};

/** Plain dotted-path read (no array fan-out). */
export function get(obj, path) {
  let value = obj;
  for (const part of path.split(".")) {
    if (value == null) return undefined;
    value = value[part];
  }
  return value;
}

/** Every value a Mongo query on `path` would test, fanning out through arrays. */
function candidates(doc, path) {
  let current = [doc];
  for (const part of path.split(".")) {
    const next = [];
    for (const value of current) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        if (/^\d+$/.test(part)) next.push(value[Number(part)]);
        else for (const item of value) if (item && typeof item === "object") next.push(item[part]);
      } else if (typeof value === "object") {
        next.push(value[part]);
      }
    }
    current = next;
  }
  if (current.length === 0) current = [undefined];
  const out = [];
  for (const value of current) {
    out.push(value);
    if (Array.isArray(value)) out.push(...value);
  }
  return out;
}

// ---------------------------------------------------------------- matching

const isOperatorObject = (cond) =>
  cond &&
  typeof cond === "object" &&
  !Array.isArray(cond) &&
  !(cond instanceof Date) &&
  !(cond instanceof RegExp) &&
  Object.keys(cond).length > 0 &&
  Object.keys(cond).every((k) => k.startsWith("$"));

const toRegExp = (pattern, options = "") =>
  pattern instanceof RegExp ? pattern : new RegExp(pattern, options);

const testRegex = (regex, value) => typeof value === "string" && regex.test(value);

function matchCondition(values, cond) {
  if (cond instanceof RegExp) return values.some((v) => testRegex(cond, v));

  if (!isOperatorObject(cond)) {
    if (cond === null) return values.some((v) => v == null);
    return values.some((v) => equals(v, cond));
  }

  for (const [op, arg] of Object.entries(cond)) {
    switch (op) {
      case "$eq":
        if (!matchCondition(values, arg)) return false;
        break;
      case "$ne":
        if (matchCondition(values, arg)) return false;
        break;
      case "$in":
        if (
          !arg.some((item) =>
            item instanceof RegExp
              ? values.some((v) => testRegex(item, v))
              : item === null
                ? values.some((v) => v == null)
                : values.some((v) => equals(v, item))
          )
        )
          return false;
        break;
      case "$nin":
        if (matchCondition(values, { $in: arg })) return false;
        break;
      case "$gt":
        if (!values.some((v) => v != null && compare(v, arg) > 0)) return false;
        break;
      case "$gte":
        if (!values.some((v) => v != null && compare(v, arg) >= 0)) return false;
        break;
      case "$lt":
        if (!values.some((v) => v != null && compare(v, arg) < 0)) return false;
        break;
      case "$lte":
        if (!values.some((v) => v != null && compare(v, arg) <= 0)) return false;
        break;
      case "$exists":
        if (Boolean(arg) !== values.some((v) => v !== undefined)) return false;
        break;
      case "$regex": {
        const regex = toRegExp(arg, cond.$options || "");
        if (!values.some((v) => testRegex(regex, v))) return false;
        break;
      }
      case "$options":
        break;
      case "$size":
        if (!values.some((v) => Array.isArray(v) && v.length === arg)) return false;
        break;
      case "$elemMatch":
        if (
          !values.some(
            (v) =>
              Array.isArray(v) &&
              v.some((el) =>
                el && typeof el === "object" && !isOperatorObject(arg)
                  ? matches(el, arg)
                  : matchCondition([el], arg)
              )
          )
        )
          return false;
        break;
      case "$not":
        if (matchCondition(values, arg)) return false;
        break;
      default:
        throw new Error(`[demo] Unsupported query operator ${op}`);
    }
  }
  return true;
}

/** Does `doc` satisfy a Mongo-style filter? Undefined conditions are ignored, as in Mongoose. */
export function matches(doc, filter = {}) {
  for (const [key, cond] of Object.entries(filter)) {
    if (cond === undefined) continue;
    if (key === "$or") {
      if (!cond.some((f) => matches(doc, f))) return false;
    } else if (key === "$and") {
      if (!cond.every((f) => matches(doc, f))) return false;
    } else if (key === "$nor") {
      if (cond.some((f) => matches(doc, f))) return false;
    } else if (!matchCondition(candidates(doc, key), cond)) {
      return false;
    }
  }
  return true;
}

/** Model.find(filter) — `source` is a model name or an array. */
export const where = (source, filter = {}) =>
  (typeof source === "string" ? all(source) : source).filter((doc) => matches(doc, filter));

/** Model.findOne(filter). */
export const findWhere = (source, filter = {}) =>
  (typeof source === "string" ? all(source) : source).find((doc) => matches(doc, filter)) ||
  null;

/** Model.countDocuments(filter). */
export const count = (source, filter = {}) => where(source, filter).length;

// ---------------------------------------------------------------- sorting & paging

/** Copy of `list` sorted by a Mongoose sort spec: "-createdAt name" or { createdAt: -1 }. */
export function sortBy(list, spec) {
  const fields =
    typeof spec === "string"
      ? spec
          .split(/\s+/)
          .filter(Boolean)
          .map((f) => (f.startsWith("-") ? [f.slice(1), -1] : [f, 1]))
      : Object.entries(spec).map(([f, dir]) => [f, dir === "desc" || dir === -1 ? -1 : 1]);
  return [...list].sort((a, b) => {
    for (const [field, dir] of fields) {
      const result = compare(get(a, field), get(b, field));
      if (result !== 0) return result * dir;
    }
    return 0;
  });
}

/** page/limit/skip the way the controllers parse them (parseInt with a default). */
export function pageParams(query = {}, defaultLimit = 10) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = parseInt(query.limit, 10) || defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}

/** Slice a list for one page; pass the result to http.paginated(items, result). */
export function paginate(list, query = {}, defaultLimit = 10) {
  const { page, limit, skip } = pageParams(query, defaultLimit);
  return { items: list.slice(skip, skip + limit), page, limit, total: list.length };
}

// ---------------------------------------------------------------- projection & populate

/** Mongoose .select(): "name email" (includes _id) or "-password -__v". */
export function pick(doc, select) {
  if (!doc || !select) return doc;
  const fields = select.split(/\s+/).filter(Boolean);
  const exclude = fields.filter((f) => f.startsWith("-")).map((f) => f.slice(1));
  const include = fields.filter((f) => !f.startsWith("-") && !f.startsWith("+"));

  if (include.length === 0) {
    const out = { ...doc };
    for (const field of exclude) delete out[field];
    return out;
  }
  const out = exclude.includes("_id") ? {} : { _id: doc._id };
  for (const field of include) {
    const value = get(doc, field);
    if (value === undefined) continue;
    const parts = field.split(".");
    let target = out;
    for (const part of parts.slice(0, -1)) target = target[part] ??= {};
    target[parts[parts.length - 1]] = value;
  }
  return out;
}

function resolveRef(value, model, select) {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.map((v) => resolveRef(v, model, select)).filter((v) => v !== null);
  }
  if (typeof value === "object") return value; // already populated
  const ref = findById(model, value);
  return ref ? pick(ref, select) : null;
}

function populatePath(target, parts, model, select) {
  if (parts.length === 0) return resolveRef(target, model, select);
  if (target == null) return target;
  if (Array.isArray(target)) return target.map((t) => populatePath(t, parts, model, select));
  if (typeof target !== "object") return target;
  const [head, ...rest] = parts;
  if (!(head in target)) return target;
  return { ...target, [head]: populatePath(target[head], rest, model, select) };
}

/**
 * Mongoose .populate(path, select). Returns a copy; the stored doc is untouched.
 * Works through arrays ("items.treatment"), and missing refs become null
 * (or are dropped from arrays), like Mongoose.
 */
export const populate = (doc, path, model, select) =>
  doc == null ? doc : populatePath(doc, path.split("."), model, select);

/** populate() over a list. */
export const populateAll = (list, path, model, select) =>
  list.map((doc) => populate(doc, path, model, select));

// ---------------------------------------------------------------- search

export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** { $or: [{ field: /term/i }, ...] } — the usual controller search clause. */
export const searchFilter = (term, fields) => {
  if (!term) return {};
  const regex = new RegExp(escapeRegex(term), "i");
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

// ---------------------------------------------------------------- aggregation-ish

const accessor = (key) => (typeof key === "function" ? key : (doc) => get(doc, key));

export const sumBy = (list, key) => {
  const read = accessor(key);
  return list.reduce((total, doc) => total + (Number(read(doc)) || 0), 0);
};

export const groupBy = (list, key) => {
  const read = accessor(key);
  const groups = {};
  for (const doc of list) (groups[String(read(doc))] ??= []).push(doc);
  return groups;
};

export const countBy = (list, key) =>
  Object.fromEntries(Object.entries(groupBy(list, key)).map(([k, v]) => [k, v.length]));

// ---------------------------------------------------------------- dates (IST)

export { IST_OFFSET_MS };

/** "YYYY-MM-DD" of an instant in IST. */
export const istDateString = (date = new Date()) =>
  new Date(new Date(date).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

/** UTC instants bounding the IST calendar day that contains `date` (or a "YYYY-MM-DD" string). */
export function istDayRange(date = new Date()) {
  const day = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : istDateString(date);
  const start = new Date(Date.parse(`${day}T00:00:00.000Z`) - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

/** Number query param with fallback (Express gives strings). */
export const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** "true"/"false" query param -> boolean, undefined otherwise. */
export const toBool = (value) =>
  value === true || value === "true" ? true : value === false || value === "false" ? false : undefined;
