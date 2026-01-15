import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import useAuthStore from '@/store/authStore';

/**
 * Consolidated auth hook that uses the central auth store
 * This ensures all components share the same auth state
 */
export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasCheckedSession = useAuthStore((state) => state.hasCheckedSession);
  const setSession = useAuthStore((state) => state.setSession);
  const initSession = useAuthStore((state) => state.initSession);

  useEffect(() => {
    // Initialize session on mount if not already checked
    if (!hasCheckedSession) {
      initSession();
    }

    // Subscribe to auth changes and sync with store
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [hasCheckedSession, initSession, setSession]);

  const checkAuth = async () => {
    await initSession();
  };

  return {
    isAuthenticated: !!session,
    isLoading: !hasCheckedSession,
    accessToken,
    checkAuth
  };
}
