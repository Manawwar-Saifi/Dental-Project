/**
 * Admin Hooks Index
 *
 * Central export file for all admin hooks.
 * Allows cleaner imports like:
 * import { useAdminAuth, useDashboard } from "@/hooks/admin";
 */

export { useAdminAuth } from "./useAdminAuth";
export { useDashboard } from "./useDashboard";
export { usePatients } from "./usePatients";
export { useAppointments } from "./useAppointments";
export { useTreatments } from "./useTreatments";
export { useTests } from "./useTests";
export { useBilling } from "./useBilling";
export { usePayments } from "./usePayments";
export { useReports } from "./useReports";
export {
  useNotifications,
  useUnreadCount,
  useUnreadNotifications,
  useNotificationMutations,
} from "./useNotifications";
