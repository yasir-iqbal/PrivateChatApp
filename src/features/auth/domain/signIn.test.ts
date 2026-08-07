import { signIn } from './signIn';
import type { AuthRepository } from '../data/authRepository';
import type { User } from '@react-native-firebase/auth';

describe('signIn', () => {
  it('signs in with email/password and maps the result to an AuthUser', async () => {
    const fakeUser = { uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: true } as User;
    const fakeRepo: AuthRepository = {
      createUserWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn().mockResolvedValue(fakeUser),
      signInWithGoogleIdToken: jest.fn(),
      signOut: jest.fn(),
      sendEmailVerification: jest.fn(),
      updateDisplayName: jest.fn(),
      reloadUser: jest.fn(),
      subscribeToAuthState: jest.fn(),
    };

    const result = await signIn({ email: 'a@b.com', password: 'secret123' }, fakeRepo);

    expect(fakeRepo.signInWithEmailAndPassword).toHaveBeenCalledWith('a@b.com', 'secret123');
    expect(result).toEqual({ uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: true });
  });
});
