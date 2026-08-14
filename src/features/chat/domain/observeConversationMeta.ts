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

// Called by the *recipient* when they have the messages on screen. Marks
// everything up to now as delivered for them, which is what turns the
// sender's single tick into a double.
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
