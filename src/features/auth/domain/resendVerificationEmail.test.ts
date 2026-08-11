import { resendVerificationEmail } from './resendVerificationEmail';
import type { AuthRepository } from '../data/authRepository';
import type { User } from '@react-native-firebase/auth';

describe('resendVerificationEmail', () => {
  it('delegates to the repository', async () => {
    const fakeUser = { uid: 'uid-1' } as User;
    const repo: AuthRepository = {
      createUserWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signInWithGoogleIdToken: jest.fn(),
      signOut: jest.fn(),
      sendEmailVerification: jest.fn().mockResolvedValue(undefined),
      updateDisplayName: jest.fn(),
      updatePhotoURL: jest.fn(),
      reloadUser: jest.fn(),
      subscribeToAuthState: jest.fn(),
    };

    await resendVerificationEmail(fakeUser, repo);

    expect(repo.sendEmailVerification).toHaveBeenCalledWith(fakeUser);
  });
});
