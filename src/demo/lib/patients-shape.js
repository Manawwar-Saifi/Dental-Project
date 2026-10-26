/**
 * Patient serialisation for the demo: mirrors Patient's toJSON
 * ({ virtuals: true }) — hasMembership, currentDiscount, calculatedAge, id —
 * and drops select:false fields (password, loginOtp).
 */
import { findById } from "../core/db.js";
import { pick } from "../core/query.js";

export const hasActiveMembership = (patient) =>
  Boolean(
    patient?.membership?.status === "active" &&
      patient.membership.expiryDate &&
      Date.parse(patient.membership.expiryDate) > Date.now()
  );

export const currentDiscount = (patient) =>
  hasActiveMembership(patient) ? patient.membership.discountPercent || 0 : 0;

const calculatedAge = (patient) => {
  if (!patient?.dateOfBirth) return null;
  const diff = Date.now() - Date.parse(patient.dateOfBirth);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

/** Full patient document as res.json() would send it. */
export function patientJSON(patient) {
  if (!patient) return patient;
  // eslint-disable-next-line no-unused-vars
  const { password, loginOtp, otp, resetPasswordToken, resetPasswordExpires, ...rest } = patient;
  return {
    ...rest,
    hasMembership: hasActiveMembership(patient),
    currentDiscount: currentDiscount(patient),
    calculatedAge: calculatedAge(patient),
    id: String(patient._id),
  };
}

/**
 * A populated patient ref (.populate("patient", select)) with virtuals.
 * Virtuals are computed from the full stored document so they are meaningful.
 */
export function populatedPatient(ref, select) {
  if (ref == null) return null;
  if (typeof ref === "object") return ref;
  const doc = findById("Patient", ref);
  if (!doc) return null;
  const out = select ? pick(doc, select.replace(/\b(hasMembership|currentDiscount)\b/g, "")) : patientJSON(doc);
  return {
    ...out,
    hasMembership: hasActiveMembership(doc),
    currentDiscount: currentDiscount(doc),
    calculatedAge: calculatedAge(doc),
    id: String(doc._id),
  };
}
