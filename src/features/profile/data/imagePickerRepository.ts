import * as ImagePicker from 'expo-image-picker';

export type ImagePickerRepository = {
  pickImage: () => Promise<string | null>;
};

export const nativeImagePickerRepository: ImagePickerRepository = {
  async pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Photo library permission was not granted.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }
    return result.assets[0].uri;
  },
};
