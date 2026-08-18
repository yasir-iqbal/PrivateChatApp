import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

initializeApp();

// Mirrors the client's preview text, so a notification reads the same as the
// chat list row it corresponds to.
const PREVIEW_TEXT: Record<string, string> = {
  image: '📷 Photo',
  video: '🎥 Video',
  voice: '🎤 Voice message',
  location: '📍 Location',
};

function previewFor(type: string, text: string): string {
  return type === 'text' ? text : (PREVIEW_TEXT[type] ?? 'New message');
}

export const notifyOnMessage = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const senderUid: string = message.senderId;
    const { conversationId } = event.params;

    // The conversation ID is the two uids sorted and joined, so the recipient
    // can be derived without reading the parent document.
    const participants = conversationId.split('_');
    const recipientUid = participants.find((uid) => uid !== senderUid);
    if (!recipientUid) {
      logger.warn('No recipient in conversation', { conversationId });
      return;
    }

    const db = getFirestore();

    // Blocking is enforced in the rules for sending, but a message can predate
    // a block, and the rules do not run here. Checked again so a blocked
    // sender cannot reach the recipient through a notification.
    const blocked = await db
      .doc(`users/${recipientUid}/blocked/${senderUid}`)
      .get();
    if (blocked.exists) {
      logger.info('Recipient has blocked the sender; not notifying', { recipientUid });
      return;
    }

    const tokensSnapshot = await db
      .collection(`users/${recipientUid}/pushTokens`)
      .get();
    const tokens = tokensSnapshot.docs.map((doc) => doc.id);
    if (tokens.length === 0) return;

    const senderSnapshot = await db.doc(`users/${senderUid}`).get();
    const senderName =
      (senderSnapshot.get('displayName') as string | undefined) ??
      (senderSnapshot.get('email') as string | undefined) ??
      'New message';

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: senderName,
        body: previewFor(message.type ?? 'text', message.text ?? ''),
      },
      // The client reads these to open the right conversation when tapped.
      data: {
        senderUid,
        senderName,
        conversationId,
      },
      android: {
        priority: 'high',
        // Groups a conversation's notifications together rather than stacking
        // one per message.
        collapseKey: conversationId,
      },
      apns: {
        payload: { aps: { sound: 'default', threadId: conversationId } },
      },
    });

    // A token is invalidated when the app is uninstalled or its data cleared.
    // Left in place, every future send retries it forever.
    const stale: string[] = [];
    response.responses.forEach((result, index) => {
      const code = result.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        stale.push(tokens[index]);
      }
    });

    await Promise.all(
      stale.map((token) => db.doc(`users/${recipientUid}/pushTokens/${token}`).delete()),
    );

    logger.info('Notification sent', {
      recipientUid,
      delivered: response.successCount,
      failed: response.failureCount,
      pruned: stale.length,
    });
  },
);
