/**
 * Admin Dashboard Hook (React Query)
 *
 * Custom hook for fetching dashboard data.
 * Uses React Query for caching and background refetching.
 *
 * Features:
 * - Stats query (total patients, appointments, etc.)
 * - Recent appointments query
 * - Recent patients query
 * - Today's appointments query
 *
 * Usage:
 * const { stats, recentAppointments, isLoading } = useDashboard();
 */
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getRecentAppointments,
  getRecentPatients,
  getTodayAppointments,
  getStaleTreatments,
  getUnbilledAppointments,
} from "../../api/admin/dashboard.api";
import { getEnquiries } from "../../api/admin/enquiries.api";

/**
 * Dashboard hook
 * @returns {Object} Dashboard data and loading states
 */
export const useDashboard = () => {
  /**
   * Stats Query
   * Fetches total counts for dashboard cards
   */
  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  /**
   * Recent Appointments Query
   * Fetches latest appointments for quick view
   */
  const recentAppointmentsQuery = useQuery({
    queryKey: ["admin", "dashboard", "recentAppointments"],
    queryFn: () => getRecentAppointments(5),
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Recent Patients Query
   * Fetches recently added patients
   */
  const recentPatientsQuery = useQuery({
    queryKey: ["admin", "dashboard", "recentPatients"],
    queryFn: () => getRecentPatients(5),
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Today's Appointments Query
   * Fetches all appointments for today
   */
  const todayAppointmentsQuery = useQuery({
    queryKey: ["admin", "dashboard", "todayAppointments"],
    queryFn: getTodayAppointments,
    staleTime: 1 * 60 * 1000,
  });

  /**
   * Recent Enquiries Query
   */
  const recentEnquiriesQuery = useQuery({
    queryKey: ["admin", "dashboard", "recentEnquiries"],
    queryFn: () => getEnquiries({ limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Stale Treatments Query — treatments not yet closed, behind on sessions,
   * no booking activity in 90+ days. Computed server-side on every request.
   */
  const staleTreatmentsQuery = useQuery({
    queryKey: ["admin", "dashboard", "staleTreatments"],
    queryFn: getStaleTreatments,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Unbilled Appointments Query -- chargeable appointments with no invoice.
   * Short staleTime: this is a money-loss alert, worth surfacing promptly.
   */
  const unbilledAppointmentsQuery = useQuery({
    queryKey: ["admin", "dashboard", "unbilledAppointments"],
    queryFn: getUnbilledAppointments,
    staleTime: 2 * 60 * 1000,
  });

  // Combined loading state
  const isLoading =
    statsQuery.isLoading ||
    recentAppointmentsQuery.isLoading ||
    recentPatientsQuery.isLoading ||
    todayAppointmentsQuery.isLoading;

  // Combined error state
  const isError =
    statsQuery.isError ||
    recentAppointmentsQuery.isError ||
    recentPatientsQuery.isError ||
    todayAppointmentsQuery.isError;

  return {
    // Stats - extract from { data: { totalPatients, ... } }
    stats: statsQuery.data?.data,
    isLoadingStats: statsQuery.isLoading,
    statsError: statsQuery.error,

    // Recent Appointments - extract from { data: [...] }
    recentAppointments: recentAppointmentsQuery.data?.data,
    isLoadingRecentAppointments: recentAppointmentsQuery.isLoading,

    // Recent Patients - extract from { data: [...] }
    recentPatients: recentPatientsQuery.data?.data,
    isLoadingRecentPatients: recentPatientsQuery.isLoading,

    // Today's Appointments
    todayAppointments: todayAppointmentsQuery.data?.data,
    isLoadingTodayAppointments: todayAppointmentsQuery.isLoading,

    // Recent Enquiries
    recentEnquiries: recentEnquiriesQuery.data?.data?.enquiries || [],
    isLoadingRecentEnquiries: recentEnquiriesQuery.isLoading,

    // Stale Treatments
    staleTreatments: staleTreatmentsQuery.data?.data?.staleTreatments || [],
    isLoadingStaleTreatments: staleTreatmentsQuery.isLoading,

    // Unbilled (chargeable but invoice-less) appointments
    unbilledAppointments: unbilledAppointmentsQuery.data?.data?.unbilledAppointments || [],
    isLoadingUnbilledAppointments: unbilledAppointmentsQuery.isLoading,

    // Combined states
    isLoading,
    isError,

    // Refetch functions
    refetchStats: statsQuery.refetch,
    refetchAll: () => {
      statsQuery.refetch();
      recentAppointmentsQuery.refetch();
      recentPatientsQuery.refetch();
      todayAppointmentsQuery.refetch();
      recentEnquiriesQuery.refetch();
    },
  };
};

export default useDashboard;
