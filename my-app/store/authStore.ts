// store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthState {
  session: Session | null;
  accessToken: string | null;
  hasCheckedSession: boolean;
  isHydrated: boolean;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  initSession: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
  getAccessToken: () => Promise<string | null>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      accessToken: null,
      hasCheckedSession: false,
      isHydrated: false,

      setSession: (session) =>
        set({
          session,
          accessToken: session?.access_token ?? null,
          hasCheckedSession: true,
        }),

      clearSession: () =>
        set({
          session: null,
          accessToken: null,
          hasCheckedSession: true
        }),

      initSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        set({
          session: data.session,
          accessToken: data.session?.access_token ?? null,
          hasCheckedSession: true,
        });
      },

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      // Get a fresh access token, refreshing if needed
      getAccessToken: async () => {
        const state = get();

        // Check if we have a session and it's not expired
        if (state.session?.expires_at) {
          const expiresAt = state.session.expires_at * 1000; // Convert to ms
          const now = Date.now();
          const bufferMs = 60 * 1000; // 1 minute buffer

          // If token is still valid, return it
          if (expiresAt > now + bufferMs) {
            return state.accessToken;
          }
        }

        // Token expired or expiring soon, refresh it
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          console.error('Error refreshing session:', error);
          return null;
        }

        // Update store with refreshed session
        set({
          session: data.session,
          accessToken: data.session.access_token,
        });

        return data.session.access_token;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist both accessToken and session
      partialize: (state) => ({
        accessToken: state.accessToken,
        session: state.session,
        hasCheckedSession: state.hasCheckedSession,
      }),
      onRehydrateStorage: () => (state) => {
        // Called when store is rehydrated from storage
        state?.setHydrated(true);
      },
    }
  )
);

export default useAuthStore;
