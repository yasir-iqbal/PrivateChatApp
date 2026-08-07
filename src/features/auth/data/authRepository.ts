import * as firebaseAuth from '@react-native-firebase/auth';
import type { Unsubscribe, User } from '@react-native-firebase/auth';

export type AuthRepository = {
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<User>;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<User>;
  signInWithGoogleIdToken: (idToken: string) => Promise<User>;
  signOut: () => Promise<void>;
  sendEmailVerification: (user: User) => Promise<void>;
  updateDisplayName: (user: User, displayName: string) => Promise<void>;
  reloadUser: (user: User) => Promise<void>;
  subscribeToAuthState: (callback: (user: User | null) => void) => Unsubscribe;
};

export const firebaseAuthRepository: AuthRepository = {
  async createUserWithEmailAndPassword(email, password) {
    const auth = firebaseAuth.getAuth();
    const result = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  async signInWithEmailAndPassword(email, password) {
    const auth = firebaseAuth.getAuth();
    const result = await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  async signInWithGoogleIdToken(idToken) {
    const auth = firebaseAuth.getAuth();
    const credential = firebaseAuth.GoogleAuthProvider.credential(idToken);
    const result = await firebaseAuth.signInWithCredential(auth, credential);
    return result.user;
  },

  async signOut() {
    const auth = firebaseAuth.getAuth();
    await firebaseAuth.signOut(auth);
  },

  async sendEmailVerification(user) {
    await firebaseAuth.sendEmailVerification(user);
  },

  async updateDisplayName(user, displayName) {
    await firebaseAuth.updateProfile(user, { displayName });
  },

  async reloadUser(user) {
    await firebaseAuth.reload(user);
  },

  subscribeToAuthState(callback) {
    const auth = firebaseAuth.getAuth();
    return firebaseAuth.onAuthStateChanged(auth, callback);
  },
};
