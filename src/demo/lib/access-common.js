/**
 * Shared helpers for the access & admin handlers (auth, users, permissions,
 * settings, clinics, notifications, uploads, followups).
 */
import { all, findById, insert, nowIso } from "../core/db.js";
import { DemoError } from "../core/http.js";
import { currentPatient, currentUser, readToken, requireUser } from "../core/auth.js";
import { findWhere, populate } from "../core/query.js";

export const DEMO_PASSWORD = "Demo@123";
export const DEMO_OTP = "123456";

// Passwords changed during the session ("User:<id>" / "Patient:<id>" -> password).
// Kept out of the documents so they never leak into responses.
const changedPasswords = new Map();

export const passwordMatches = (model, id, password) => {
  const key = `${model}:${id}`;
  const expected = changedPasswords.has(key) ? changedPasswords.get(key) : DEMO_PASSWORD;
  return password === expected;
};

export const setPassword = (model, id, password) => {
  changedPasswords.set(`${model}:${id}`, password);
};

/** User.toJSON(): never send password / tokens. */
export function cleanUser(user) {
  if (!user) return user;
  const out = { ...user };
  delete out.password;
  delete out.refreshToken;
  delete out.resetPasswordToken;
  delete out.resetPasswordExpires;
  return out;
}

/** Patient document as a non-lean Mongoose doc serializes (virtuals: true, select:false fields dropped). */
export function serializePatient(patient) {
  if (!patient) return patient;
  const out = { ...patient };
  delete out.password;
  delete out.otp;
  delete out.resetPasswordToken;
  delete out.resetPasswordExpires;
  if (out.loginOtp) out.loginOtp = {};
  const hasMembership = Boolean(
    patient.membership?.status === "active" &&
      patient.membership?.expiryDate &&
      Date.parse(patient.membership.expiryDate) > Date.now(),
  );
  out.hasMembership = hasMembership;
  out.currentDiscount = hasMembership ? patient.membership.discountPercent || 0 : 0;
  out.calculatedAge = patient.dateOfBirth
    ? Math.floor((Date.now() - Date.parse(patient.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;
  out.id = String(patient._id);
  return out;
}

export const patientLoginData = (patient) => ({
  _id: patient._id,
  name: patient.name,
  phone: patient.phone,
  email: patient.email,
  hasMembership: serializePatient(patient).hasMembership,
});

/** routes.js app-wide lockdown: blog_editor may only touch /auth, /blogs, /permissions/mine, /users/blog-authors. */
export function blockBlogEditor(req) {
  const user = currentUser(req);
  if (user?.role === "blog_editor") {
    throw new DemoError(403, "Access restricted to blog management only");
  }
}

/** checkPermission(module, action) middleware. */
export function hasPermission(role, module, action) {
  const perm = findWhere("Permission", { role, module });
  return Boolean(perm && perm[action]);
}

/**
 * authProtect (+ blog_editor lockdown) (+ optional checkPermission).
 * Returns the staff User.
 */
export function staff(req, module, action) {
  const user = requireUser(req);
  if (user.role === "blog_editor") {
    throw new DemoError(403, "Access restricted to blog management only");
  }
  if (module && !hasPermission(user.role, module, action)) {
    throw new DemoError(403, `No ${action} permission for ${module}`);
  }
  return user;
}

/** restrictTo(...roles) after authProtect. */
export function staffWithRole(req, ...roles) {
  const user = staff(req);
  if (!roles.includes(user.role)) {
    throw new DemoError(403, "You do not have permission to perform this action");
  }
  return user;
}

/** anyAuth: { user } for a staff token, { patient } for a patient token. */
export function anyAuth(req) {
  const token = readToken(req);
  if (!token) throw new DemoError(401, "Not authorized, token missing");
  if (token.type === "patient") {
    const patient = currentPatient(req);
    if (!patient || patient.isActive === false) {
      throw new DemoError(401, "Patient not found or inactive");
    }
    return { patient, recipientId: String(patient._id), recipientModel: "Patient" };
  }
  const user = currentUser(req);
  if (!user || user.isActive === false) {
    throw new DemoError(401, "User not found or inactive");
  }
  if (user.role === "blog_editor") {
    throw new DemoError(403, "Access restricted to blog management only");
  }
  return { user, recipientId: String(user._id), recipientModel: "User" };
}

/** parseIstDateRange(from, to) -> { $gte, $lte } anchored to IST day bounds. */
export function istRange(from, to) {
  const range = {};
  if (from) range.$gte = new Date(`${String(from).slice(0, 10)}T00:00:00.000+05:30`);
  if (to) range.$lte = new Date(`${String(to).slice(0, 10)}T23:59:59.999+05:30`);
  return range;
}

/** SystemSettings.getSettings() singleton. */
export function getSettings() {
  const existing = all("SystemSettings")[0];
  if (existing) return existing;
  return insert("SystemSettings", {
    clinicName: "Dental Clinic",
    clinicPhone: "",
    clinicEmail: "",
    address: { country: "India" },
    workingHours: {
      monday: { open: "09:00", close: "18:00", isOpen: true },
      tuesday: { open: "09:00", close: "18:00", isOpen: true },
      wednesday: { open: "09:00", close: "18:00", isOpen: true },
      thursday: { open: "09:00", close: "18:00", isOpen: true },
      friday: { open: "09:00", close: "18:00", isOpen: true },
      saturday: { open: "09:00", close: "14:00", isOpen: true },
      sunday: { open: "09:00", close: "18:00", isOpen: false },
    },
    systemConfig: {
      timezone: "Asia/Kolkata",
      currency: "INR",
      language: "en",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12h",
    },
    backupSettings: { autoBackup: false, backupFrequency: "weekly" },
    feeSettings: {
      opdFeeRegular: 300,
      opdFeeEmergency: 500,
      consultationFee: 500,
      requirePaymentBeforeBooking: true,
    },
  });
}

/** Notification.create() with schema defaults. */
export function createNotification(fields) {
  return insert("Notification", {
    priority: "normal",
    sendSms: false,
    sendEmail: false,
    sendWhatsapp: false,
    showInApp: true,
    smsStatus: { sent: false },
    emailStatus: { sent: false },
    whatsappStatus: { sent: false },
    isRead: false,
    isProcessed: false,
    __v: 0,
    ...fields,
  });
}

/** processNotificationDelivery(): nothing is really sent in the demo. */
export function markProcessed(notification) {
  notification.isProcessed = true;
  notification.processedAt = nowIso();
  notification.updatedAt = nowIso();
  return notification;
}

/** notifyHelper.notify() — in-app entry. */
export function notify({ recipientId, recipientModel = "Patient", type = "general", title, message, createdBy, appointment, invoice, treatment }) {
  return createNotification({
    title,
    message,
    type,
    recipientType: recipientModel === "Patient" ? "patient" : "user",
    recipient: String(recipientId),
    recipientModel,
    ...(appointment && { appointment }),
    ...(invoice && { invoice }),
    ...(treatment && { treatment }),
    ...(createdBy && { createdBy: String(createdBy) }),
  });
}

/** populate a refPath ref (Notification.recipient -> recipientModel). */
export function populateRecipient(notification, select) {
  const model = notification.recipientModel;
  if (!model || !notification.recipient) return { ...notification, recipient: null };
  return populate(notification, "recipient", model, select);
}

export const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ""));

export { findById };
