/**
 * Application Store
 * Global state management using Zustand
 */

import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // System state
  isSystemOnline: false,
  systemStatus: null,

  // Recent vehicles
  recentVehicles: [],
  selectedVehicle: null,

  // Analytics
  analytics: null,

  // Settings
  settings: {
    maxWeight: 5000,
    theme: 'dark',
  },

  // Actions
  setSystemOnline: (status) => set({ isSystemOnline: status }),
  setRecentVehicles: (vehicles) => set({ recentVehicles: vehicles }),
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  setAnalytics: (analytics) => set({ analytics }),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}));
