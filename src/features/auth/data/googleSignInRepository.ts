import { GoogleSignin } from '@react-native-google-signin/google-signin';

export type GoogleSignInRepository = {
  configure: (webClientId: string) => void;
  signIn: () => Promise<string>;
  signOut: () => Promise<void>;
};

export const nativeGoogleSignInRepository: GoogleSignInRepository = {
  configure(webClientId) {
    GoogleSignin.configure({ webClientId });
  },

  async signIn() {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success' || !response.data.idToken) {
      throw new Error('Google sign-in did not return an ID token.');
    }
    return response.data.idToken;
  },

  async signOut() {
    await GoogleSignin.signOut();
  },
};
