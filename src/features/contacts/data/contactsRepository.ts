import * as firestore from '@react-native-firebase/firestore';

import { USERS_COLLECTION } from '../../profile/data/userProfileRepository';

// A contact edge only records who and when. Names and photos are read live
// from the users collection instead of being copied here, so a contact who
// changes their avatar doesn't go stale in everyone else's list.
export type ContactEdge = {
  uid: string;
  addedAt: number | null;
};

export type ContactsRepository = {
  listContactEdges: (ownerUid: string) => Promise<ContactEdge[]>;
  addContact: (ownerUid: string, contactUid: string) => Promise<void>;
  removeContact: (ownerUid: string, contactUid: string) => Promise<void>;
};

export const CONTACTS_COLLECTION = 'contacts';

function toMillis(value: unknown): number | null {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

export const firestoreContactsRepository: ContactsRepository = {
  async listContactEdges(ownerUid) {
    const db = firestore.getFirestore();
    const snapshot = await firestore.getDocs(
      firestore.collection(db, USERS_COLLECTION, ownerUid, CONTACTS_COLLECTION),
    );
    return snapshot.docs.map((document) => ({
      uid: document.id,
      addedAt: toMillis(document.data()?.addedAt),
    }));
  },

  async addContact(ownerUid, contactUid) {
    const db = firestore.getFirestore();
    await firestore.setDoc(
      firestore.doc(db, USERS_COLLECTION, ownerUid, CONTACTS_COLLECTION, contactUid),
      { uid: contactUid, addedAt: firestore.serverTimestamp() },
      // Re-adding an existing contact is a no-op rather than an error.
      { merge: true },
    );
  },

  async removeContact(ownerUid, contactUid) {
    const db = firestore.getFirestore();
    await firestore.deleteDoc(
      firestore.doc(db, USERS_COLLECTION, ownerUid, CONTACTS_COLLECTION, contactUid),
    );
  },
};
