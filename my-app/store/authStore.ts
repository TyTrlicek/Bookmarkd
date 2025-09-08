// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthState {
  session: Session | null;
  accessToken: string | null;
  hasCheckedSession: boolean;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  initSession: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      accessToken: null,
      hasCheckedSession: false,
      setSession: (session) =>
        set({
          session,
          accessToken: session?.access_token ?? null,
          hasCheckedSession: true,
        }),
      clearSession: () =>
        set({ session: null, accessToken: null, hasCheckedSession: true }),
      initSession: async () => {
        const { data } = await supabase.auth.getSession();
        set({
          session: data.session,
          accessToken: data.session?.access_token ?? null,
          hasCheckedSession: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);

export default useAuthStore;
