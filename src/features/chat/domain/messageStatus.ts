import type { Message } from './message';

// WhatsApp's four states. 'read' is wired through the type and the tick
// component now, but nothing reports it yet — that arrives with read receipts.
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

// Delivery is tracked per participant on the conversation as a high-water
// mark rather than per message. One write when someone opens the chat marks
// everything up to that point delivered, instead of a write per message.
export function messageStatusFor(
  message: Message,
  recipientDeliveredAt: number | null,
  recipientReadAt: number | null = null,
): MessageStatus {
  if (message.pending || message.sentAt === null) return 'pending';
  if (recipientReadAt !== null && recipientReadAt >= message.sentAt) return 'read';
  if (recipientDeliveredAt !== null && recipientDeliveredAt >= message.sentAt) return 'delivered';
  return 'sent';
}
