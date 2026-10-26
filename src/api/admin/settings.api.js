/**
 * Admin Settings API
 *
 * API functions for settings management.
 * Handles profile, clinic, notifications, and system settings.
 * Backend endpoints: /api/settings
 */
import api from "../axios";

// ============================================
// PROFILE SETTINGS
// ============================================

/**
 * Get current admin profile
 */
export const getProfile = async () => {
  const res = await api.get("/settings/profile");
  return res.data;
};

/**
 * Update profile (name, email, phone)
 */
export const updateProfile = async (data) => {
  const res = await api.patch("/settings/profile", data);
  return res.data;
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append("profilePicture", file);
  const res = await api.post("/settings/profile/picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

/**
 * Change password
 */
export const changePassword = async (data) => {
  const res = await api.patch("/settings/profile/password", data);
  return res.data;
};

// ============================================
// CLINIC SETTINGS
// ============================================

/**
 * Get clinic settings
 */
export const getClinicSettings = async () => {
  const res = await api.get("/settings/clinic");
  return res.data;
};

/**
 * Update clinic settings
 */
export const updateClinicSettings = async (data) => {
  const res = await api.patch("/settings/clinic", data);
  return res.data;
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async () => {
  const res = await api.get("/settings/notifications");
  return res.data;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (data) => {
  const res = await api.patch("/settings/notifications", data);
  return res.data;
};

// ============================================
// SYSTEM CONFIGURATION
// ============================================

/**
 * Get system configuration
 */
export const getSystemConfig = async () => {
  const res = await api.get("/settings/system");
  return res.data;
};

/**
 * Update system configuration
 */
export const updateSystemConfig = async (data) => {
  const res = await api.patch("/settings/system", data);
  return res.data;
};

// ============================================
// FEE SETTINGS
// ============================================

/**
 * Get fee settings (OPD charges)
 */
export const getFeeSettings = async () => {
  const res = await api.get("/settings/fees");
  return res.data;
};

/**
 * Update fee settings
 */
export const updateFeeSettings = async (data) => {
  const res = await api.patch("/settings/fees", data);
  return res.data;
};
