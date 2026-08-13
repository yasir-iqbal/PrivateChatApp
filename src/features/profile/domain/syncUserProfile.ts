import type { AuthUser } from '../../auth/domain/authUser';
import { firestoreUserProfileRepository, type UserProfileRepository } from '../data/userProfileRepository';

// Mirrors the signed-in user into the users collection so other people can
// find them by email. Runs on every sign-in rather than only at registration,
// which also backfills accounts created before this existed.
export async function syncUserProfile(
  authUser: AuthUser,
  repo: UserProfileRepository = firestoreUserProfileRepository,
): Promise<void> {
  // Unverified accounts are not discoverable: anyone can type any address at
  // sign-up, so publishing before verification would let them squat on an
  // email they do not own.
  if (!authUser.email || !authUser.emailVerified) return;

  await repo.upsertProfile({
    uid: authUser.uid,
    email: authUser.email,
    displayName: authUser.displayName,
    photoURL: authUser.photoURL,
  });
}
