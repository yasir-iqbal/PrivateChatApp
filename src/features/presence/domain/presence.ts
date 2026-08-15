export type Presence =
  | { status: 'online' }
  | { status: 'offline'; lastSeenAt: number }
  | { status: 'unknown' };

// How long after the last heartbeat someone still counts as online.
//
// Firestore has no onDisconnect hook — that only exists in Realtime Database —
// so there is no event when an app dies, loses signal, or is force-quit. The
// only workable substitute is a heartbeat plus a staleness window: stop
// hearing from someone and they go offline on their own.
export const HEARTBEAT_INTERVAL_MS = 30_000;

// Deliberately wider than the interval. At exactly one interval a single
// delayed write would flicker someone offline and straight back on.
export const ONLINE_WINDOW_MS = HEARTBEAT_INTERVAL_MS * 2 + 10_000;

export function presenceFrom(lastActiveAt: number | null, now: number = Date.now()): Presence {
  // Nobody who has never checked in should be reported as "last seen" at the
  // epoch; say nothing instead.
  if (lastActiveAt === null) return { status: 'unknown' };
  if (now - lastActiveAt < ONLINE_WINDOW_MS) return { status: 'online' };
  return { status: 'offline', lastSeenAt: lastActiveAt };
}

export function formatPresence(presence: Presence, now: number = Date.now()): string {
  if (presence.status === 'unknown') return '';
  if (presence.status === 'online') return 'online';

  const seen = new Date(presence.lastSeenAt);
  const time = seen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date(now);
  const isSameDay =
    seen.getDate() === today.getDate() &&
    seen.getMonth() === today.getMonth() &&
    seen.getFullYear() === today.getFullYear();
  if (isSameDay) return `last seen today at ${time}`;

  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  const isYesterday =
    seen.getDate() === yesterday.getDate() &&
    seen.getMonth() === yesterday.getMonth() &&
    seen.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return `last seen yesterday at ${time}`;

  return `last seen ${seen.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
}
