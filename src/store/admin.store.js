import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAdminStore = create(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      // token is sent as Authorization: Bearer (see axios request interceptor)
      // so admin auth works cross-site where cookies may be blocked.
      login: (admin, token = null) =>
        set({
          admin,
          token,
          isAuthenticated: true,
        }),

      updateAdmin: (adminData) =>
        set((state) => ({
          admin: { ...state.admin, ...adminData },
        })),

      logout: () =>
        set({
          admin: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "admin-auth",
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
