/**
 * Admin Appointments Hook (React Query)
 *
 * Custom hook for managing appointments data.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments,
  getAppointment,
  getTodayAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  deleteAppointment,
  rescheduleAppointment,
  reopenTreatment,
} from "../../api/admin/appointments.api";

/**
 * Hook for fetching appointments list
 */
export const useAppointments = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["admin", "appointments", params],
    queryFn: () => getAppointments(params),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching single appointment
 */
export const useAppointment = (id) => {
  return useQuery({
    queryKey: ["admin", "appointments", id],
    queryFn: () => getAppointment(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching today's appointments
 */
export const useTodayAppointments = () => {
  return useQuery({
    queryKey: ["admin", "appointments", "today"],
    queryFn: getTodayAppointments,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook for appointment mutations (create, update, cancel)
 */
export const useAppointmentMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }) => updateAppointmentStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, data }) => rescheduleAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const reopenTreatmentMutation = useMutation({
    mutationFn: ({ id, reason }) => reopenTreatment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  return {
    createAppointment: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateAppointment: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateStatus: statusMutation.mutate,
    isUpdatingStatus: statusMutation.isPending,
    cancelAppointment: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
    deleteAppointment: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    rescheduleAppointment: rescheduleMutation.mutate,
    isRescheduling: rescheduleMutation.isPending,
    reopenTreatment: reopenTreatmentMutation.mutate,
    isReopeningTreatment: reopenTreatmentMutation.isPending,
  };
};

export default useAppointments;