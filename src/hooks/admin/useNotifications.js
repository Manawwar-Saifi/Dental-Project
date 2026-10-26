/**
 * Admin Notifications Hook (React Query)
 *
 * Custom hook for managing notifications data.
 *
 * Features:
 * - Fetch notifications with pagination
 * - Get unread count
 * - Mark as read/unread
 * - Delete notifications
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  getUnreadNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  sendBulkNotifications,
  getAllNotificationsAdmin,
  getNotificationStats,
} from "../../api/admin/notifications.api";

/**
 * Hook for fetching notifications list
 * @param {Object} params - Query parameters (page, limit, read, type)
 */
export const useNotifications = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "notifications", params],
    queryFn: () => getNotifications(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook for fetching unread notification count
 * Used for the notification badge
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["admin", "notifications", "unread-count"],
    queryFn: getUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook for fetching unread notifications only
 */
export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ["admin", "notifications", "unread"],
    queryFn: getUnreadNotifications,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook for notification mutations
 */
export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
  };

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => invalidateNotifications(),
  });

  const markUnreadMutation = useMutation({
    mutationFn: markAsUnread,
    onSuccess: () => invalidateNotifications(),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => invalidateNotifications(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => invalidateNotifications(),
  });

  const sendMutation = useMutation({
    mutationFn: sendNotification,
    onSuccess: () => invalidateNotifications(),
  });

  const sendBulkMutation = useMutation({
    mutationFn: sendBulkNotifications,
    onSuccess: () => invalidateNotifications(),
  });

  return {
    markAsRead: markReadMutation.mutate,
    markAsReadAsync: markReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,

    markAsUnread: markUnreadMutation.mutate,
    isMarkingUnread: markUnreadMutation.isPending,

    markAllAsRead: markAllReadMutation.mutate,
    markAllAsReadAsync: markAllReadMutation.mutateAsync,
    isMarkingAllRead: markAllReadMutation.isPending,

    deleteNotification: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    sendNotification: sendMutation.mutate,
    sendNotificationAsync: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,

    sendBulk: sendBulkMutation.mutate,
    sendBulkAsync: sendBulkMutation.mutateAsync,
    isSendingBulk: sendBulkMutation.isPending,
  };
};

/**
 * Hook for admin-level notifications list (all users)
 * @param {Object} params - { page, limit, type, recipientType, from, to }
 */
export const useAdminNotifications = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "notifications", "admin-all", params],
    queryFn: () => getAllNotificationsAdmin(params),
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook for notification statistics
 * @param {Object} params - { from, to }
 */
export const useNotificationStats = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "notifications", "stats", params],
    queryFn: () => getNotificationStats(params),
    staleTime: 2 * 60 * 1000,
  });
};

export default useNotifications;
