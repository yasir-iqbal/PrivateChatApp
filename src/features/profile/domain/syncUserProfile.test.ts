import { syncUserProfile } from './syncUserProfile';
import type { UserProfileRepository } from '../data/userProfileRepository';
import type { AuthUser } from '../../auth/domain/authUser';

function fakeRepo(): jest.Mocked<UserProfileRepository> {
  return {
    upsertProfile: jest.fn().mockResolvedValue(undefined),
    findByEmail: jest.fn(),
    getProfiles: jest.fn(),
  };
}

const verifiedUser: AuthUser = {
  uid: 'uid-1',
  email: 'a@b.com',
  displayName: 'Ada',
  photoURL: 'https://cdn/a.jpg',
  emailVerified: true,
};

describe('syncUserProfile', () => {
  it('publishes the profile for a verified user', async () => {
    const repo = fakeRepo();

    await syncUserProfile(verifiedUser, repo);

    expect(repo.upsertProfile).toHaveBeenCalledWith({
      uid: 'uid-1',
      email: 'a@b.com',
      displayName: 'Ada',
      photoURL: 'https://cdn/a.jpg',
    });
  });

  // Otherwise signing up as someone else's address would publish a lookup
  // entry for an address the registrant has not proven they control.
  it('publishes nothing for an unverified user', async () => {
    const repo = fakeRepo();

    await syncUserProfile({ ...verifiedUser, emailVerified: false }, repo);

    expect(repo.upsertProfile).not.toHaveBeenCalled();
  });

  it('publishes nothing when the account has no email', async () => {
    const repo = fakeRepo();

    await syncUserProfile({ ...verifiedUser, email: null }, repo);

    expect(repo.upsertProfile).not.toHaveBeenCalled();
  });
});
