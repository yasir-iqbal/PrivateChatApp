import * as firestore from '@react-native-firebase/firestore';

import type { Message } from '../domain/message';

export const CONVERSATIONS_COLLECTION = 'conversations';
export const MESSAGES_COLLECTION = 'messages';

// How many messages the chat screen keeps live. Older history needs paging,
// which this first cut does not do.
export const MESSAGE_PAGE_SIZE = 100;

// Per-participant high-water marks, keyed by uid. A message counts as
// delivered once the other participant's mark is at or past its send time.
export type ConversationMeta = {
  deliveredAt: Record<string, number>;
  readAt: Record<string, number>;
};

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
  observeConversationMeta: (
    conversationId: string,
    onChange: (meta: ConversationMeta) => void,
  ) => () => void;
  markDelivered: (conversationId: string, participants: string[], uid: string) => Promise<void>;
  observeConversations: (
    uid: string,
    onChange: (conversations: ConversationRecord[]) => void,
    onError: (error: Error) => void,
  ) => () => void;
};

export type ConversationRecord = {
  id: string;
  participants: string[];
  lastMessageText: string | null;
  lastMessageAt: number | null;
};

function toMillis(value: unknown): number | null {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

function toMillisMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  const result: Record<string, number> = {};
  for (const [uid, timestamp] of Object.entries(value as Record<string, unknown>)) {
    const millis = toMillis(timestamp);
    if (millis !== null) result[uid] = millis;
  }
  return result;
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

  observeConversationMeta(conversationId, onChange) {
    const db = firestore.getFirestore();
    return firestore.onSnapshot(
      firestore.doc(db, CONVERSATIONS_COLLECTION, conversationId),
      (snapshot) => {
        const data = snapshot.data() ?? {};
        onChange({
          deliveredAt: toMillisMap(data.deliveredAt),
          readAt: toMillisMap(data.readAt),
        });
      },
      // A conversation that doesn't exist yet is not an error, just empty.
      () => onChange({ deliveredAt: {}, readAt: {} }),
    );
  },

  async markDelivered(conversationId, participants, uid) {
    const db = firestore.getFirestore();
    await firestore.setDoc(
      firestore.doc(db, CONVERSATIONS_COLLECTION, conversationId),
      // participants is re-sent because the rules check it on every write; a
      // merge without it would leave request.resource.data missing the field.
      { participants, deliveredAt: { [uid]: firestore.serverTimestamp() } },
      { merge: true },
    );
  },

  observeConversations(uid, onChange, onError) {
    const db = firestore.getFirestore();
    return firestore.onSnapshot(
      firestore.query(
        firestore.collection(db, CONVERSATIONS_COLLECTION),
        firestore.where('participants', 'array-contains', uid),
        // Deliberately no orderBy. Combining it with array-contains would
        // require a composite index; ordering happens in the domain instead,
        // which is fine at the scale one person's conversation list reaches.
      ),
      (snapshot) => {
        onChange(
          snapshot.docs.map((document) => {
            const data = document.data() ?? {};
            return {
              id: document.id,
              participants: Array.isArray(data.participants) ? (data.participants as string[]) : [],
              lastMessageText: typeof data.lastMessageText === 'string' ? data.lastMessageText : null,
              lastMessageAt: toMillis(data.lastMessageAt),
            };
          }),
        );
      },
      onError,
    );
  },
};
