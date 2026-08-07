import { refreshAuthUser } from './refreshAuthUser';
import type { AuthRepository } from '../data/authRepository';
import type { User } from '@react-native-firebase/auth';

describe('refreshAuthUser', () => {
  it('reloads the user then re-maps the (possibly updated) fields', async () => {
    const fakeUser = { uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: true } as User;
    const repo: AuthRepository = {
      createUserWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signInWithGoogleIdToken: jest.fn(),
      signOut: jest.fn(),
      sendEmailVerification: jest.fn(),
      updateDisplayName: jest.fn(),
      reloadUser: jest.fn().mockResolvedValue(undefined),
      subscribeToAuthState: jest.fn(),
    };

    const result = await refreshAuthUser(fakeUser, repo);

    expect(repo.reloadUser).toHaveBeenCalledWith(fakeUser);
    expect(result.emailVerified).toBe(true);
  });
});
