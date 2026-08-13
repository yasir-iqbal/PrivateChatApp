import { useEffect } from 'react';

import { syncUserProfile } from '../domain/syncUserProfile';
import type { AuthUser } from '../../auth/domain/authUser';

// Keeps the user's public profile document in step with their auth profile.
// Best-effort on purpose: a failed sync must not block the UI, it just means
// the user is briefly not discoverable and the next sign-in retries.
export function useSyncUserProfile(authUser: AuthUser | null) {
  // Re-sync only when a published field actually changes, not on every render
  // that hands us a new object identity.
  const signature = authUser
    ? [authUser.uid, authUser.email, authUser.displayName, authUser.photoURL, authUser.emailVerified].join('|')
    : null;

  useEffect(() => {
    if (!authUser) return;
    syncUserProfile(authUser).catch((error) => {
      console.warn('Failed to sync user profile', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by signature, not object identity
  }, [signature]);
}
