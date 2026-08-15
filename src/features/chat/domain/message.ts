// Messages written before media existed have no type field, so absent means
// text rather than invalid.
export type MessageType = 'text' | 'image';

export type Message = {
  id: string;
  senderId: string;
  type: MessageType;
  text: string;
  // Set for image messages; the download URL of the uploaded file.
  mediaUrl: string | null;
  // Stored so the bubble can reserve the right shape before the image loads,
  // instead of jumping once it does.
  mediaAspectRatio: number | null;
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

// What the chat list shows in place of a photo, since there is no text.
export const IMAGE_PREVIEW_TEXT = '\uD83D\uDCF7 Photo';

export function messagePreview(message: Pick<Message, 'type' | 'text'>): string {
  return message.type === 'image' ? IMAGE_PREVIEW_TEXT : message.text;
}
