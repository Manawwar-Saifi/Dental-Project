import api from "../axios";

/**
 * Admin Follow-up Reminders API (reminder only — no invoice/payment).
 */
export const getFollowUps = (params = {}) =>
  api.get("/followups", { params }).then((res) => res.data);

export const createFollowUp = (data) =>
  api.post("/followups", data).then((res) => res.data);

export const updateFollowUp = (id, data) =>
  api.patch(`/followups/${id}`, data).then((res) => res.data);

export const markFollowUpDone = (id) =>
  api.patch(`/followups/${id}/done`).then((res) => res.data);

export const cancelFollowUp = (id) =>
  api.patch(`/followups/${id}/cancel`).then((res) => res.data);
