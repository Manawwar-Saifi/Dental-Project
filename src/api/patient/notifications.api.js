import api from "../axios";

export const getMyNotifications = (params = {}) =>
  api.get("/notifications", { params }).then((res) => res.data);

export const getUnreadCount = () =>
  api.get("/notifications/unread-count").then((res) => res.data);

export const markAsRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((res) => res.data);

export const markAllAsRead = () =>
  api.patch("/notifications/mark-all-read").then((res) => res.data);
