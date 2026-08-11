import {
  asyncStorageProfileSetupPreferenceRepository,
  type ProfileSetupPreferenceRepository,
} from '../data/profileSetupPreferenceRepository';

export function getHasSkippedProfileSetup(
  uid: string,
  repo: ProfileSetupPreferenceRepository = asyncStorageProfileSetupPreferenceRepository,
): Promise<boolean> {
  return repo.getHasSkipped(uid);
}
