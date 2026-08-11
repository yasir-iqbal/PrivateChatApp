import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type ImageCompressionRepository = {
  compressImage: (uri: string) => Promise<string>;
};

const AVATAR_MAX_DIMENSION = 512;

export const nativeImageCompressionRepository: ImageCompressionRepository = {
  async compressImage(uri) {
    const context = ImageManipulator.manipulate(uri).resize({
      width: AVATAR_MAX_DIMENSION,
      height: AVATAR_MAX_DIMENSION,
    });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    return result.uri;
  },
};
