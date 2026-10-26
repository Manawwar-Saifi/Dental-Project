import api from "../axios";

/**
 * Patient Follow-up Reminders API — the logged-in patient's upcoming reminders.
 * Reminder only; no payment is attached.
 */
export const getMyFollowUps = () =>
  api.get("/followups/my").then((res) => res.data);
