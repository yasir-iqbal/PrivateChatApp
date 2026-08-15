import * as firebaseStorage from '@react-native-firebase/storage';
import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

// Wide enough to stay sharp on a phone, small enough that sending over mobile
// data is not painful. Chat photos keep their aspect ratio, unlike avatars.
const MAX_DIMENSION = 1280;

// Long videos would blow past the Storage size rule and cost the recipient a
// large download; the picker trims to this instead.
export const MAX_VIDEO_SECONDS = 60;

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

export type PickedVideo = {
  uri: string;
  width: number;
  height: number;
  durationMs: number;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ChatMediaRepository = {
  pickImage: (source: 'library' | 'camera') => Promise<PickedImage | null>;
  pickVideo: (source: 'library' | 'camera') => Promise<PickedVideo | null>;
  compressImage: (uri: string) => Promise<string>;
  uploadImage: (conversationId: string, localUri: string) => Promise<string>;
  uploadVideo: (conversationId: string, localUri: string) => Promise<string>;
  uploadVoice: (conversationId: string, localUri: string) => Promise<string>;
  getCurrentPosition: () => Promise<Coordinates>;
  requestMicrophoneAccess: () => Promise<boolean>;
};

export const CHAT_MEDIA_FOLDER = 'chatMedia';

// Recording is driven by a hook rather than this repository, because
// expo-audio's recorder is a React hook and cannot be called from plain
// functions. The hook lives in hooks/useVoiceRecorder.
export { RecordingPresets, useAudioRecorder };

async function upload(
  conversationId: string,
  localUri: string,
  extension: string,
  contentType: string,
): Promise<string> {
  const storage = firebaseStorage.getStorage();
  // Named per upload rather than per message: the file has to exist before
  // the message that points at it is written.
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const ref = firebaseStorage.ref(storage, `${CHAT_MEDIA_FOLDER}/${conversationId}/${name}`);
  await firebaseStorage.putFile(ref, localUri, { contentType });
  return firebaseStorage.getDownloadURL(ref);
}

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

  async pickVideo(source) {
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

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['videos'],
      videoMaxDuration: MAX_VIDEO_SECONDS,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      durationMs: asset.duration ?? 0,
    };
  },

  async compressImage(uri) {
    // Only the long edge is constrained; passing both would distort anything
    // that isn't square.
    const context = ImageManipulator.manipulate(uri).resize({ width: MAX_DIMENSION });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    return result.uri;
  },

  uploadImage: (conversationId, localUri) => upload(conversationId, localUri, 'jpg', 'image/jpeg'),
  uploadVideo: (conversationId, localUri) => upload(conversationId, localUri, 'mp4', 'video/mp4'),
  uploadVoice: (conversationId, localUri) => upload(conversationId, localUri, 'm4a', 'audio/m4a'),

  async getCurrentPosition() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Location permission was not granted.');
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  },

  async requestMicrophoneAccess() {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    return permission.granted;
  },
};
