import { firestoreChatRepository, type ChatRepository } from '../data/chatRepository';
import { conversationIdFor } from './conversation';
import { isSendableMessage } from './message';

export async function sendMessage(
  senderUid: string,
  recipientUid: string,
  text: string,
  repo: ChatRepository = firestoreChatRepository,
): Promise<void> {
  const trimmed = text.trim();
  // Guarded here rather than only in the UI so an empty or oversized message
  // can't reach Firestore through any other caller.
  if (!isSendableMessage(trimmed)) {
    throw new Error('Message is empty or too long.');
  }

  await repo.sendMessage(
    conversationIdFor(senderUid, recipientUid),
    [senderUid, recipientUid].sort(),
    senderUid,
    { type: 'text', text: trimmed, preview: trimmed },
  );
}
