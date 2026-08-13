import { Share } from 'react-native';

export type ShareRepository = {
  share: (message: string) => Promise<void>;
};

export const nativeShareRepository: ShareRepository = {
  async share(message) {
    await Share.share({ message });
  },
};
