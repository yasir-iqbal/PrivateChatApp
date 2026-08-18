import { firestoreChatRepository, type ChatRepository } from '../data/chatRepository';
import { conversationIdFor } from './conversation';
import type { Message } from './message';

// How far back the gallery looks. Filtering happens here rather than in the
// query because combining a type filter with the ordering would need a
// composite index, so a window of recent messages is scanned instead.
export const MEDIA_SCAN_LIMIT = 200;

export type SharedMedia = {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  clientSentAt: number;
};

export function toSharedMedia(messages: Message[], currentUid: string): SharedMedia[] {
  return messages
    .filter(
      (message): message is Message & { mediaUrl: string } =>
        (message.type === 'image' || message.type === 'video') &&
        message.mediaUrl !== null &&
        // Anything withdrawn or hidden must not reappear in a gallery, which
        // would be a way around deleting it.
        !message.deletedForEveryone &&
        !message.deletedFor.includes(currentUid),
    )
    .map((message) => ({
      id: message.id,
      type: message.type as 'image' | 'video',
      mediaUrl: message.mediaUrl,
      clientSentAt: message.clientSentAt,
    }));
}

export async function listSharedMedia(
  currentUid: string,
  otherUid: string,
  repo: ChatRepository = firestoreChatRepository,
): Promise<SharedMedia[]> {
  const messages = await repo.listRecentMessages(
    conversationIdFor(currentUid, otherUid),
    MEDIA_SCAN_LIMIT,
  );
  return toSharedMedia(messages, currentUid);
}
