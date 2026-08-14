import { useEffect, useState } from 'react';

import { markSeen, observeConversationMeta } from '../domain/observeConversationMeta';
import type { Message } from '../domain/message';

export type ConversationMetaState = {
  // The other participant's high-water marks, which decide our tick state.
  otherDeliveredAt: number | null;
  otherSeenAt: number | null;
};

export function useConversationMeta(
  currentUid: string,
  otherUid: string,
  messages: Message[],
): ConversationMetaState {
  const [otherDeliveredAt, setOtherDeliveredAt] = useState<number | null>(null);
  const [otherSeenAt, setOtherSeenAt] = useState<number | null>(null);

  useEffect(() => {
    return observeConversationMeta(currentUid, otherUid, (meta) => {
      setOtherDeliveredAt(meta.deliveredAt[otherUid] ?? null);
      setOtherSeenAt(meta.seenAt[otherUid] ?? null);
    });
  }, [currentUid, otherUid]);

  // Being on this screen with someone's message in front of you is what
  // "seen" means. Keyed by the newest incoming message so it reports once per
  // arrival rather than on every render.
  //
  // The screen stays mounted if the user navigates deeper rather than back, so
  // a message arriving then is marked seen slightly early. Fixing that needs
  // navigation focus state, which is not worth coupling this hook to yet.
  const newestIncoming = messages.reduce<number>(
    (newest, message) =>
      message.senderId !== currentUid ? Math.max(newest, message.clientSentAt) : newest,
    0,
  );

  useEffect(() => {
    if (newestIncoming === 0) return;
    markSeen(currentUid, otherUid).catch((error) => {
      // Failing to report only leaves the sender on a grey tick.
      console.warn('Failed to mark seen', error);
    });
  }, [currentUid, otherUid, newestIncoming]);

  return { otherDeliveredAt, otherSeenAt };
}
