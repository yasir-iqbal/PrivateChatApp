import { firebaseAuthRepository, type AuthRepository } from '../data/authRepository';
import { nativeGoogleSignInRepository, type GoogleSignInRepository } from '../data/googleSignInRepository';
import { toAuthUser, type AuthUser } from './authUser';

export async function signInWithGoogle(
  authRepo: AuthRepository = firebaseAuthRepository,
  googleRepo: GoogleSignInRepository = nativeGoogleSignInRepository,
): Promise<AuthUser> {
  const idToken = await googleRepo.signIn();
  const user = await authRepo.signInWithGoogleIdToken(idToken);
  return toAuthUser(user);
}
