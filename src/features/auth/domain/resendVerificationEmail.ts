import type { User } from '@react-native-firebase/auth';

import { firebaseAuthRepository, type AuthRepository } from '../data/authRepository';

export async function resendVerificationEmail(
  user: User,
  repo: AuthRepository = firebaseAuthRepository,
): Promise<void> {
  await repo.sendEmailVerification(user);
}
