import * as firestore from '@react-native-firebase/firestore';

// The publicly-readable half of a user. Firebase Auth profiles are only
// visible to their owner, so contact lookup needs this mirrored into
// Firestore where other signed-in users can query it.
export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
};

export type UserProfileRepository = {
  upsertProfile: (profile: UserProfile) => Promise<void>;
  findByEmail: (email: string) => Promise<UserProfile | null>;
  getProfiles: (uids: string[]) => Promise<UserProfile[]>;
};

export const USERS_COLLECTION = 'users';

// Emails are stored and queried lowercased: Firestore's `==` is
// case-sensitive, so "A@b.com" would otherwise never match "a@b.com".
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toUserProfile(uid: string, data: Record<string, unknown> | undefined): UserProfile | null {
  if (!data || typeof data.email !== 'string') return null;
  return {
    uid,
    email: data.email,
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
  };
}

export const firestoreUserProfileRepository: UserProfileRepository = {
  async upsertProfile(profile) {
    const db = firestore.getFirestore();
    await firestore.setDoc(
      firestore.doc(db, USERS_COLLECTION, profile.uid),
      {
        uid: profile.uid,
        email: normalizeEmail(profile.email),
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        updatedAt: firestore.serverTimestamp(),
      },
      // merge so a re-sync never clobbers fields this client doesn't know about.
      { merge: true },
    );
  },

  async findByEmail(email) {
    const db = firestore.getFirestore();
    const snapshot = await firestore.getDocs(
      firestore.query(
        firestore.collection(db, USERS_COLLECTION),
        firestore.where('email', '==', normalizeEmail(email)),
        firestore.limit(1),
      ),
    );
    const match = snapshot.docs[0];
    return match ? toUserProfile(match.id, match.data()) : null;
  },

  async getProfiles(uids) {
    const db = firestore.getFirestore();
    const snapshots = await Promise.all(
      uids.map((uid) => firestore.getDoc(firestore.doc(db, USERS_COLLECTION, uid))),
    );
    return snapshots
      .map((snapshot) => toUserProfile(snapshot.id, snapshot.data()))
      .filter((profile): profile is UserProfile => profile !== null);
  },
};
