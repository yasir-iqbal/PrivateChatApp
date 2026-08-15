import * as firebaseStorage from '@react-native-firebase/storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Wide enough to stay sharp on a phone, small enough that sending over mobile
// data is not painful. Chat photos keep their aspect ratio, unlike avatars.
const MAX_DIMENSION = 1280;

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

export type ChatMediaRepository = {
  pickImage: (source: 'library' | 'camera') => Promise<PickedImage | null>;
  compressImage: (uri: string) => Promise<string>;
  uploadImage: (conversationId: string, localUri: string) => Promise<string>;
};

export const CHAT_MEDIA_FOLDER = 'chatMedia';

export const nativeChatMediaRepository: ChatMediaRepository = {
  async pickImage(source) {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error(
        source === 'camera'
          ? 'Camera permission was not granted.'
          : 'Photo library permission was not granted.',
      );
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (result.canceled) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, width: asset.width, height: asset.height };
  },

  async compressImage(uri) {
    // Only the long edge is constrained; passing both would distort anything
    // that isn't square.
    const context = ImageManipulator.manipulate(uri).resize({ width: MAX_DIMENSION });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    return result.uri;
  },

  async uploadImage(conversationId, localUri) {
    const storage = firebaseStorage.getStorage();
    // Named per upload rather than per message: the file has to exist before
    // the message that points at it is written.
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
    const ref = firebaseStorage.ref(storage, `${CHAT_MEDIA_FOLDER}/${conversationId}/${name}`);
    await firebaseStorage.putFile(ref, localUri, { contentType: 'image/jpeg' });
    return firebaseStorage.getDownloadURL(ref);
  },
};
