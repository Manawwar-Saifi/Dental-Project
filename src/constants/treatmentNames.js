/**
 * Real treatment names, sourced from src/data/treatmentsData.js (the public
 * treatments-page content) so the admin's Treatment Name selector always
 * offers the SAME 15 treatments actually marketed on the public site --
 * titles copied verbatim (including "Wisdom Teeth" and "Mouth Ulcers", not
 * the longer "...Extraction"/"...Treatment" variants some earlier drafts
 * used, since those don't match the real page titles).
 *
 * Used by both AddAppointmentModal.jsx (create) and
 * TreatmentPlanDetailModal.jsx (Edit Treatment) so the two flows stay
 * consistent. "Other" is always appended as a fallback for anything not on
 * this list -- selecting it reveals a free-text field, same as before this
 * dropdown existed.
 */
export const TREATMENT_NAME_OPTIONS = [
  "Dental Implant",
  "Wisdom Teeth",
  "Cosmetic Dental Bonding",
  "Kids Dentistry",
  "Gum Disease Treatment",
  "Dentures",
  "Mouth Ulcers",
  "Smile Makeover",
  "Root Canal Treatment (RCT)",
  "Clear Aligners",
  "Laser Dentistry",
  "Dental Crowns and Bridges",
  "Dental Filling",
  "Teeth Whitening",
  "Braces",
];

// Sentinel value for the "Other" option -- never a real treatment name.
export const TREATMENT_NAME_OTHER = "__other__";

/** Select value for a given stored treatment name: the name itself if it's
 * one of the 15 presets, otherwise the "Other" sentinel (custom name). */
export const treatmentNameToChoice = (name) =>
  name && TREATMENT_NAME_OPTIONS.includes(name) ? name : TREATMENT_NAME_OTHER;
