import { firestoreChatRepository, type ChatRepository } from '../data/chatRepository';
import { nativeChatMediaRepository, type ChatMediaRepository } from '../data/chatMediaRepository';
import { conversationIdFor } from './conversation';
import { IMAGE_PREVIEW_TEXT, isSendableMessage } from './message';

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

// Returns false when the picker was dismissed, so the caller can tell a
// cancellation apart from a failure.
export async function sendImageMessage(
  senderUid: string,
  recipientUid: string,
  source: 'library' | 'camera',
  mediaRepo: ChatMediaRepository = nativeChatMediaRepository,
  repo: ChatRepository = firestoreChatRepository,
): Promise<boolean> {
  const picked = await mediaRepo.pickImage(source);
  if (!picked) return false;

  const conversationId = conversationIdFor(senderUid, recipientUid);
  const compressed = await mediaRepo.compressImage(picked.uri);
  // Uploaded before the message is written, so a message can never point at a
  // file that does not exist.
  const mediaUrl = await mediaRepo.uploadImage(conversationId, compressed);

  await repo.sendMessage(conversationId, [senderUid, recipientUid].sort(), senderUid, {
    type: 'image',
    text: '',
    mediaUrl,
    mediaAspectRatio: picked.height > 0 ? picked.width / picked.height : undefined,
    preview: IMAGE_PREVIEW_TEXT,
  });
  return true;
}
