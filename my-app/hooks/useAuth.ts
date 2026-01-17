import useAuthStore from '@/store/authStore';

/**
 * Consolidated auth hook that uses the central auth store
 * This ensures all components share the same auth state
 *
 * Note: Auth subscription is handled by AuthProvider, not this hook
 */
export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasCheckedSession = useAuthStore((state) => state.hasCheckedSession);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const getAccessToken = useAuthStore((state) => state.getAccessToken);

  return {
    isAuthenticated: !!session,
    // Loading until both hydrated and session checked
    isLoading: !isHydrated || !hasCheckedSession,
    authLoading: !isHydrated || !hasCheckedSession,
    accessToken,
    session,
    // Use this to get a fresh token for API calls
    getAccessToken,
  };
}
