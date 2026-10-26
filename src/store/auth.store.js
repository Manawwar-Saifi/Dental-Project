import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      patient: null,
      token: null,
      isAuthenticated: false,
      pendingEmail: null,

      // token is sent as Authorization: Bearer (see axios request interceptor)
      // so auth works cross-site where cookies may be blocked.
      login: (patient, token = null) =>
        set({
          patient,
          token,
          isAuthenticated: true,
          pendingEmail: null,
        }),

      setPendingEmail: (email) =>
        set({ pendingEmail: email }),

      updatePatient: (patientData) =>
        set((state) => ({
          patient: { ...state.patient, ...patientData },
        })),

      logout: () =>
        set({
          patient: null,
          token: null,
          isAuthenticated: false,
          pendingEmail: null,
        }),
    }),
    {
      name: "patient-auth",
      partialize: (state) => ({
        patient: state.patient,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
