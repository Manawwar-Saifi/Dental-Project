/**
 * The demo API server: an Express-like router whose handlers run in the
 * browser (or in Node for testing) against the in-memory db.
 *
 * Handler modules (src/demo/handlers/*.js) default-export a register function:
 *
 *   export default function register(r) {
 *     r.get("/patients/:id", (req) => ok(findById("Patient", req.params.id)));
 *   }
 *
 * Paths are relative to /api, exactly as in the backend's routes.js. When
 * several routes match, the most specific wins (static segments beat
 * :params), so registration order across files does not matter.
 *
 * req = { method, path, params, query, body, files, headers }
 *   query  — strings/arrays of strings, like Express
 *   body   — parsed JSON, or a plain object built from FormData
 *   files  — File objects from a FormData body
 */
import { initDb } from "./db.js";
import { DemoError, NOT_IN_DEMO_MESSAGE, isResponse, respond } from "./http.js";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function compile(method, pattern, handler) {
  const segments = pattern.split("/").filter(Boolean);
  return { method, pattern, segments, handler };
}

function matchRoute(route, parts) {
  if (route.segments.length !== parts.length) return null;
  const params = {};
  for (let i = 0; i < parts.length; i++) {
    const segment = route.segments[i];
    if (segment.startsWith(":")) params[segment.slice(1)] = decodeURIComponent(parts[i]);
    else if (segment !== parts[i]) return null;
  }
  return params;
}

/** Static segments outrank params, compared left to right. */
const specificity = (route) => route.segments.map((s) => (s.startsWith(":") ? 1 : 2));

const moreSpecific = (a, b) => {
  const x = specificity(a);
  const y = specificity(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

function normalizeQuery(searchParams, params) {
  const query = {};
  const addPairs = (pairs) => {
    for (const [key, value] of pairs) {
      const name = key.endsWith("[]") ? key.slice(0, -2) : key;
      if (name in query) query[name] = [].concat(query[name], value);
      else query[name] = key.endsWith("[]") ? [value] : value;
    }
  };
  addPairs(searchParams);
  // Some api modules hand axios a URLSearchParams instead of a plain object.
  if (params instanceof URLSearchParams) {
    addPairs(params.entries());
    return query;
  }
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null) continue;
    query[key] = stringifyParam(value);
  }
  return query;
}

/** axios params -> what Express's query parser would hand the controller. */
function stringifyParam(value) {
  if (Array.isArray(value)) return value.map(stringifyParam);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stringifyParam(v)]));
  }
  return String(value);
}

function normalizeBody(data) {
  if (data == null || data === "") return { body: {}, files: [] };
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const body = {};
    const files = [];
    for (const [key, value] of data.entries()) {
      if (typeof File !== "undefined" && value instanceof File) files.push(value);
      else if (key in body) body[key] = [].concat(body[key], value);
      else body[key] = value;
    }
    return { body, files };
  }
  if (typeof data === "string") {
    try {
      return { body: JSON.parse(data), files: [] };
    } catch {
      return { body: data, files: [] };
    }
  }
  return { body: data, files: [] };
}

const lowerCaseKeys = (headers = {}) =>
  Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));

/** Serialize like res.json(): drops undefined, turns Dates into ISO strings, detaches from the db. */
const toWire = (body) =>
  body === undefined || (typeof Blob !== "undefined" && body instanceof Blob)
    ? body
    : JSON.parse(JSON.stringify(body));

/**
 * @param {object} options
 * @param {Record<string, object[]>} options.data   model name -> documents
 * @param {object} options.meta                      contents of _meta.json
 * @param {Function[]} options.handlers              register functions
 * @param {Date} [options.today]                     "now" for date shifting
 */
export function createDemoServer({ data, meta, handlers, today }) {
  initDb(data, { meta, today });

  const routes = [];
  const router = {};
  for (const method of METHODS) {
    router[method.toLowerCase()] = (pattern, handler) => routes.push(compile(method, pattern, handler));
  }
  for (const register of handlers) register(router);

  /**
   * Handle one request. `url` is relative to /api ("/patients?page=2") or a
   * full URL whose path starts with /api.
   * Resolves to { status, body, headers } — never rejects.
   */
  async function request({ method = "GET", url = "/", params, data: rawBody, headers = {} }) {
    const parsed = new URL(url, "http://demo.local/api/");
    let path = parsed.pathname.replace(/\/+$/, "") || "/";
    if (path === "/api" || path.startsWith("/api/")) path = path.slice(4) || "/";

    const upper = method.toUpperCase();
    const parts = path.split("/").filter(Boolean);
    let best = null;
    for (const route of routes) {
      if (route.method !== upper) continue;
      const routeParams = matchRoute(route, parts);
      if (routeParams && (!best || moreSpecific(route, best.route) > 0)) {
        best = { route, params: routeParams };
      }
    }

    if (!best) {
      console.warn(`[demo] No mock for ${upper} /api${path}`);
      // Unmocked actions read as "not in the demo" rather than a broken route.
      return upper === "GET"
        ? { status: 404, body: { success: false, message: `Route /api${path} not found` }, headers: {} }
        : { status: 400, body: { success: false, message: NOT_IN_DEMO_MESSAGE }, headers: {} };
    }

    const { body, files } = normalizeBody(rawBody);
    const req = {
      method: upper,
      path,
      params: best.params,
      query: normalizeQuery(parsed.searchParams, params),
      body,
      files,
      headers: lowerCaseKeys(headers),
    };

    try {
      const result = await best.route.handler(req);
      const response = isResponse(result) ? result : respond(200, result);
      return { status: response.status, body: toWire(response.body), headers: response.headers };
    } catch (error) {
      if (error instanceof DemoError) {
        return {
          status: error.status,
          body: { success: false, status: String(error.status).startsWith("4") ? "fail" : "error", message: error.message, errors: error.errors },
          headers: {},
        };
      }
      console.error(`[demo] ${upper} /api${path} handler crashed`, error);
      return { status: 500, body: { success: false, message: error.message || "Something went wrong" }, headers: {} };
    }
  }

  return { request, routes };
}
