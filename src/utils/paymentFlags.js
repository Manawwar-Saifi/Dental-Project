// Reversible kill-switch for online (Razorpay) payment on the PUBLIC site only.
// Default (unset or anything other than the literal string "false") = online
// payments work exactly as today. Set VITE_ONLINE_PAYMENTS_ENABLED=false in
// the frontend's Vercel project env vars to disable, no code changes needed
// to re-enable -- just remove/flip that env var and redeploy.
export const ONLINE_PAYMENTS_ENABLED = import.meta.env.VITE_ONLINE_PAYMENTS_ENABLED !== "false";
