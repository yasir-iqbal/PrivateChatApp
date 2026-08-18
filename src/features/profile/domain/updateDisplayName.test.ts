import { MAX_DISPLAY_NAME_LENGTH, updateDisplayName } from './updateDisplayName';
import type { AuthRepository } from '../../auth/data/authRepository';
import type { User } from '@react-native-firebase/auth';

const user = { uid: 'uid-me' } as User;

function fakeRepo(): jest.Mocked<AuthRepository> {
  return {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithGoogleIdToken: jest.fn(),
    signOut: jest.fn(),
    sendEmailVerification: jest.fn(),
    updateDisplayName: jest.fn().mockResolvedValue(undefined),
    updatePhotoURL: jest.fn(),
    reloadUser: jest.fn(),
    subscribeToAuthState: jest.fn(),
  };
}

describe('updateDisplayName', () => {
  it('saves the trimmed name', async () => {
    const repo = fakeRepo();

    await updateDisplayName(user, '  Ada  ', repo);

    expect(repo.updateDisplayName).toHaveBeenCalledWith(user, 'Ada');
  });

  // Guarded in the domain so no caller can leave a contact with nothing to
  // show but an email address.
  it('refuses an empty name', async () => {
    const repo = fakeRepo();

    await expect(updateDisplayName(user, '   ', repo)).rejects.toThrow('Enter a name');
    expect(repo.updateDisplayName).not.toHaveBeenCalled();
  });

  it('refuses a name past the length limit', async () => {
    const repo = fakeRepo();

    await expect(
      updateDisplayName(user, 'a'.repeat(MAX_DISPLAY_NAME_LENGTH + 1), repo),
    ).rejects.toThrow('characters or fewer');
    expect(repo.updateDisplayName).not.toHaveBeenCalled();
  });

  it('accepts a name at the limit', async () => {
    const repo = fakeRepo();

    await updateDisplayName(user, 'a'.repeat(MAX_DISPLAY_NAME_LENGTH), repo);

    expect(repo.updateDisplayName).toHaveBeenCalled();
  });
});
