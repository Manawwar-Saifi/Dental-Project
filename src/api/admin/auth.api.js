/**
 * Admin Auth API
 *
 * API functions for admin authentication.
 * Uses email/password login (different from patient OTP login).
 *
 * Endpoints:
 * - POST /auth/login - Login with email/password
 * - GET /auth/me - Get current admin profile
 * - POST /auth/logout - Logout admin
 */
import api from "../axios";

/**
 * Login admin with email and password
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise} - { admin, accessToken }
 */
export const loginAdmin = (email, password) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

/**
 * Get current admin profile
 * @returns {Promise} - Admin object
 */
export const getAdminProfile = () =>
  api.get("/auth/me").then((res) => res.data);

/**
 * Logout admin (invalidate token on server)
 * @returns {Promise}
 */
export const logoutAdmin = () =>
  api.post("/auth/logout").then((res) => res.data);

/**
 * Request a password reset link for an admin account
 * @param {string} email - Admin email
 * @returns {Promise}
 */
export const forgotAdminPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((res) => res.data);

/**
 * Reset an admin password using a token from the reset email
 * @param {string} token - Reset token from the email link
 * @param {string} newPassword - New password
 * @returns {Promise}
 */
export const resetAdminPassword = (token, newPassword) =>
  api.post("/auth/reset-password", { token, newPassword }).then((res) => res.data);
