/**
 * Admin Notifications API
 *
 * API functions for managing notifications.
 */
import api from "../axios";

/**
 * Get all notifications for current user
 * @param {Object} params - Query parameters (page, limit, read, type)
 * @returns {Promise}
 */
export const getNotifications = (params = {}) =>
  api.get("/notifications", { params }).then((res) => res.data);

/**
 * Get unread notification count
 * @returns {Promise}
 */
export const getUnreadCount = () =>
  api.get("/notifications/unread-count").then((res) => res.data);

/**
 * Get unread notifications only
 * @returns {Promise}
 */
export const getUnreadNotifications = () =>
  api.get("/notifications/unread").then((res) => res.data);

/**
 * Get single notification by ID
 * @param {string} id - Notification ID
 * @returns {Promise}
 */
export const getNotification = (id) =>
  api.get(`/notifications/${id}`).then((res) => res.data);

/**
 * Mark notification as read
 * @param {string} id - Notification ID
 * @returns {Promise}
 */
export const markAsRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((res) => res.data);

/**
 * Mark notification as unread
 * @param {string} id - Notification ID
 * @returns {Promise}
 */
export const markAsUnread = (id) =>
  api.patch(`/notifications/${id}/unread`).then((res) => res.data);

/**
 * Mark all notifications as read
 * @returns {Promise}
 */
export const markAllAsRead = () =>
  api.patch("/notifications/mark-all-read").then((res) => res.data);

/**
 * Delete notification
 * @param {string} id - Notification ID
 * @returns {Promise}
 */
export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`).then((res) => res.data);

/**
 * Send notification (Admin)
 * @param {Object} data - Notification data
 * @returns {Promise}
 */
export const sendNotification = (data) =>
  api.post("/notifications/send", data).then((res) => res.data);

/**
 * Send bulk notifications (Admin)
 * @param {Object} data - Bulk notification data
 * @returns {Promise}
 */
export const sendBulkNotifications = (data) =>
  api.post("/notifications/send-bulk", data).then((res) => res.data);

/**
 * Get all notifications for admin view
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getAllNotificationsAdmin = (params = {}) =>
  api.get("/notifications/admin/all", { params }).then((res) => res.data);

/**
 * Get notification statistics
 * @param {Object} params - Query params (from, to)
 * @returns {Promise}
 */
export const getNotificationStats = (params = {}) =>
  api.get("/notifications/admin/stats", { params }).then((res) => res.data);
