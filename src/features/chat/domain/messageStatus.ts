import type { Message } from './message';

// Sending -> sent -> delivered -> seen.
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';

// Delivery and seen are tracked per participant on the conversation as
// high-water marks rather than per message. One write marks everything up to
// that point, instead of a write per message.
//
// The two are reported from different places, which is what keeps them
// distinct: the chat list reports delivery when a message reaches the
// recipient's app, the chat screen reports seen when they actually open it.
export function messageStatusFor(
  message: Message,
  recipientDeliveredAt: number | null,
  recipientSeenAt: number | null = null,
): MessageStatus {
  if (message.pending || message.sentAt === null) return 'sending';
  if (recipientSeenAt !== null && recipientSeenAt >= message.sentAt) return 'seen';
  if (recipientDeliveredAt !== null && recipientDeliveredAt >= message.sentAt) return 'delivered';
  return 'sent';
}
