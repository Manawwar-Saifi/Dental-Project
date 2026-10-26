/**
 * Admin Auth Hook (React Query + Zustand)
 *
 * Custom hook for admin authentication operations.
 * Combines React Query for API calls with Zustand for state management.
 *
 * Features:
 * - Login mutation with automatic state update
 * - Logout mutation with state cleanup
 * - Profile query for fetching admin data
 *
 * Usage:
 * const { login, logout, isLoggingIn, loginError } = useAdminAuth();
 * login({ email: "admin@example.com", password: "password" });
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginAdmin, getAdminProfile, logoutAdmin } from "../../api/admin/auth.api";
import { useAdminStore } from "../../store/admin.store";

/**
 * Admin authentication hook
 * @returns {Object} Auth methods and state
 */
export const useAdminAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get store actions
  const { login: storeLogin, logout: storeLogout, isAuthenticated } = useAdminStore();

  /**
   * Login Mutation
   * Handles admin login and updates store on success
   * Backend returns: { data: { user, token }, message }
   */
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => loginAdmin(email, password),
    onSuccess: (response) => {
      const { user, token } = response.data;
      storeLogin(user, token);
      navigate("/admin/dashboard");
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  /**
   * Logout Mutation
   * Handles admin logout and clears store
   */
  const logoutMutation = useMutation({
    mutationFn: logoutAdmin,
    onSuccess: () => {
      // Clear Zustand store
      storeLogout();
      // Clear all React Query cache
      queryClient.clear();
      // Navigate to login
      navigate("/admin/login");
    },
    onError: () => {
      // Even if API fails, clear local state
      storeLogout();
      queryClient.clear();
      navigate("/admin/login");
    },
  });

  /**
   * Profile Query
   * Fetches current admin profile (useful for refreshing data)
   */
  const profileQuery = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: getAdminProfile,
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  return {
    // Login
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    // Logout
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    // Profile
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    refetchProfile: profileQuery.refetch,

    // Auth state
    isAuthenticated,
  };
};

export default useAdminAuth;
