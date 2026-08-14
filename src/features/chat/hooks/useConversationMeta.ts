import { useEffect, useState } from 'react';

import { markDelivered, observeConversationMeta } from '../domain/observeConversationMeta';
import type { Message } from '../domain/message';

export type ConversationMetaState = {
  // The other participant's high-water marks, which decide our tick state.
  otherDeliveredAt: number | null;
  otherReadAt: number | null;
};

export function useConversationMeta(
  currentUid: string,
  otherUid: string,
  messages: Message[],
): ConversationMetaState {
  const [otherDeliveredAt, setOtherDeliveredAt] = useState<number | null>(null);
  const [otherReadAt, setOtherReadAt] = useState<number | null>(null);

  useEffect(() => {
    return observeConversationMeta(currentUid, otherUid, (meta) => {
      setOtherDeliveredAt(meta.deliveredAt[otherUid] ?? null);
      setOtherReadAt(meta.readAt[otherUid] ?? null);
    });
  }, [currentUid, otherUid]);

  // Announce delivery whenever a message we didn't send is on screen. Keyed by
  // the newest incoming message so it fires once per arrival, not per render.
  const newestIncoming = messages.reduce<number>(
    (newest, message) =>
      message.senderId !== currentUid ? Math.max(newest, message.clientSentAt) : newest,
    0,
  );

  useEffect(() => {
    if (newestIncoming === 0) return;
    markDelivered(currentUid, otherUid).catch((error) => {
      // Failing to report delivery only leaves the sender on one tick.
      console.warn('Failed to mark delivered', error);
    });
  }, [currentUid, otherUid, newestIncoming]);

  return { otherDeliveredAt, otherReadAt };
}
