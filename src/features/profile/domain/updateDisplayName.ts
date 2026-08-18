import type { User } from '@react-native-firebase/auth';

import { firebaseAuthRepository, type AuthRepository } from '../../auth/data/authRepository';

export const MAX_DISPLAY_NAME_LENGTH = 40;

export async function updateDisplayName(
  user: User,
  displayName: string,
  repo: AuthRepository = firebaseAuthRepository,
): Promise<void> {
  const trimmed = displayName.trim();
  // Guarded in the domain so no caller can write an empty or absurd name,
  // which would leave contacts with nothing to show but an email.
  if (trimmed.length === 0) {
    throw new Error('Enter a name.');
  }
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new Error(`Name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`);
  }
  await repo.updateDisplayName(user, trimmed);
}
