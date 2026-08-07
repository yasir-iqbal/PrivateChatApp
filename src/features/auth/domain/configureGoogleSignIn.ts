import { nativeGoogleSignInRepository, type GoogleSignInRepository } from '../data/googleSignInRepository';

export function configureGoogleSignIn(
  webClientId: string,
  repo: GoogleSignInRepository = nativeGoogleSignInRepository,
): void {
  repo.configure(webClientId);
}
