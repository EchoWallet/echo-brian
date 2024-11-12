import { create } from "zustand";

export enum NavItem {
  Assets = "Assets",
  History = "History",
  AIChat = "AI Chat",
}

interface State {
  selectedNavItem: NavItem | null;
  setSelectedNavItem: (selectedNavItem: NavItem | null) => void;
  reset: () => void;
}

export const useStore = create<State>((set) => ({
  selectedNavItem: null,
  setSelectedNavItem: (selectedNavItem) => set({ selectedNavItem }),
  reset: () => set({ selectedNavItem: null }),
}));
