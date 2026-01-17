'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import useAuthStore from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const setSession = useAuthStore((state) => state.setSession);
  const initSession = useAuthStore((state) => state.initSession);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hasCheckedSession = useAuthStore((state) => state.hasCheckedSession);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    // Wait for hydration before checking session
    if (!isHydrated) return;

    // Only init session if we haven't checked it yet (fresh load)
    // If hasCheckedSession is true from persistence, we already have a session
    if (!hasCheckedSession) {
      initSession();
    }

    // Set up auth state change listener (only once)
    if (!subscriptionRef.current) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          // Update store with new session
          setSession(session);
        }
      );
      subscriptionRef.current = subscription;
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isHydrated, hasCheckedSession, initSession, setSession]);

  return <>{children}</>;
}
