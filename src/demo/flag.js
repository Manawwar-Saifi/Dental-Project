// True for the portfolio demo build (`vite --mode demo`): every API call is
// answered by the in-browser mock in src/demo instead of the real backend.
// MODE is replaced at build time, so in a normal build this is a literal
// `false` and the mock (and its JSON dataset) is tree-shaken out entirely.
export const IS_DEMO = import.meta.env.MODE === "demo";

// Pre-filled on the login pages in the demo build (same accounts as
// src/demo/data/_meta.json). Folds to null in a normal build.
export const DEMO_LOGIN = IS_DEMO
  ? { adminEmail: "admin@example.com", patientPhone: "9876543210", password: "Demo@123", otp: "123456" }
  : null;
