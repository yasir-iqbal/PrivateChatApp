import { firestoreChatRepository, type ChatRepository } from '../data/chatRepository';
import { conversationIdFor } from './conversation';
import type { Message } from './message';

export function observeMessages(
  currentUid: string,
  otherUid: string,
  onChange: (messages: Message[]) => void,
  onError: (error: Error) => void,
  repo: ChatRepository = firestoreChatRepository,
): () => void {
  return repo.observeMessages(conversationIdFor(currentUid, otherUid), onChange, onError);
}

// Newest-first from the query (so the limit keeps recent messages, not the
// oldest ones), flipped here because the UI reads top to bottom.
export function toChronological(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.clientSentAt - b.clientSentAt);
}
