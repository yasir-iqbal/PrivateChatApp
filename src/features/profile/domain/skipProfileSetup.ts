import {
  asyncStorageProfileSetupPreferenceRepository,
  type ProfileSetupPreferenceRepository,
} from '../data/profileSetupPreferenceRepository';

export function skipProfileSetup(
  uid: string,
  repo: ProfileSetupPreferenceRepository = asyncStorageProfileSetupPreferenceRepository,
): Promise<void> {
  return repo.setSkipped(uid);
}
