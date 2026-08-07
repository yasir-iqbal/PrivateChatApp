import type { User } from '@react-native-firebase/auth';

import { firebaseAuthRepository, type AuthRepository } from '../data/authRepository';
import { toAuthUser, type AuthUser } from './authUser';

export async function refreshAuthUser(
  user: User,
  repo: AuthRepository = firebaseAuthRepository,
): Promise<AuthUser> {
  await repo.reloadUser(user);
  return toAuthUser(user);
}
