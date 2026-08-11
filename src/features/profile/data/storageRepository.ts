import * as firebaseStorage from '@react-native-firebase/storage';

export type StorageRepository = {
  uploadAvatar: (uid: string, localFileUri: string) => Promise<string>;
};

export const firebaseStorageRepository: StorageRepository = {
  async uploadAvatar(uid, localFileUri) {
    const storage = firebaseStorage.getStorage();
    const avatarRef = firebaseStorage.ref(storage, `avatars/${uid}/avatar.jpg`);
    await firebaseStorage.putFile(avatarRef, localFileUri, { contentType: 'image/jpeg' });
    return firebaseStorage.getDownloadURL(avatarRef);
  },
};
