import * as firestore from '@react-native-firebase/firestore';

import type { Message } from '../domain/message';

export const CONVERSATIONS_COLLECTION = 'conversations';
export const MESSAGES_COLLECTION = 'messages';

// How many messages the chat screen keeps live. Older history needs paging,
// which this first cut does not do.
export const MESSAGE_PAGE_SIZE = 100;

export type ChatRepository = {
  sendMessage: (
    conversationId: string,
    participants: string[],
    senderId: string,
    text: string,
  ) => Promise<void>;
  observeMessages: (
    conversationId: string,
    onChange: (messages: Message[]) => void,
    onError: (error: Error) => void,
  ) => () => void;
};

function toMillis(value: unknown): number | null {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

export const firestoreChatRepository: ChatRepository = {
  async sendMessage(conversationId, participants, senderId, text) {
    const db = firestore.getFirestore();
    const conversationRef = firestore.doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const messageRef = firestore.doc(
      firestore.collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION),
    );
    const clientSentAt = Date.now();

    // One batch so a message can never exist without its conversation, which
    // would make it unreadable — the rules authorise messages via the parent's
    // participants list.
    const batch = firestore.writeBatch(db);
    batch.set(
      conversationRef,
      {
        participants,
        lastMessageText: text,
        lastMessageAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(messageRef, {
      senderId,
      text,
      sentAt: firestore.serverTimestamp(),
      clientSentAt,
    });
    await batch.commit();
  },

  observeMessages(conversationId, onChange, onError) {
    const db = firestore.getFirestore();
    return firestore.onSnapshot(
      firestore.query(
        firestore.collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION),
        // Ordered by client time, not server time: a serverTimestamp is null
        // in the local cache until it round-trips, which would sort a just-sent
        // message to the wrong end of the list for a moment.
        firestore.orderBy('clientSentAt', 'desc'),
        firestore.limit(MESSAGE_PAGE_SIZE),
      ),
      (snapshot) => {
        onChange(
          snapshot.docs.map((document) => {
            const data = document.data() ?? {};
            return {
              id: document.id,
              senderId: typeof data.senderId === 'string' ? data.senderId : '',
              text: typeof data.text === 'string' ? data.text : '',
              sentAt: toMillis(data.sentAt),
              clientSentAt: typeof data.clientSentAt === 'number' ? data.clientSentAt : 0,
              pending: document.metadata?.hasPendingWrites ?? false,
            };
          }),
        );
      },
      onError,
    );
  },
};
