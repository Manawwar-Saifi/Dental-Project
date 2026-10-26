import { create } from "zustand";

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
}));