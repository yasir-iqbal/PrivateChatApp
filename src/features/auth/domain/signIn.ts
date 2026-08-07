import { firebaseAuthRepository, type AuthRepository } from '../data/authRepository';
import { toAuthUser, type AuthUser } from './authUser';
import type { LoginInput } from './validation';

export async function signIn(
  input: LoginInput,
  repo: AuthRepository = firebaseAuthRepository,
): Promise<AuthUser> {
  const user = await repo.signInWithEmailAndPassword(input.email, input.password);
  return toAuthUser(user);
}
