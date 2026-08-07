import { firebaseAuthRepository, type AuthRepository } from '../data/authRepository';
import { nativeGoogleSignInRepository, type GoogleSignInRepository } from '../data/googleSignInRepository';

export async function logOut(
  authRepo: AuthRepository = firebaseAuthRepository,
  googleRepo: GoogleSignInRepository = nativeGoogleSignInRepository,
): Promise<void> {
  await authRepo.signOut();
  await googleRepo.signOut().catch(() => undefined);
}
