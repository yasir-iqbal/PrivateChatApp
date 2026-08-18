import { toNotificationTarget } from './notificationTarget';

describe('toNotificationTarget', () => {
  it('reads the sender out of the payload', () => {
    expect(toNotificationTarget({ senderUid: 'uid-bob', senderName: 'Bob' })).toEqual({
      contactUid: 'uid-bob',
      contactName: 'Bob',
    });
  });

  // A payload missing the name should still open the chat rather than being
  // thrown away.
  it('falls back to a placeholder name', () => {
    expect(toNotificationTarget({ senderUid: 'uid-bob' })).toEqual({
      contactUid: 'uid-bob',
      contactName: 'Chat',
    });
    expect(toNotificationTarget({ senderUid: 'uid-bob', senderName: '' })?.contactName).toBe('Chat');
  });

  // The payload comes from outside the app, so nothing about it is assumed.
  it('is null without a usable sender', () => {
    expect(toNotificationTarget(null)).toBeNull();
    expect(toNotificationTarget(undefined)).toBeNull();
    expect(toNotificationTarget({})).toBeNull();
    expect(toNotificationTarget({ senderUid: '' })).toBeNull();
  });
});
