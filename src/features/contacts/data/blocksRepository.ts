import * as firestore from '@react-native-firebase/firestore';

import { USERS_COLLECTION } from '../../profile/data/userProfileRepository';

// Who a user has blocked, as a subcollection of their own document so the
// list stays private to them. The rules guarding message creation read it
// with get(), which bypasses read permissions — so the sender never needs to
// see the recipient's list to be stopped by it.
export const BLOCKED_COLLECTION = 'blocked';

export type BlocksRepository = {
  observeBlocked: (ownerUid: string, onChange: (blockedUids: string[]) => void) => () => void;
  block: (ownerUid: string, blockedUid: string) => Promise<void>;
  unblock: (ownerUid: string, blockedUid: string) => Promise<void>;
};

export const firestoreBlocksRepository: BlocksRepository = {
  observeBlocked(ownerUid, onChange) {
    const db = firestore.getFirestore();
    return firestore.onSnapshot(
      firestore.collection(db, USERS_COLLECTION, ownerUid, BLOCKED_COLLECTION),
      (snapshot) => onChange(snapshot.docs.map((document) => document.id)),
      // An empty or unreadable list must not break the chat; it just means no
      // block is known.
      () => onChange([]),
    );
  },

  async block(ownerUid, blockedUid) {
    const db = firestore.getFirestore();
    // The uid is the document ID so the rules can check existence by path
    // rather than reading and searching a list.
    await firestore.setDoc(
      firestore.doc(db, USERS_COLLECTION, ownerUid, BLOCKED_COLLECTION, blockedUid),
      { uid: blockedUid, blockedAt: firestore.serverTimestamp() },
    );
  },

  async unblock(ownerUid, blockedUid) {
    const db = firestore.getFirestore();
    await firestore.deleteDoc(
      firestore.doc(db, USERS_COLLECTION, ownerUid, BLOCKED_COLLECTION, blockedUid),
    );
  },
};
