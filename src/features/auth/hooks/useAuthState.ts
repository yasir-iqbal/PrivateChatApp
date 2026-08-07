import { useEffect, useState } from 'react';
import type { User } from '@react-native-firebase/auth';

import { observeAuthState } from '../domain/observeAuthState';
import { toAuthUser, type AuthUser } from '../domain/authUser';

export type AuthState = {
  firebaseUser: User | null;
  authUser: AuthUser | null;
  initializing: boolean;
};

export function useAuthState(): AuthState {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return observeAuthState((user) => {
      setFirebaseUser(user);
      setInitializing(false);
    });
  }, []);

  return {
    firebaseUser,
    authUser: firebaseUser ? toAuthUser(firebaseUser) : null,
    initializing,
  };
}
