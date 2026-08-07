import { observeAuthState } from './observeAuthState';
import type { AuthRepository } from '../data/authRepository';

describe('observeAuthState', () => {
  it('delegates to the repository subscription', () => {
    const unsubscribe = jest.fn();
    const repo: AuthRepository = {
      createUserWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signInWithGoogleIdToken: jest.fn(),
      signOut: jest.fn(),
      sendEmailVerification: jest.fn(),
      updateDisplayName: jest.fn(),
      reloadUser: jest.fn(),
      subscribeToAuthState: jest.fn().mockReturnValue(unsubscribe),
    };
    const callback = jest.fn();

    const result = observeAuthState(callback, repo);

    expect(repo.subscribeToAuthState).toHaveBeenCalledWith(callback);
    expect(result).toBe(unsubscribe);
  });
});
