import { useEffect, useRef } from 'react';

import { markDelivered } from '../domain/observeConversationMeta';
import type { ConversationSummary } from '../domain/observeConversations';

// Reports delivery for conversations whose newest message came from the other
// person. Living on the chat list rather than the chat screen is what makes
// "delivered" mean something separate from "seen": the list is open whenever
// the app is, so a message is marked delivered on arrival, while seen waits
// for the recipient to actually open that conversation.
export function useDeliveryReporter(currentUid: string, conversations: ConversationSummary[]) {
  // Remembers what has already been reported so re-renders and unrelated
  // conversation updates don't rewrite the same watermark.
  const reported = useRef<Record<string, number>>({});

  // Effects can't depend on an array identity, so the incoming conversations
  // are flattened into a string that only changes when a new one arrives.
  const incomingKey = conversations
    .filter(
      (conversation) =>
        conversation.lastMessageSenderId !== null &&
        conversation.lastMessageSenderId !== currentUid &&
        conversation.lastMessageAt !== null,
    )
    .map((conversation) => `${conversation.otherUid}:${conversation.lastMessageAt}`)
    .sort()
    .join(',');

  useEffect(() => {
    if (incomingKey === '') return;
    for (const entry of incomingKey.split(',')) {
      const [otherUid, at] = entry.split(':');
      const lastMessageAt = Number(at);
      if (reported.current[otherUid] === lastMessageAt) continue;
      reported.current[otherUid] = lastMessageAt;
      markDelivered(currentUid, otherUid).catch((error) => {
        // Only costs the sender a second tick; the next arrival retries.
        console.warn('Failed to mark delivered', error);
      });
    }
  }, [currentUid, incomingKey]);
}
