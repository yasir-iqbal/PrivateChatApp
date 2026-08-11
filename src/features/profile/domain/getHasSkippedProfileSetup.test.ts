import { getHasSkippedProfileSetup } from './getHasSkippedProfileSetup';
import type { ProfileSetupPreferenceRepository } from '../data/profileSetupPreferenceRepository';

describe('getHasSkippedProfileSetup', () => {
  it('delegates to the repository', async () => {
    const repo: ProfileSetupPreferenceRepository = {
      getHasSkipped: jest.fn().mockResolvedValue(true),
      setSkipped: jest.fn(),
    };

    const result = await getHasSkippedProfileSetup('uid-1', repo);

    expect(repo.getHasSkipped).toHaveBeenCalledWith('uid-1');
    expect(result).toBe(true);
  });
});
