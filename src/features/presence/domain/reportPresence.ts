import {
  firestoreUserProfileRepository,
  type UserProfileRepository,
} from '../../profile/data/userProfileRepository';

export async function reportPresence(
  uid: string,
  email: string,
  repo: UserProfileRepository = firestoreUserProfileRepository,
): Promise<void> {
  await repo.touchLastActive(uid, email);
}

export function observePresence(
  uid: string,
  onChange: (lastActiveAt: number | null) => void,
  repo: UserProfileRepository = firestoreUserProfileRepository,
): () => void {
  return repo.observeLastActive(uid, onChange);
}
