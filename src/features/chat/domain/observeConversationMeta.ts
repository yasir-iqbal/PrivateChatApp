import {
  firestoreChatRepository,
  type ChatRepository,
  type ConversationMeta,
} from '../data/chatRepository';
import { conversationIdFor } from './conversation';

export function observeConversationMeta(
  currentUid: string,
  otherUid: string,
  onChange: (meta: ConversationMeta) => void,
  repo: ChatRepository = firestoreChatRepository,
): () => void {
  return repo.observeConversationMeta(conversationIdFor(currentUid, otherUid), onChange);
}

// Reported from the chat *list*: the message has reached the recipient's app,
// but they have not necessarily looked at it. This is what turns the sender's
// single tick into a double one.
export async function markDelivered(
  currentUid: string,
  otherUid: string,
  repo: ChatRepository = firestoreChatRepository,
): Promise<void> {
  await repo.markDelivered(
    conversationIdFor(currentUid, otherUid),
    [currentUid, otherUid].sort(),
    currentUid,
  );
}

// Reported from the chat *screen*: the recipient has the conversation open.
// This is what turns the double tick blue.
export async function markSeen(
  currentUid: string,
  otherUid: string,
  repo: ChatRepository = firestoreChatRepository,
): Promise<void> {
  await repo.markSeen(
    conversationIdFor(currentUid, otherUid),
    [currentUid, otherUid].sort(),
    currentUid,
  );
}
