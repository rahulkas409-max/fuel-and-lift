"use client";
import { create } from "zustand";

interface ToastState {
  message: string | null;
  id: number;
  show: (message: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  id: 0,
  show: (message) => {
    const id = Date.now();
    set({ message, id });
    setTimeout(() => set((s) => (s.id === id ? { message: null } : s)), 2400);
  },
}));
