export type Message = {
  id: string;
  senderId: string;
  text: string;
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
