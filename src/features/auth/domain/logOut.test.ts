import { logOut } from './logOut';
import type { AuthRepository } from '../data/authRepository';
import type { GoogleSignInRepository } from '../data/googleSignInRepository';

describe('logOut', () => {
  it('signs out of Firebase and Google', async () => {
    const authRepo: AuthRepository = {
      createUserWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signInWithGoogleIdToken: jest.fn(),
      signOut: jest.fn().mockResolvedValue(undefined),
      sendEmailVerification: jest.fn(),
      updateDisplayName: jest.fn(),
      updatePhotoURL: jest.fn(),
      reloadUser: jest.fn(),
      subscribeToAuthState: jest.fn(),
    };
    const googleRepo: GoogleSignInRepository = {
      configure: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn().mockResolvedValue(undefined),
    };

    await logOut(authRepo, googleRepo);

    expect(authRepo.signOut).toHaveBeenCalled();
    expect(googleRepo.signOut).toHaveBeenCalled();
  });

  it('still signs out of Firebase even if the Google sign-out rejects (no active Google session)', async () => {
    const authRepo: AuthRepository = {
      createUserWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signInWithGoogleIdToken: jest.fn(),
      signOut: jest.fn().mockResolvedValue(undefined),
      sendEmailVerification: jest.fn(),
      updateDisplayName: jest.fn(),
      updatePhotoURL: jest.fn(),
      reloadUser: jest.fn(),
      subscribeToAuthState: jest.fn(),
    };
    const googleRepo: GoogleSignInRepository = {
      configure: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn().mockRejectedValue(new Error('no session')),
    };

    await expect(logOut(authRepo, googleRepo)).resolves.toBeUndefined();
    expect(authRepo.signOut).toHaveBeenCalled();
  });
});
