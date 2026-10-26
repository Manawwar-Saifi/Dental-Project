/**
 * AUTH API
 *
 * Patient authentication.
 *
 * Current flow: WhatsApp OTP -- requestWhatsappOtp(phone) then
 * verifyWhatsappOtp(phone, otp). Password login is retained as a transition
 * fallback (loginWithPassword).
 *
 * The legacy EMAIL OTP endpoints (requestOtp / verifyOtp / resendOtp) have
 * been REMOVED: the backend now answers 410 Gone on them. They stored the code
 * in plaintext, had no attempt cap or rate limiting, and leaked account
 * enumeration. Nothing should call them again.
 */

import api from "./axios";

/**
 * Get current patient profile
 * @returns {Promise} - Patient data
 */
export const getMe = () =>
  api.get("/patients/me").then((res) => res.data);

/**
 * Login with password — accepts phone number OR email as identifier.
 * @param {string} identifier - Patient's 10-digit phone number or email address
 * @param {string} password - Password
 * @returns {Promise} - { patient, token }
 */
export const loginWithPassword = (identifier, password) =>
  api.post("/auth/patient/login-password", { identifier, password }).then((res) => res.data);

/**
 * WhatsApp OTP login -- the replacement for the shared default password.
 *
 * requestWhatsappOtp always resolves with the SAME generic message whether or
 * not the number is registered (deliberate: no phone-number enumeration
 * against real patient records), so the UI must never treat success as proof
 * the account exists.
 */
export const requestWhatsappOtp = (phone) =>
  api.post("/patients/auth/request-otp", { phone }).then((res) => res.data);

export const verifyWhatsappOtp = (phone, otp) =>
  api.post("/patients/auth/verify-otp", { phone, otp }).then((res) => res.data);

export const logoutPatient = () =>
  api.post("/auth/patient/logout").then((res) => res.data);

/**
 * Request a password reset link (works for patients and admins server-side;
 * patients receive a link to the public /reset-password page).
 * @param {string} email
 */
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((res) => res.data);

/**
 * Reset password using the emailed token.
 * @param {string} token
 * @param {string} newPassword
 */
export const resetPassword = (token, newPassword) =>
  api.post("/auth/reset-password", { token, newPassword }).then((res) => res.data);

/**
 * Change the logged-in patient's password.
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export const changePatientPassword = (currentPassword, newPassword) =>
  api
    .post("/auth/patient/change-password", { currentPassword, newPassword })
    .then((res) => res.data);
