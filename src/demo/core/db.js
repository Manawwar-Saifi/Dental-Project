/**
 * In-memory stand-in for MongoDB, used by the demo build.
 *
 * Collections are keyed by Mongoose model name ("Patient", "Appointment", ...)
 * and hold plain documents shaped exactly like the raw Mongo documents in
 * src/demo/data/<ModelName>.json: string ObjectIds, ISO date strings and
 * unpopulated refs. Handlers read the arrays directly and write through
 * insert/update/remove so _id and timestamps stay consistent.
 *
 * The dataset is authored around a fixed anchor date (_meta.json). On load,
 * every date is shifted by (today - anchor) whole days so the demo always
 * looks "live": today's appointments are today, follow-ups are upcoming, etc.
 *
 * Everything lives in memory only and resets on page reload.
 */

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

let collections = {};
let meta = {};
let idCounter = Math.floor(Math.random() * 0xffffff);

/** YYYY-MM-DD of the given instant in IST (the clinic's timezone). */
const istDateString = (date) =>
  new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const shiftDates = (value, shiftMs) => {
  if (typeof value === "string") {
    if (ISO_DATETIME.test(value)) {
      return new Date(Date.parse(value) + shiftMs).toISOString();
    }
    if (ISO_DATE.test(value)) {
      return new Date(Date.parse(`${value}T00:00:00.000Z`) + shiftMs)
        .toISOString()
        .slice(0, 10);
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => shiftDates(v, shiftMs));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = shiftDates(v, shiftMs);
    return out;
  }
  return value;
};

/**
 * Load the dataset. `raw` maps model name -> array of documents.
 * Pass `today` equal to the anchor date to disable shifting (used when
 * diffing against the real backend, whose DB holds the unshifted data).
 */
export function initDb(raw, { meta: rawMeta = {}, today = new Date() } = {}) {
  const anchor = rawMeta.anchorDate;
  const shiftMs = anchor
    ? Date.parse(`${istDateString(today)}T00:00:00.000Z`) -
      Date.parse(`${anchor}T00:00:00.000Z`)
    : 0;

  collections = {};
  for (const [model, docs] of Object.entries(raw)) {
    collections[model] = shiftMs
      ? shiftDates(docs, shiftMs)
      : JSON.parse(JSON.stringify(docs));
  }
  meta = { ...rawMeta, shiftDays: Math.round(shiftMs / DAY_MS) };
}

/** Dataset metadata (_meta.json) plus `shiftDays`. */
export const getMeta = () => meta;

/** The live array for a model. Mutating it mutates the "database". */
export const all = (model) => (collections[model] ??= []);

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

export const findById = (model, id) =>
  all(model).find((doc) => sameId(doc._id, id)) || null;

export const findOne = (model, predicate) => all(model).find(predicate) || null;

/** A fresh 24-hex ObjectId whose timestamp part is `date` (default now). */
export function newId(date = new Date()) {
  const seconds = Math.floor(date.getTime() / 1000).toString(16).padStart(8, "0");
  let random = "";
  for (let i = 0; i < 10; i++) random += Math.floor(Math.random() * 16).toString(16);
  idCounter = (idCounter + 1) % 0xffffff;
  return seconds + random + idCounter.toString(16).padStart(6, "0");
}

export const nowIso = () => new Date().toISOString();

/** Insert a document, filling _id/createdAt/updatedAt like Mongoose would. */
export function insert(model, doc) {
  const stamp = nowIso();
  const saved = { _id: newId(), createdAt: stamp, updatedAt: stamp, ...doc };
  all(model).push(saved);
  return saved;
}

/** Shallow-merge `patch` into a document and bump updatedAt. */
export function update(model, id, patch) {
  const doc = findById(model, id);
  if (!doc) return null;
  Object.assign(doc, patch, { updatedAt: nowIso() });
  return doc;
}

/** Remove a document; returns it (or null if it did not exist). */
export function remove(model, id) {
  const list = all(model);
  const index = list.findIndex((doc) => sameId(doc._id, id));
  if (index === -1) return null;
  return list.splice(index, 1)[0];
}
