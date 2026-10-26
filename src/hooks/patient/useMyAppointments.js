/**
 * Patient Appointments Hook (React Query)
 *
 * Custom hooks for patients to manage their appointments.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyAppointments,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getClinics,
} from "../../api/patient/appointments.api";
import { useAuthStore } from "../../store/auth.store";

/**
 * Hook for fetching patient's appointments
 */
export const useMyAppointments = () => {
  const patient = useAuthStore((state) => state.patient);

  return useQuery({
    queryKey: ["patient", "appointments", patient?.phone],
    queryFn: () => getMyAppointments(patient?.phone),
    enabled: !!patient?.phone,
    staleTime: 30 * 1000,
    refetchOnMount: "always",      // always fetch on mount so rescheduled data is immediately visible
    refetchOnWindowFocus: true,    // override global false — refetch when patient switches back to tab
    refetchInterval: 60 * 1000,
  });
};

/**
 * Hook for fetching available clinics
 */
export const useClinics = () => {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: getClinics,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook for appointment mutations (book, cancel, reschedule)
 */
export const useAppointmentMutations = () => {
  const queryClient = useQueryClient();
  const patient = useAuthStore((state) => state.patient);

  const book = useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "appointments"] });
    },
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }) => cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "appointments"] });
    },
  });

  const reschedule = useMutation({
    mutationFn: ({ id, data }) => rescheduleAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "appointments"] });
    },
  });

  return {
    bookAppointment: book.mutate,
    bookAppointmentAsync: book.mutateAsync,
    isBooking: book.isPending,
    bookError: book.error,

    cancelAppointment: cancel.mutate,
    isCancelling: cancel.isPending,
    cancelError: cancel.error,

    rescheduleAppointment: reschedule.mutate,
    isRescheduling: reschedule.isPending,
    rescheduleError: reschedule.error,
  };
};

export default useMyAppointments;
