import type { Unsubscribe, User } from '@react-native-firebase/auth';

import { firebaseAuthRepository, type AuthRepository } from '../data/authRepository';

export function observeAuthState(
  callback: (user: User | null) => void,
  repo: AuthRepository = firebaseAuthRepository,
): Unsubscribe {
  return repo.subscribeToAuthState(callback);
}
