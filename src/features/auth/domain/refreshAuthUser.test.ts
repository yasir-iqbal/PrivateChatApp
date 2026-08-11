import { refreshAuthUser } from './refreshAuthUser';
import type { AuthRepository } from '../data/authRepository';
import type { User } from '@react-native-firebase/auth';

function fakeRepo(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithGoogleIdToken: jest.fn(),
    signOut: jest.fn(),
    sendEmailVerification: jest.fn(),
    updateDisplayName: jest.fn(),
    updatePhotoURL: jest.fn(),
    reloadUser: jest.fn(),
    subscribeToAuthState: jest.fn(),
    ...overrides,
  };
}

const staleUser = {
  uid: 'uid-1',
  email: 'a@b.com',
  displayName: null,
  photoURL: null,
  emailVerified: false,
} as User;

describe('refreshAuthUser', () => {
  // reload() swaps in a new User instance rather than mutating the one it was
  // called on, so mapping the *passed-in* user would silently return stale
  // emailVerified/photoURL values and strand the caller on the same screen.
  it('maps the refreshed user returned by the repository, not the stale one', async () => {
    const refreshed = { ...staleUser, emailVerified: true, photoURL: 'https://cdn/a.jpg' } as User;
    const repo = fakeRepo({ reloadUser: jest.fn().mockResolvedValue(refreshed) });

    const result = await refreshAuthUser(staleUser, repo);

    expect(repo.reloadUser).toHaveBeenCalledWith(staleUser);
    expect(result).toEqual({
      uid: 'uid-1',
      email: 'a@b.com',
      displayName: null,
      photoURL: 'https://cdn/a.jpg',
      emailVerified: true,
    });
  });

  it('returns null when the user is no longer signed in after the reload', async () => {
    const repo = fakeRepo({ reloadUser: jest.fn().mockResolvedValue(null) });

    await expect(refreshAuthUser(staleUser, repo)).resolves.toBeNull();
  });
});
