import { firebaseAuthRepository, type AuthRepository } from '../data/authRepository';
import { toAuthUser, type AuthUser } from './authUser';
import type { SignUpInput } from './validation';

export async function signUp(
  input: SignUpInput,
  repo: AuthRepository = firebaseAuthRepository,
): Promise<AuthUser> {
  const user = await repo.createUserWithEmailAndPassword(input.email, input.password);
  await repo.updateDisplayName(user, input.displayName);
  await repo.sendEmailVerification(user);
  return toAuthUser(user);
}
