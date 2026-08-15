// Messages written before media existed have no type field, so absent means
// text rather than invalid.
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location';

export type Message = {
  id: string;
  senderId: string;
  type: MessageType;
  text: string;
  // Download URL of the uploaded file, for image, video and voice.
  mediaUrl: string | null;
  // Stored so an image or video bubble reserves the right shape before the
  // media loads, instead of jumping once it does.
  mediaAspectRatio: number | null;
  // Length of a voice note or video, so the bubble can show it before the
  // file is fetched.
  durationMs: number | null;
  // Location messages only.
  latitude: number | null;
  longitude: number | null;
  // Server time, authoritative but null until the write reaches the server.
  sentAt: number | null;
  // Client time, set immediately. Used for ordering so a just-sent message
  // appears in the right place instead of jumping once the server responds.
  clientSentAt: number;
  // True while the write is still local — drives the "sending" indicator.
  pending: boolean;
};

export const MAX_MESSAGE_LENGTH = 4000;

export function isSendableMessage(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH;
}

// What the chat list shows in place of media, since none of it has text.
export const PREVIEW_TEXT: Record<Exclude<MessageType, 'text'>, string> = {
  image: '📷 Photo',
  video: '🎥 Video',
  voice: '🎤 Voice message',
  location: '📍 Location',
};

export function messagePreview(message: Pick<Message, 'type' | 'text'>): string {
  return message.type === 'text' ? message.text : PREVIEW_TEXT[message.type];
}

export function formatDuration(millis: number): string {
  const totalSeconds = Math.max(0, Math.round(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
