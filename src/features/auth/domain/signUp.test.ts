import { signUp } from './signUp';
import type { AuthRepository } from '../data/authRepository';
import type { User } from '@react-native-firebase/auth';

function makeFakeRepo(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithGoogleIdToken: jest.fn(),
    signOut: jest.fn(),
    sendEmailVerification: jest.fn(),
    updateDisplayName: jest.fn(),
    reloadUser: jest.fn(),
    subscribeToAuthState: jest.fn(),
    ...overrides,
  };
}

describe('signUp', () => {
  it('creates the user, sets their display name, and sends a verification email', async () => {
    const fakeUser = { uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: false } as User;
    const fakeRepo = makeFakeRepo({
      createUserWithEmailAndPassword: jest.fn().mockResolvedValue(fakeUser),
    });

    const result = await signUp(
      { displayName: 'Alice', email: 'a@b.com', password: 'secret123', confirmPassword: 'secret123' },
      fakeRepo,
    );

    expect(fakeRepo.createUserWithEmailAndPassword).toHaveBeenCalledWith('a@b.com', 'secret123');
    expect(fakeRepo.updateDisplayName).toHaveBeenCalledWith(fakeUser, 'Alice');
    expect(fakeRepo.sendEmailVerification).toHaveBeenCalledWith(fakeUser);
    expect(result.emailVerified).toBe(false);
  });
});
