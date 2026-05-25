import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@taekwombats/types';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  clearAuth: () => void;
  setUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        localStorage.setItem('access_token', accessToken);
        set({ user, accessToken });
      },
      clearAuth: () => {
        localStorage.removeItem('access_token');
        set({ user: null, accessToken: null });
      },
      setUser: (user) => set({ user }),
    }),
    { name: 'taekwombats-auth', partialize: (s) => ({ user: s.user }) },
  ),
);
