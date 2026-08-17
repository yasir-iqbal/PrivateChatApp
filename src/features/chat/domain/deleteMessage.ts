import { firestoreChatRepository, type ChatRepository } from '../data/chatRepository';
import { conversationIdFor } from './conversation';
import { canDeleteForEveryone, type Message } from './message';

export async function deleteMessageForMe(
  currentUid: string,
  otherUid: string,
  messageId: string,
  repo: ChatRepository = firestoreChatRepository,
): Promise<void> {
  await repo.deleteMessageForMe(conversationIdFor(currentUid, otherUid), messageId, currentUid);
}

export async function deleteMessageForEveryone(
  currentUid: string,
  otherUid: string,
  message: Message,
  repo: ChatRepository = firestoreChatRepository,
): Promise<void> {
  // Checked here as well as in the rules: the rules are the boundary, this is
  // so the failure is a clear message rather than a permission error.
  if (!canDeleteForEveryone(message, currentUid)) {
    throw new Error('This message can no longer be deleted for everyone.');
  }
  await repo.deleteMessageForEveryone(conversationIdFor(currentUid, otherUid), message.id);
}

// Messages hidden by this user are dropped entirely; ones withdrawn by their
// sender stay as a tombstone, so the other side can see that something was
// removed rather than history quietly changing.
export function visibleTo(messages: Message[], currentUid: string): Message[] {
  return messages.filter((message) => !message.deletedFor.includes(currentUid));
}
