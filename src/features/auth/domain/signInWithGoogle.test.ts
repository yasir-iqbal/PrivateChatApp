import { signInWithGoogle } from './signInWithGoogle';
import type { AuthRepository } from '../data/authRepository';
import type { GoogleSignInRepository } from '../data/googleSignInRepository';
import type { User } from '@react-native-firebase/auth';

describe('signInWithGoogle', () => {
  it('exchanges the Google ID token for a Firebase session', async () => {
    const fakeUser = { uid: 'uid-1', email: 'a@b.com', displayName: 'Alice', photoURL: null, emailVerified: true } as User;
    const authRepo: AuthRepository = {
      createUserWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signInWithGoogleIdToken: jest.fn().mockResolvedValue(fakeUser),
      signOut: jest.fn(),
      sendEmailVerification: jest.fn(),
      updateDisplayName: jest.fn(),
      reloadUser: jest.fn(),
      subscribeToAuthState: jest.fn(),
    };
    const googleRepo: GoogleSignInRepository = {
      configure: jest.fn(),
      signIn: jest.fn().mockResolvedValue('id-token-123'),
      signOut: jest.fn(),
    };

    const result = await signInWithGoogle(authRepo, googleRepo);

    expect(googleRepo.signIn).toHaveBeenCalled();
    expect(authRepo.signInWithGoogleIdToken).toHaveBeenCalledWith('id-token-123');
    expect(result.uid).toBe('uid-1');
  });
});
