import Constants from 'expo-constants';

// Firebase Console -> Authentication -> Sign-in method -> Google -> Web SDK configuration.
// Not a secret (same sensitivity as the Firebase config object), safe to keep in app.json.
export const GOOGLE_WEB_CLIENT_ID: string = Constants.expoConfig?.extra?.googleWebClientId ?? '';
