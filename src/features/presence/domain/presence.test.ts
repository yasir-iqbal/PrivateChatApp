import {
  formatPresence,
  HEARTBEAT_INTERVAL_MS,
  ONLINE_WINDOW_MS,
  presenceFrom,
} from './presence';

const NOW = new Date('2026-08-15T14:30:00').getTime();
const DAY = 24 * 60 * 60 * 1000;

describe('presenceFrom', () => {
  it('is online for a recent heartbeat', () => {
    expect(presenceFrom(NOW - 1000, NOW)).toEqual({ status: 'online' });
  });

  it('is offline once the heartbeat has aged out', () => {
    const lastSeenAt = NOW - ONLINE_WINDOW_MS - 1;
    expect(presenceFrom(lastSeenAt, NOW)).toEqual({ status: 'offline', lastSeenAt });
  });

  // A single delayed write must not flicker someone offline and back on, so
  // the window has to be comfortably wider than the beat.
  it('stays online across a missed heartbeat', () => {
    expect(presenceFrom(NOW - HEARTBEAT_INTERVAL_MS * 2, NOW)).toEqual({ status: 'online' });
  });

  // Someone who has never checked in should not be reported as last seen at
  // the epoch.
  it('is unknown when there is no heartbeat at all', () => {
    expect(presenceFrom(null, NOW)).toEqual({ status: 'unknown' });
  });
});

describe('formatPresence', () => {
  it('says online', () => {
    expect(formatPresence({ status: 'online' }, NOW)).toBe('online');
  });

  it('says nothing at all when presence is unknown', () => {
    expect(formatPresence({ status: 'unknown' }, NOW)).toBe('');
  });

  it('uses today for earlier the same day', () => {
    const lastSeenAt = new Date('2026-08-15T09:15:00').getTime();
    expect(formatPresence({ status: 'offline', lastSeenAt }, NOW)).toMatch(/^last seen today at /);
  });

  it('uses yesterday for the previous day', () => {
    const lastSeenAt = new Date('2026-08-14T22:00:00').getTime();
    expect(formatPresence({ status: 'offline', lastSeenAt }, NOW)).toMatch(/^last seen yesterday at /);
  });

  it('falls back to a date further back', () => {
    const lastSeenAt = NOW - DAY * 5;
    const formatted = formatPresence({ status: 'offline', lastSeenAt }, NOW);
    expect(formatted).toMatch(/^last seen /);
    expect(formatted).not.toMatch(/today|yesterday/);
  });
});
