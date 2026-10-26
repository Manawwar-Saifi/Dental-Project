/**
 * Shared helpers for native <input type="date"> fields.
 *
 * - MAX_DATE caps the year to exactly 4 digits (prevents 5-digit years).
 * - todayStr() is the earliest selectable date for forward-looking pickers.
 * - dateGuards blocks arrow-key and mouse-wheel value changes, mirroring the
 *   hardening applied to numeric inputs elsewhere.
 */

// Year is capped at 4 digits by bounding the max selectable date.
export const MAX_DATE = "9999-12-31";

// Today as yyyy-mm-dd in the BROWSER'S LOCAL timezone (e.g. IST), not UTC.
// (toISOString() would shift the calendar date near midnight in +05:30.)
export const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate(),
  ).padStart(2, "0")}`;
};

// True when a yyyy-mm-dd value is before the local today.
export const isPastDate = (value) => !!value && value < todayStr();

// True when "HH:MM" slot is at/before the current local time, but only when the
// given date is today. Uses the browser clock, so it's correct for the user's
// timezone regardless of the server's timezone.
export const isPastSlotForDate = (dateStr, slot) => {
  if (!dateStr || dateStr !== todayStr()) return false;
  const [h, m] = String(slot).split(":").map(Number);
  const now = new Date();
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
};

// Prevent ArrowUp/ArrowDown and scroll wheel from mutating a date input.
export const dateGuards = {
  onKeyDown: (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
  },
  onWheel: (e) => e.currentTarget.blur(),
};
