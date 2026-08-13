import { conversationIdFor } from './conversation';

describe('conversationIdFor', () => {
  // Both clients derive the ID independently. If it depended on who asked,
  // two people opening the chat at once would create two conversations and
  // each would only see half the messages.
  it('produces the same ID regardless of argument order', () => {
    expect(conversationIdFor('uid-b', 'uid-a')).toBe(conversationIdFor('uid-a', 'uid-b'));
  });

  it('sorts the uids into the ID', () => {
    expect(conversationIdFor('uid-b', 'uid-a')).toBe('uid-a_uid-b');
  });

  it('distinguishes different pairs', () => {
    expect(conversationIdFor('uid-a', 'uid-b')).not.toBe(conversationIdFor('uid-a', 'uid-c'));
  });
});
