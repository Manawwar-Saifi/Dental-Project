/**
 * Demo auth. The mock issues opaque tokens "demo.<type>.<id>" (type "admin"
 * for staff users, "patient" for patients — the same `type` the backend puts
 * in its JWT). The frontend stores and sends them exactly like real JWTs.
 */
import { findById } from "./db.js";
import { DemoError } from "./http.js";

export const makeToken = (type, id) => `demo.${type}.${id}`;

export function readToken(req) {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [prefix, type, id] = token.split(".");
  return prefix === "demo" && type && id ? { type, id } : null;
}

/** The logged-in staff User document, or null. */
export function currentUser(req) {
  const token = readToken(req);
  return token?.type === "admin" ? findById("User", token.id) : null;
}

/** The logged-in Patient document, or null. */
export function currentPatient(req) {
  const token = readToken(req);
  return token?.type === "patient" ? findById("Patient", token.id) : null;
}

/** Like authProtect (+ optional role check). Returns the User. */
export function requireUser(req, ...roles) {
  const user = currentUser(req);
  if (!user || user.isActive === false) {
    throw new DemoError(401, "Not authorized. Please log in.");
  }
  if (roles.length && !roles.includes(user.role)) {
    throw new DemoError(403, "You do not have permission to perform this action");
  }
  return user;
}

/** Like patientProtect. Returns the Patient. */
export function requirePatient(req) {
  const patient = currentPatient(req);
  if (!patient || patient.isActive === false) {
    throw new DemoError(401, "Not authorized. Please log in.");
  }
  return patient;
}
