import { useEffect, useState } from 'react';

import { ONLINE_WINDOW_MS, presenceFrom, type Presence } from '../domain/presence';
import { observePresence } from '../domain/reportPresence';

// Watches one person's heartbeat and turns it into a presence.
//
// Re-evaluated on a timer as well as on each write, because someone going
// offline produces no event at all — their last heartbeat simply ages out, and
// nothing would re-render without a nudge.
export function useContactPresence(uid: string): Presence {
  const [lastActiveAt, setLastActiveAt] = useState<number | null>(null);
  const [presence, setPresence] = useState<Presence>({ status: 'unknown' });

  useEffect(() => {
    return observePresence(uid, setLastActiveAt);
  }, [uid]);

  useEffect(() => {
    setPresence(presenceFrom(lastActiveAt));
    if (lastActiveAt === null) return;

    const timer = setInterval(() => {
      setPresence(presenceFrom(lastActiveAt));
    }, ONLINE_WINDOW_MS / 3);

    return () => clearInterval(timer);
  }, [lastActiveAt]);

  return presence;
}
