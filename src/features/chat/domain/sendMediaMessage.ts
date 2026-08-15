import { nativeChatMediaRepository, type ChatMediaRepository } from '../data/chatMediaRepository';
import { firestoreChatRepository, type ChatRepository } from '../data/chatRepository';
import { conversationIdFor } from './conversation';
import { PREVIEW_TEXT } from './message';

type Deps = {
  mediaRepo?: ChatMediaRepository;
  repo?: ChatRepository;
};

// Every media send follows the same shape: get the thing, upload it, then
// write a message pointing at it. Uploading first means a message can never
// reference a file that did not finish uploading.
function participantsFor(senderUid: string, recipientUid: string) {
  return {
    conversationId: conversationIdFor(senderUid, recipientUid),
    participants: [senderUid, recipientUid].sort(),
  };
}

// Returns false when the picker was dismissed, so the caller can tell a
// cancellation apart from a failure.
export async function sendImageMessage(
  senderUid: string,
  recipientUid: string,
  source: 'library' | 'camera',
  { mediaRepo = nativeChatMediaRepository, repo = firestoreChatRepository }: Deps = {},
): Promise<boolean> {
  const picked = await mediaRepo.pickImage(source);
  if (!picked) return false;

  const { conversationId, participants } = participantsFor(senderUid, recipientUid);
  const compressed = await mediaRepo.compressImage(picked.uri);
  const mediaUrl = await mediaRepo.uploadImage(conversationId, compressed);

  await repo.sendMessage(conversationId, participants, senderUid, {
    type: 'image',
    text: '',
    mediaUrl,
    mediaAspectRatio: picked.height > 0 ? picked.width / picked.height : undefined,
    preview: PREVIEW_TEXT.image,
  });
  return true;
}

export async function sendVideoMessage(
  senderUid: string,
  recipientUid: string,
  source: 'library' | 'camera',
  { mediaRepo = nativeChatMediaRepository, repo = firestoreChatRepository }: Deps = {},
): Promise<boolean> {
  const picked = await mediaRepo.pickVideo(source);
  if (!picked) return false;

  const { conversationId, participants } = participantsFor(senderUid, recipientUid);
  // Not re-encoded: the picker already caps the duration, and transcoding on
  // device would need another native dependency for little gain.
  const mediaUrl = await mediaRepo.uploadVideo(conversationId, picked.uri);

  await repo.sendMessage(conversationId, participants, senderUid, {
    type: 'video',
    text: '',
    mediaUrl,
    mediaAspectRatio: picked.height > 0 ? picked.width / picked.height : undefined,
    durationMs: picked.durationMs,
    preview: PREVIEW_TEXT.video,
  });
  return true;
}

export async function sendVoiceMessage(
  senderUid: string,
  recipientUid: string,
  localUri: string,
  durationMs: number,
  { mediaRepo = nativeChatMediaRepository, repo = firestoreChatRepository }: Deps = {},
): Promise<void> {
  const { conversationId, participants } = participantsFor(senderUid, recipientUid);
  const mediaUrl = await mediaRepo.uploadVoice(conversationId, localUri);

  await repo.sendMessage(conversationId, participants, senderUid, {
    type: 'voice',
    text: '',
    mediaUrl,
    durationMs,
    preview: PREVIEW_TEXT.voice,
  });
}

export async function sendLocationMessage(
  senderUid: string,
  recipientUid: string,
  { mediaRepo = nativeChatMediaRepository, repo = firestoreChatRepository }: Deps = {},
): Promise<void> {
  const { conversationId, participants } = participantsFor(senderUid, recipientUid);
  const position = await mediaRepo.getCurrentPosition();

  await repo.sendMessage(conversationId, participants, senderUid, {
    type: 'location',
    text: '',
    latitude: position.latitude,
    longitude: position.longitude,
    preview: PREVIEW_TEXT.location,
  });
}
