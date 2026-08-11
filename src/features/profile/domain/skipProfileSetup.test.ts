import { skipProfileSetup } from './skipProfileSetup';
import type { ProfileSetupPreferenceRepository } from '../data/profileSetupPreferenceRepository';

describe('skipProfileSetup', () => {
  it('delegates to the repository', async () => {
    const repo: ProfileSetupPreferenceRepository = {
      getHasSkipped: jest.fn(),
      setSkipped: jest.fn().mockResolvedValue(undefined),
    };

    await skipProfileSetup('uid-1', repo);

    expect(repo.setSkipped).toHaveBeenCalledWith('uid-1');
  });
});
