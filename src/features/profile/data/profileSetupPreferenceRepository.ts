import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileSetupPreferenceRepository = {
  getHasSkipped: (uid: string) => Promise<boolean>;
  setSkipped: (uid: string) => Promise<void>;
};

const keyFor = (uid: string) => `profile-setup-skipped:${uid}`;

export const asyncStorageProfileSetupPreferenceRepository: ProfileSetupPreferenceRepository = {
  async getHasSkipped(uid) {
    const value = await AsyncStorage.getItem(keyFor(uid));
    return value === 'true';
  },

  async setSkipped(uid) {
    await AsyncStorage.setItem(keyFor(uid), 'true');
  },
};
