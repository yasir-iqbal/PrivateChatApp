import { useCallback, useEffect, useState } from 'react';
import type { User } from '@react-native-firebase/auth';

import { observeAuthState } from '../domain/observeAuthState';
import { refreshAuthUser } from '../domain/refreshAuthUser';
import { toAuthUser, type AuthUser } from '../domain/authUser';

export type AuthState = {
  firebaseUser: User | null;
  authUser: AuthUser | null;
  initializing: boolean;
  // Firebase's onAuthStateChanged does not re-fire after profile fields
  // (emailVerified, photoURL, ...) change on the same user — callers that
  // mutate the profile must call this to push the update into authUser.
  refresh: () => Promise<void>;
};

export function useAuthState(): AuthState {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return observeAuthState((user) => {
      setFirebaseUser(user);
      setAuthUser(user ? toAuthUser(user) : null);
      setInitializing(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!firebaseUser) return;
    setAuthUser(await refreshAuthUser(firebaseUser));
  }, [firebaseUser]);

  return { firebaseUser, authUser, initializing, refresh };
}
