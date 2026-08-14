import {
  firestoreUserProfileRepository,
  type UserProfile,
  type UserProfileRepository,
} from '../data/userProfileRepository';

export async function getUserProfiles(
  uids: string[],
  repo: UserProfileRepository = firestoreUserProfileRepository,
): Promise<UserProfile[]> {
  if (uids.length === 0) return [];
  return repo.getProfiles(uids);
}
