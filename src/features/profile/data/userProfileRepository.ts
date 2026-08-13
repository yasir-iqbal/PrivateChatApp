import * as firestore from '@react-native-firebase/firestore';

// The publicly-readable half of a user. Firebase Auth profiles are only
// visible to their owner, so contact lookup needs this mirrored into
// Firestore where other signed-in users can read it.
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

// Maps a known email address to a uid, keyed *by the address itself* so
// lookup is a document get rather than a collection query. That distinction
// is what makes the rules enforceable: rules can allow `get` while denying
// `list`, so a signed-in user can resolve an address they already know but
// cannot enumerate the collection to harvest everyone else's.
export const EMAIL_INDEX_COLLECTION = 'emailIndex';

// Emails are stored and looked up lowercased: document IDs are
// case-sensitive, so "A@b.com" would otherwise miss "a@b.com".
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
    const email = normalizeEmail(profile.email);

    // Both writes land together, so the index can never point at a profile
    // that was never written.
    const batch = firestore.writeBatch(db);
    batch.set(
      firestore.doc(db, USERS_COLLECTION, profile.uid),
      {
        uid: profile.uid,
        email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        updatedAt: firestore.serverTimestamp(),
      },
      // merge so a re-sync never clobbers fields this client doesn't know about.
      { merge: true },
    );
    batch.set(
      firestore.doc(db, EMAIL_INDEX_COLLECTION, email),
      { uid: profile.uid, updatedAt: firestore.serverTimestamp() },
      { merge: true },
    );
    await batch.commit();
  },

  async findByEmail(email) {
    const db = firestore.getFirestore();
    const indexSnapshot = await firestore.getDoc(
      firestore.doc(db, EMAIL_INDEX_COLLECTION, normalizeEmail(email)),
    );
    const uid = indexSnapshot.data()?.uid;
    if (typeof uid !== 'string') return null;

    const profileSnapshot = await firestore.getDoc(firestore.doc(db, USERS_COLLECTION, uid));
    return toUserProfile(profileSnapshot.id, profileSnapshot.data());
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
