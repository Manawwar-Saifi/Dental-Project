/**
 * Auth: staff login (any active User + Demo@123), patient password login,
 * WhatsApp OTP login (code 123456), me/logout/password routes.
 * Ports src/modules/auth/auth.controller.js.
 */
import { findById, update, nowIso } from "../core/db.js";
import { DemoError, ok, respond, notInDemo } from "../core/http.js";
import { makeToken, requireUser, requirePatient } from "../core/auth.js";
import { findWhere, populate } from "../core/query.js";
import {
  DEMO_OTP,
  cleanUser,
  passwordMatches,
  patientLoginData,
  serializePatient,
  setPassword,
} from "../lib/access-common.js";

const error = (status, message, errors = null) => new DemoError(status, message, errors);

const strongEnough = (pw) => pw.length >= 10 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);

const OTP_REQUEST_GENERIC =
  "If this number is registered with us, you'll receive a login code on WhatsApp within a minute. Didn't receive it? Please check the number, or call us at +91-9467776028.";
const OTP_MAX_ATTEMPTS = 5;
const otpAttempts = new Map(); // phone -> wrong attempts

const retired = () =>
  respond(410, {
    success: false,
    message:
      "Email OTP login has been retired. Please log in with the code sent to your WhatsApp, or use your password.",
  });

export default function register(r) {
  // ---------------------------------------------------------------- staff
  r.post("/auth/login", (req) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw error(400, "Please provide email and password");

    const user = findWhere("User", { email: String(email).toLowerCase().trim() });
    if (!user || !user.isActive || !passwordMatches("User", user._id, password)) {
      throw error(401, "Invalid email or password");
    }
    update("User", user._id, { lastLogin: nowIso() });

    const token = makeToken("admin", user._id);
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    return ok({ user: userData, token }, "Login successful");
  });

  r.get("/auth/me", (req) => {
    const user = requireUser(req);
    return ok({ user: cleanUser(user) }, "User data retrieved");
  });

  r.post("/auth/logout", (req) => {
    requireUser(req);
    return ok(null, "Logged out successfully");
  });

  r.post("/auth/change-password", (req) => {
    const user = requireUser(req);
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      throw error(400, "Please provide current and new password");
    }
    if (!passwordMatches("User", user._id, currentPassword)) {
      throw error(401, "Current password is incorrect");
    }
    if (!strongEnough(newPassword)) {
      throw error(
        400,
        "New password must be at least 10 characters and include at least one letter and one number",
      );
    }
    setPassword("User", user._id, newPassword);
    return ok(null, "Password changed successfully");
  });

  r.post("/auth/forgot-password", (req) => {
    const { email } = req.body || {};
    if (!email) throw error(400, "Please provide email");
    // No email is sent in the demo.
    return ok(null, "If email exists, a reset link will be sent");
  });

  r.post("/auth/reset-password", (req) => {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) throw error(400, "Please provide token and new password");
    if (!strongEnough(newPassword)) {
      throw error(
        400,
        "Password must be at least 10 characters and include at least one letter and one number",
      );
    }
    // Reset links are emailed in the real app; the demo never issues one.
    throw notInDemo("Password reset links aren't sent in the demo. Log in with the demo password Demo@123.");
  });

  r.post("/auth/refresh-token", (req) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) throw error(400, "Refresh token is required");
    throw error(401, "Invalid refresh token");
  });

  // ---------------------------------------------------------------- patient
  r.post("/auth/patient/login", retired);
  r.post("/auth/patient/verify-otp", retired);
  r.post("/auth/patient/resend-otp", retired);

  r.post("/auth/patient/login-password", (req) => {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      throw error(400, "Please provide your phone number or email, and password");
    }
    const trimmed = String(identifier).trim();
    const isPhone = /^[6-9]\d{9}$/.test(trimmed);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isPhone && !isEmail) {
      throw error(400, "Please enter a valid 10-digit phone number or email address");
    }
    const patient = findWhere("Patient", isPhone ? { phone: trimmed } : { email: trimmed.toLowerCase() });
    if (!patient || patient.isActive === false || !passwordMatches("Patient", patient._id, password)) {
      throw error(401, "Invalid credentials");
    }
    const token = makeToken("patient", patient._id);
    return ok({ patient: patientLoginData(patient), token }, "Login successful");
  });

  r.get("/auth/patient/me", (req) => {
    const patient = requirePatient(req);
    const doc = populate(serializePatient(patient), "preferredClinic", "Clinic", "name code");
    return ok({ patient: doc }, "Patient data retrieved");
  });

  r.post("/auth/patient/change-password", (req) => {
    const patient = requirePatient(req);
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      throw error(400, "Please provide current and new password");
    }
    if (!passwordMatches("Patient", patient._id, currentPassword)) {
      throw error(401, "Current password is incorrect");
    }
    if (!strongEnough(newPassword)) {
      throw error(
        400,
        "New password must be at least 10 characters and include at least one letter and one number",
      );
    }
    setPassword("Patient", patient._id, newPassword);
    return ok(null, "Password updated successfully");
  });

  r.post("/auth/patient/logout", (req) => {
    requirePatient(req);
    return ok(null, "Logged out successfully");
  });

  // ---------------------------------------------------------------- WhatsApp OTP (patients module)
  r.post("/patients/auth/request-otp", (req) => {
    const trimmed = String(req.body?.phone || "").trim();
    if (!/^[6-9]\d{9}$/.test(trimmed)) {
      throw error(400, "Please enter a valid 10-digit phone number");
    }
    otpAttempts.delete(trimmed);
    // Nothing is sent in the demo; every registered number accepts 123456.
    return ok({ otpSent: true }, OTP_REQUEST_GENERIC);
  });

  r.post("/patients/auth/verify-otp", (req) => {
    const trimmed = String(req.body?.phone || "").trim();
    const submitted = String(req.body?.otp || "").trim();
    if (!trimmed || !submitted) {
      throw error(400, "Please provide your phone number and the code");
    }
    const GENERIC_INVALID = "That code is invalid or has expired. Please request a new one.";
    const patient = findWhere("Patient", { phone: trimmed });
    if (!patient || patient.isActive === false) throw error(400, GENERIC_INVALID);

    if (submitted !== DEMO_OTP) {
      const attempts = (otpAttempts.get(trimmed) || 0) + 1;
      otpAttempts.set(trimmed, attempts);
      if (attempts >= OTP_MAX_ATTEMPTS) {
        throw error(
          400,
          "Too many incorrect attempts. That code is no longer valid -- please request a new one.",
        );
      }
      const remaining = OTP_MAX_ATTEMPTS - attempts;
      throw error(400, `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`, {
        attemptsRemaining: remaining,
      });
    }
    if ((otpAttempts.get(trimmed) || 0) >= OTP_MAX_ATTEMPTS) {
      throw error(
        400,
        "Too many incorrect attempts. That code is no longer valid -- please request a new one.",
      );
    }
    otpAttempts.delete(trimmed);

    const token = makeToken("patient", patient._id);
    return ok({ patient: patientLoginData(findById("Patient", patient._id)), token }, "Logged in successfully");
  });
}
