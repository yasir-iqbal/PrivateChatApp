import { configureGoogleSignIn } from './configureGoogleSignIn';
import type { GoogleSignInRepository } from '../data/googleSignInRepository';

describe('configureGoogleSignIn', () => {
  it('passes the web client id through to the repository', () => {
    const repo: GoogleSignInRepository = {
      configure: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    };

    configureGoogleSignIn('web-client-id', repo);

    expect(repo.configure).toHaveBeenCalledWith('web-client-id');
  });
});
