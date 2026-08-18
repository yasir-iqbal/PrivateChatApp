// What the Cloud Function puts in the notification's data payload, and what
// the app needs to open the right conversation when it is tapped.
export type NotificationTarget = {
  contactUid: string;
  contactName: string;
};

// Payload values arrive as strings and come from outside the app, so nothing
// is assumed about their shape.
export function toNotificationTarget(
  data: Record<string, string> | null | undefined,
): NotificationTarget | null {
  if (!data) return null;
  const contactUid = data.senderUid;
  if (typeof contactUid !== 'string' || contactUid === '') return null;
  return {
    contactUid,
    // Falls back so a payload without a name still opens the chat rather than
    // being discarded.
    contactName: typeof data.senderName === 'string' && data.senderName !== ''
      ? data.senderName
      : 'Chat',
  };
}
