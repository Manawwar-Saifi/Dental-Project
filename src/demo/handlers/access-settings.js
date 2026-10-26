/**
 * Settings (profile, clinic, notification prefs, system config, fees).
 * Ports src/modules/settings/settings.controller.js.
 */
import { all, nowIso } from "../core/db.js";
import { DemoError, ok } from "../core/http.js";
import { cleanUser, getSettings, passwordMatches, setPassword, staff } from "../lib/access-common.js";

const error = (status, message) => new DemoError(status, message);

const DEFAULT_PREFS = () => ({
  email: { appointments: true, payments: true, systemAlerts: true },
  sms: { appointments: false, payments: false, systemAlerts: false },
});

const DEFAULT_FEES = () => ({
  opdFeeRegular: 300,
  opdFeeEmergency: 500,
  consultationFee: 500,
  requirePaymentBeforeBooking: true,
});

const clinicPayload = (s) => ({
  clinicName: s.clinicName,
  clinicPhone: s.clinicPhone,
  clinicEmail: s.clinicEmail,
  address: s.address,
  workingHours: s.workingHours,
});

const touch = (doc) => {
  doc.updatedAt = nowIso();
  return doc;
};

function objectUrl(file) {
  try {
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      return URL.createObjectURL(file);
    }
  } catch {
    /* fall through */
  }
  return `https://res.cloudinary.com/demo/image/upload/demo/${Date.now()}-${file?.name || "profile"}`;
}

export default function register(r) {
  // Public
  r.get("/settings/fees", () => {
    const settings = getSettings();
    return ok({ fees: settings.feeSettings || DEFAULT_FEES() }, "Fee settings fetched successfully");
  });

  r.patch("/settings/fees", (req) => {
    const user = staff(req, "settings", "edit");
    const { opdFeeRegular, opdFeeEmergency, consultationFee, requirePaymentBeforeBooking } = req.body || {};
    const settings = getSettings();
    if (!settings.feeSettings) settings.feeSettings = DEFAULT_FEES();
    if (opdFeeRegular !== undefined) settings.feeSettings.opdFeeRegular = Number(opdFeeRegular);
    if (opdFeeEmergency !== undefined) settings.feeSettings.opdFeeEmergency = Number(opdFeeEmergency);
    if (consultationFee !== undefined) settings.feeSettings.consultationFee = Number(consultationFee);
    if (requirePaymentBeforeBooking !== undefined) {
      settings.feeSettings.requirePaymentBeforeBooking = Boolean(requirePaymentBeforeBooking);
    }
    settings.updatedBy = String(user._id);
    touch(settings);
    return ok({ fees: settings.feeSettings }, "Fee settings updated successfully");
  });

  // ------------------------------------------------------------ profile
  r.get("/settings/profile", (req) => {
    const user = staff(req, "settings", "view");
    return ok({ user: cleanUser(user) }, "Profile fetched successfully");
  });

  r.patch("/settings/profile", (req) => {
    const user = staff(req, "settings", "edit");
    const { name, email, phone } = req.body || {};
    if (email && email.toLowerCase() !== user.email) {
      if (all("User").some((u) => u.email === email.toLowerCase() && String(u._id) !== String(user._id))) {
        throw error(400, "Email already in use");
      }
    }
    if (phone && phone !== user.phone) {
      if (all("User").some((u) => u.phone === phone && String(u._id) !== String(user._id))) {
        throw error(400, "Phone number already in use");
      }
    }
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    touch(user);
    return ok({ user: cleanUser(user) }, "Profile updated successfully");
  });

  r.post("/settings/profile/picture", (req) => {
    const user = staff(req, "settings", "edit");
    const file = req.files?.[0];
    if (!file) throw error(400, "File is required");
    user.profilePicture = { url: objectUrl(file), publicId: `demo/profile-${Date.now()}` };
    touch(user);
    return ok({ user: cleanUser(user) }, "Profile picture uploaded successfully");
  });

  r.patch("/settings/profile/password", (req) => {
    const user = staff(req, "settings", "edit");
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      throw error(400, "Current password and new password are required");
    }
    if (newPassword.length < 6) throw error(400, "New password must be at least 6 characters");
    if (newPassword !== confirmPassword) throw error(400, "Passwords do not match");
    if (!passwordMatches("User", user._id, currentPassword)) {
      throw error(400, "Current password is incorrect");
    }
    setPassword("User", user._id, newPassword);
    return ok(null, "Password changed successfully");
  });

  // ------------------------------------------------------------ clinic
  r.get("/settings/clinic", (req) => {
    staff(req, "settings", "view");
    return ok(clinicPayload(getSettings()), "Clinic settings fetched successfully");
  });

  r.patch("/settings/clinic", (req) => {
    const user = staff(req, "settings", "edit");
    const { clinicName, clinicPhone, clinicEmail, address, workingHours } = req.body || {};
    const settings = getSettings();
    if (clinicName !== undefined) settings.clinicName = clinicName;
    if (clinicPhone !== undefined) settings.clinicPhone = clinicPhone;
    if (clinicEmail !== undefined) settings.clinicEmail = clinicEmail;
    if (address) settings.address = { ...settings.address, ...address };
    if (workingHours) settings.workingHours = { ...settings.workingHours, ...workingHours };
    settings.updatedBy = String(user._id);
    touch(settings);
    return ok(clinicPayload(settings), "Clinic settings updated successfully");
  });

  // ------------------------------------------------------------ notification prefs
  r.get("/settings/notifications", (req) => {
    const user = staff(req, "settings", "view");
    const preferences = user.notificationPreferences || DEFAULT_PREFS();
    return ok({ preferences }, "Notification preferences fetched successfully");
  });

  r.patch("/settings/notifications", (req) => {
    const user = staff(req, "settings", "edit");
    const { email, sms } = req.body || {};
    if (!user.notificationPreferences) user.notificationPreferences = DEFAULT_PREFS();
    if (email) user.notificationPreferences.email = { ...user.notificationPreferences.email, ...email };
    if (sms) user.notificationPreferences.sms = { ...user.notificationPreferences.sms, ...sms };
    touch(user);
    return ok({ preferences: user.notificationPreferences }, "Notification preferences updated successfully");
  });

  // ------------------------------------------------------------ system
  r.get("/settings/system", (req) => {
    staff(req, "settings", "view");
    const settings = getSettings();
    return ok(
      { config: settings.systemConfig, backup: settings.backupSettings },
      "System configuration fetched successfully",
    );
  });

  r.patch("/settings/system", (req) => {
    const user = staff(req, "settings", "edit");
    const { timezone, currency, language, dateFormat, timeFormat, backupSettings } = req.body || {};
    const settings = getSettings();
    settings.systemConfig = settings.systemConfig || {};
    if (timezone !== undefined) settings.systemConfig.timezone = timezone;
    if (currency !== undefined) settings.systemConfig.currency = currency;
    if (language !== undefined) settings.systemConfig.language = language;
    if (dateFormat !== undefined) settings.systemConfig.dateFormat = dateFormat;
    if (timeFormat !== undefined) settings.systemConfig.timeFormat = timeFormat;
    if (backupSettings) settings.backupSettings = { ...settings.backupSettings, ...backupSettings };
    settings.updatedBy = String(user._id);
    touch(settings);
    return ok(
      { config: settings.systemConfig, backup: settings.backupSettings },
      "System configuration updated successfully",
    );
  });
}
