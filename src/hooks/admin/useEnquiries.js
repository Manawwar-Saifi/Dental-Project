/**
 * Admin Enquiries Hook (React Query)
 *
 * Custom hooks for lead/enquiry management.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEnquiries,
  getEnquiry,
  getEnquiryStats,
  getTodayEnquiries,
  getPendingFollowUps,
  updateEnquiryStatus,
  assignEnquiry,
  scheduleFollowUp,
  markAsSpam,
  markConverted,
  addNote,
  updateEnquiry,
  deleteEnquiry,
} from "../../api/admin/enquiries.api";

export const useEnquiries = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "enquiries", params],
    queryFn: () => getEnquiries(params),
    staleTime: 1 * 60 * 1000,
  });
};

export const useEnquiry = (id) => {
  return useQuery({
    queryKey: ["admin", "enquiries", id],
    queryFn: () => getEnquiry(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

export const useEnquiryStats = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "enquiries", "stats", params],
    queryFn: () => getEnquiryStats(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useTodayEnquiries = () => {
  return useQuery({
    queryKey: ["admin", "enquiries", "today"],
    queryFn: getTodayEnquiries,
    staleTime: 1 * 60 * 1000,
  });
};

export const usePendingFollowUps = () => {
  return useQuery({
    queryKey: ["admin", "enquiries", "pending-follow-ups"],
    queryFn: getPendingFollowUps,
    staleTime: 1 * 60 * 1000,
  });
};

export const useEnquiryMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
  };

  const statusMut = useMutation({ mutationFn: ({ id, data }) => updateEnquiryStatus(id, data), onSuccess: invalidate });
  const assignMut = useMutation({ mutationFn: ({ id, data }) => assignEnquiry(id, data), onSuccess: invalidate });
  const followUpMut = useMutation({ mutationFn: ({ id, data }) => scheduleFollowUp(id, data), onSuccess: invalidate });
  const spamMut = useMutation({ mutationFn: ({ id, data }) => markAsSpam(id, data), onSuccess: invalidate });
  const convertMut = useMutation({ mutationFn: ({ id, data }) => markConverted(id, data), onSuccess: invalidate });
  const noteMut = useMutation({ mutationFn: ({ id, data }) => addNote(id, data), onSuccess: invalidate });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => updateEnquiry(id, data), onSuccess: invalidate });
  const deleteMut = useMutation({ mutationFn: deleteEnquiry, onSuccess: invalidate });

  return {
    updateStatus: statusMut.mutate, isUpdatingStatus: statusMut.isPending,
    assignEnquiry: assignMut.mutate, isAssigning: assignMut.isPending,
    scheduleFollowUp: followUpMut.mutate, isScheduling: followUpMut.isPending,
    markAsSpam: spamMut.mutate, isMarkingSpam: spamMut.isPending,
    markConverted: convertMut.mutate, isConverting: convertMut.isPending,
    addNote: noteMut.mutate, addNoteAsync: noteMut.mutateAsync, isAddingNote: noteMut.isPending,
    updateEnquiry: updateMut.mutate, isUpdating: updateMut.isPending,
    deleteEnquiry: deleteMut.mutate, isDeleting: deleteMut.isPending,
  };
};

export default useEnquiries;
