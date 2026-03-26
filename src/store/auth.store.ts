import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  hasCheckedRefresh: boolean;
  setAccessToken: (token: string) => void;
  setHasCheckedRefresh: (checked: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  hasCheckedRefresh: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setHasCheckedRefresh: (checked) => set({ hasCheckedRefresh: checked }),
  clearAuth: () => set({ accessToken: null }),
}));
