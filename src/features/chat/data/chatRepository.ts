import * as firestore from '@react-native-firebase/firestore';

import type { Message, MessageType } from '../domain/message';

export const CONVERSATIONS_COLLECTION = 'conversations';
export const MESSAGES_COLLECTION = 'messages';

// How many messages the chat screen keeps live. Older history needs paging,
// which this first cut does not do.
export const MESSAGE_PAGE_SIZE = 100;

// Anything unrecognised is read as text, so a message written by a newer
// client cannot crash an older one.
const MESSAGE_TYPES: MessageType[] = ['text', 'image', 'video', 'voice', 'location'];

// Per-participant high-water marks, keyed by uid. A message counts as
// delivered once the other participant's mark is at or past its send time.
export type ConversationMeta = {
  deliveredAt: Record<string, number>;
  seenAt: Record<string, number>;
};

export type ChatRepository = {
  sendMessage: (
    conversationId: string,
    participants: string[],
    senderId: string,
    message: OutgoingMessage,
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
  markSeen: (conversationId: string, participants: string[], uid: string) => Promise<void>;
  deleteMessageForMe: (conversationId: string, messageId: string, uid: string) => Promise<void>;
  deleteMessageForEveryone: (conversationId: string, messageId: string) => Promise<void>;
  observeConversations: (
    uid: string,
    onChange: (conversations: ConversationRecord[]) => void,
    onError: (error: Error) => void,
  ) => () => void;
};

export type OutgoingMessage = {
  type: MessageType;
  text: string;
  mediaUrl?: string;
  mediaAspectRatio?: number;
  durationMs?: number;
  latitude?: number;
  longitude?: number;
  // What the conversation's lastMessageText should read, which is not the
  // message text for a photo.
  preview: string;
};

export type ConversationRecord = {
  id: string;
  participants: string[];
  lastMessageText: string | null;
  lastMessageAt: number | null;
  // Lets the chat list tell an incoming conversation from one of our own, so
  // only the recipient reports delivery.
  lastMessageSenderId: string | null;
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
  async sendMessage(conversationId, participants, senderId, message) {
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
        lastMessageText: message.preview,
        lastMessageAt: firestore.serverTimestamp(),
        lastMessageSenderId: senderId,
        updatedAt: firestore.serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(messageRef, {
      senderId,
      type: message.type,
      text: message.text,
      ...(message.mediaUrl ? { mediaUrl: message.mediaUrl } : {}),
      ...(message.mediaAspectRatio ? { mediaAspectRatio: message.mediaAspectRatio } : {}),
      ...(message.durationMs !== undefined ? { durationMs: message.durationMs } : {}),
      ...(message.latitude !== undefined ? { latitude: message.latitude } : {}),
      ...(message.longitude !== undefined ? { longitude: message.longitude } : {}),
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
              type: MESSAGE_TYPES.includes(data.type as MessageType)
                ? (data.type as MessageType)
                : 'text',
              text: typeof data.text === 'string' ? data.text : '',
              mediaUrl: typeof data.mediaUrl === 'string' ? data.mediaUrl : null,
              mediaAspectRatio:
                typeof data.mediaAspectRatio === 'number' ? data.mediaAspectRatio : null,
              durationMs: typeof data.durationMs === 'number' ? data.durationMs : null,
              latitude: typeof data.latitude === 'number' ? data.latitude : null,
              longitude: typeof data.longitude === 'number' ? data.longitude : null,
              sentAt: toMillis(data.sentAt),
              clientSentAt: typeof data.clientSentAt === 'number' ? data.clientSentAt : 0,
              pending: document.metadata?.hasPendingWrites ?? false,
              deletedFor: Array.isArray(data.deletedFor) ? (data.deletedFor as string[]) : [],
              deletedForEveryone: data.deletedForEveryone === true,
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
          seenAt: toMillisMap(data.seenAt),
        });
      },
      // A conversation that doesn't exist yet is not an error, just empty.
      () => onChange({ deliveredAt: {}, seenAt: {} }),
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

  async markSeen(conversationId, participants, uid) {
    const db = firestore.getFirestore();
    // Seen implies delivered, so both marks move together — otherwise opening
    // a chat before the list had reported delivery would show a blue tick
    // that had never been a double one.
    await firestore.setDoc(
      firestore.doc(db, CONVERSATIONS_COLLECTION, conversationId),
      {
        participants,
        deliveredAt: { [uid]: firestore.serverTimestamp() },
        seenAt: { [uid]: firestore.serverTimestamp() },
      },
      { merge: true },
    );
  },

  async deleteMessageForMe(conversationId, messageId, uid) {
    const db = firestore.getFirestore();
    await firestore.updateDoc(
      firestore.doc(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION, messageId),
      // arrayUnion rather than a read-then-write: both participants can be
      // hiding the same message at once and neither should erase the other.
      { deletedFor: firestore.arrayUnion(uid) },
    );
  },

  async deleteMessageForEveryone(conversationId, messageId) {
    const db = firestore.getFirestore();
    // The text and any media reference are cleared as well as the flag, so the
    // content is genuinely gone rather than merely hidden by the client.
    await firestore.updateDoc(
      firestore.doc(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION, messageId),
      {
        deletedForEveryone: true,
        text: '',
        mediaUrl: firestore.deleteField(),
        durationMs: firestore.deleteField(),
        latitude: firestore.deleteField(),
        longitude: firestore.deleteField(),
      },
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
              lastMessageSenderId:
                typeof data.lastMessageSenderId === 'string' ? data.lastMessageSenderId : null,
            };
          }),
        );
      },
      onError,
    );
  },
};
