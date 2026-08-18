import * as firestore from '@react-native-firebase/firestore';
import * as messaging from '@react-native-firebase/messaging';

import { USERS_COLLECTION } from '../../profile/data/userProfileRepository';

// Tokens are per device, so a user with a phone and a tablet has two. Stored
// as a subcollection keyed by the token itself, which makes removing a stale
// one a delete by path rather than a read-modify-write of an array.
export const PUSH_TOKENS_COLLECTION = 'pushTokens';

export type PushMessage = {
  conversationId: string;
  senderUid: string;
  title: string;
  body: string;
};

export type PushRepository = {
  requestPermission: () => Promise<boolean>;
  getToken: () => Promise<string | null>;
  onTokenRefresh: (onToken: (token: string) => void) => () => void;
  saveToken: (uid: string, token: string) => Promise<void>;
  removeToken: (uid: string, token: string) => Promise<void>;
  // Fires when a notification is tapped while the app is running, and once at
  // launch if the app was started by tapping one.
  onNotificationOpened: (onOpen: (data: Record<string, string>) => void) => () => void;
  getInitialNotification: () => Promise<Record<string, string> | null>;
};

export const firebasePushRepository: PushRepository = {
  async requestPermission() {
    const status = await messaging.requestPermission(messaging.getMessaging());
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  },

  async getToken() {
    try {
      return await messaging.getToken(messaging.getMessaging());
    } catch {
      // No token is not an error worth surfacing: it means this build or
      // device cannot receive pushes, and everything else still works.
      return null;
    }
  },

  onTokenRefresh(onToken) {
    return messaging.onTokenRefresh(messaging.getMessaging(), onToken);
  },

  async saveToken(uid, token) {
    const db = firestore.getFirestore();
    await firestore.setDoc(
      firestore.doc(db, USERS_COLLECTION, uid, PUSH_TOKENS_COLLECTION, token),
      { token, updatedAt: firestore.serverTimestamp() },
    );
  },

  async removeToken(uid, token) {
    const db = firestore.getFirestore();
    await firestore.deleteDoc(
      firestore.doc(db, USERS_COLLECTION, uid, PUSH_TOKENS_COLLECTION, token),
    );
  },

  onNotificationOpened(onOpen) {
    return messaging.onNotificationOpenedApp(messaging.getMessaging(), (remoteMessage) => {
      if (remoteMessage?.data) onOpen(remoteMessage.data as Record<string, string>);
    });
  },

  async getInitialNotification() {
    const remoteMessage = await messaging.getInitialNotification(messaging.getMessaging());
    return (remoteMessage?.data as Record<string, string>) ?? null;
  },
};
