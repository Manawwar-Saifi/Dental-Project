/**
 * Admin Settings Hook (React Query)
 *
 * Custom hooks for managing settings data.
 * Handles profile, clinic, notifications, and system settings.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  getClinicSettings,
  updateClinicSettings,
  getNotificationPreferences,
  updateNotificationPreferences,
  getSystemConfig,
  updateSystemConfig,
  getFeeSettings,
  updateFeeSettings,
} from "../../api/admin/settings.api";

// ============================================
// PROFILE HOOKS
// ============================================

/**
 * Hook for fetching admin profile
 */
export const useProfile = () => {
  return useQuery({
    queryKey: ["admin", "settings", "profile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for profile mutations (update, picture, password)
 */
export const useProfileMutations = () => {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "profile"] });
    },
  });

  const uploadPicture = useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "profile"] });
    },
  });

  const password = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "profile"] });
    },
  });

  return {
    updateProfile: update.mutate,
    updateProfileAsync: update.mutateAsync,
    isUpdatingProfile: update.isPending,
    updateProfileError: update.error,

    uploadPicture: uploadPicture.mutate,
    uploadPictureAsync: uploadPicture.mutateAsync,
    isUploadingPicture: uploadPicture.isPending,
    uploadPictureError: uploadPicture.error,

    changePassword: password.mutate,
    changePasswordAsync: password.mutateAsync,
    isChangingPassword: password.isPending,
    changePasswordError: password.error,
  };
};

// ============================================
// CLINIC SETTINGS HOOKS
// ============================================

/**
 * Hook for fetching clinic settings
 */
export const useClinicSettings = () => {
  return useQuery({
    queryKey: ["admin", "settings", "clinic"],
    queryFn: getClinicSettings,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for clinic settings mutations
 */
export const useClinicSettingsMutations = () => {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: updateClinicSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "clinic"] });
    },
  });

  return {
    updateClinicSettings: update.mutate,
    updateClinicSettingsAsync: update.mutateAsync,
    isUpdating: update.isPending,
    updateError: update.error,
  };
};

// ============================================
// NOTIFICATION PREFERENCES HOOKS
// ============================================

/**
 * Hook for fetching notification preferences
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ["admin", "settings", "notifications"],
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for notification preferences mutations
 */
export const useNotificationPreferencesMutations = () => {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "notifications"] });
    },
  });

  return {
    updatePreferences: update.mutate,
    updatePreferencesAsync: update.mutateAsync,
    isUpdating: update.isPending,
    updateError: update.error,
  };
};

// ============================================
// SYSTEM CONFIG HOOKS
// ============================================

/**
 * Hook for fetching system configuration
 */
export const useSystemConfig = () => {
  return useQuery({
    queryKey: ["admin", "settings", "system"],
    queryFn: getSystemConfig,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for system config mutations
 */
export const useSystemConfigMutations = () => {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: updateSystemConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "system"] });
    },
  });

  return {
    updateConfig: update.mutate,
    updateConfigAsync: update.mutateAsync,
    isUpdating: update.isPending,
    updateError: update.error,
  };
};

// ============================================
// FEE SETTINGS HOOKS
// ============================================

/**
 * Hook for fetching fee settings (OPD charges)
 */
export const useFeeSettings = () => {
  return useQuery({
    queryKey: ["admin", "settings", "fees"],
    queryFn: getFeeSettings,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fee settings mutations
 */
export const useFeeSettingsMutations = () => {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: updateFeeSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "fees"] });
    },
  });

  return {
    updateFeeSettings: update.mutate,
    updateFeeSettingsAsync: update.mutateAsync,
    isUpdating: update.isPending,
    updateError: update.error,
  };
};
