import { pickAndUploadAvatar } from './pickAndUploadAvatar';
import type { AuthRepository } from '../../auth/data/authRepository';
import type { ImageCompressionRepository } from '../data/imageCompressionRepository';
import type { ImagePickerRepository } from '../data/imagePickerRepository';
import type { StorageRepository } from '../data/storageRepository';
import type { User } from '@react-native-firebase/auth';

function makeAuthRepo(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithGoogleIdToken: jest.fn(),
    signOut: jest.fn(),
    sendEmailVerification: jest.fn(),
    updateDisplayName: jest.fn(),
    updatePhotoURL: jest.fn(),
    reloadUser: jest.fn(),
    subscribeToAuthState: jest.fn(),
    ...overrides,
  };
}

const fakeUser = { uid: 'uid-1' } as User;

describe('pickAndUploadAvatar', () => {
  it('picks, compresses, uploads, and updates the profile photoURL', async () => {
    const imagePickerRepo: ImagePickerRepository = { pickImage: jest.fn().mockResolvedValue('file://picked.jpg') };
    const compressionRepo: ImageCompressionRepository = {
      compressImage: jest.fn().mockResolvedValue('file://compressed.jpg'),
    };
    const storageRepo: StorageRepository = {
      uploadAvatar: jest.fn().mockResolvedValue('https://storage.example.com/avatar.jpg'),
    };
    const authRepo = makeAuthRepo();

    const result = await pickAndUploadAvatar(fakeUser, imagePickerRepo, compressionRepo, storageRepo, authRepo);

    expect(imagePickerRepo.pickImage).toHaveBeenCalled();
    expect(compressionRepo.compressImage).toHaveBeenCalledWith('file://picked.jpg');
    expect(storageRepo.uploadAvatar).toHaveBeenCalledWith('uid-1', 'file://compressed.jpg');
    expect(authRepo.updatePhotoURL).toHaveBeenCalledWith(fakeUser, 'https://storage.example.com/avatar.jpg');
    expect(result).toBe(true);
  });

  it('returns false and does nothing else when the user cancels the picker', async () => {
    const imagePickerRepo: ImagePickerRepository = { pickImage: jest.fn().mockResolvedValue(null) };
    const compressionRepo: ImageCompressionRepository = { compressImage: jest.fn() };
    const storageRepo: StorageRepository = { uploadAvatar: jest.fn() };
    const authRepo = makeAuthRepo();

    const result = await pickAndUploadAvatar(fakeUser, imagePickerRepo, compressionRepo, storageRepo, authRepo);

    expect(result).toBe(false);
    expect(compressionRepo.compressImage).not.toHaveBeenCalled();
    expect(storageRepo.uploadAvatar).not.toHaveBeenCalled();
    expect(authRepo.updatePhotoURL).not.toHaveBeenCalled();
  });
});
