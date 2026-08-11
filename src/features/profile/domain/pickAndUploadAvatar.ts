import type { User } from '@react-native-firebase/auth';

import { firebaseAuthRepository, type AuthRepository } from '../../auth/data/authRepository';
import { nativeImageCompressionRepository, type ImageCompressionRepository } from '../data/imageCompressionRepository';
import { nativeImagePickerRepository, type ImagePickerRepository } from '../data/imagePickerRepository';
import { firebaseStorageRepository, type StorageRepository } from '../data/storageRepository';

// Returns whether an avatar was actually uploaded (false if the user
// cancelled the picker). Callers should refresh their auth state afterwards
// to pick up the new photoURL — Firebase's updateProfile does not reliably
// mutate the User object handed to it in place.
export async function pickAndUploadAvatar(
  user: User,
  imagePickerRepo: ImagePickerRepository = nativeImagePickerRepository,
  compressionRepo: ImageCompressionRepository = nativeImageCompressionRepository,
  storageRepo: StorageRepository = firebaseStorageRepository,
  authRepo: AuthRepository = firebaseAuthRepository,
): Promise<boolean> {
  const pickedUri = await imagePickerRepo.pickImage();
  if (!pickedUri) {
    return false;
  }

  const compressedUri = await compressionRepo.compressImage(pickedUri);
  const downloadUrl = await storageRepo.uploadAvatar(user.uid, compressedUri);
  await authRepo.updatePhotoURL(user, downloadUrl);

  return true;
}
