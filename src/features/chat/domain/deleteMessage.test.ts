import { deleteMessageForEveryone, deleteMessageForMe, visibleTo } from './deleteMessage';
import { DELETE_FOR_EVERYONE_WINDOW_MS, type Message } from './message';
import type { ChatRepository } from '../data/chatRepository';

function fakeRepo(): jest.Mocked<ChatRepository> {
  return {
    sendMessage: jest.fn(),
    observeMessages: jest.fn(),
    observeConversationMeta: jest.fn(),
    markDelivered: jest.fn(),
    markSeen: jest.fn(),
    listRecentMessages: jest.fn(),
    deleteMessageForMe: jest.fn().mockResolvedValue(undefined),
    deleteMessageForEveryone: jest.fn().mockResolvedValue(undefined),
    observeConversations: jest.fn(),
  };
}

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    senderId: 'uid-me',
    type: 'text',
    text: 'hello',
    mediaUrl: null,
    mediaAspectRatio: null,
    durationMs: null,
    latitude: null,
    longitude: null,
    sentAt: Date.now(),
    clientSentAt: Date.now(),
    pending: false,
    deletedFor: [],
    deletedForEveryone: false,
    ...overrides,
  };
}

describe('deleteMessageForMe', () => {
  it('hides the message for the requesting user only', async () => {
    const repo = fakeRepo();

    await deleteMessageForMe('uid-me', 'uid-bob', 'm1', repo);

    expect(repo.deleteMessageForMe).toHaveBeenCalledWith('uid-bob_uid-me', 'm1', 'uid-me');
  });
});

describe('deleteMessageForEveryone', () => {
  it('withdraws your own recent message', async () => {
    const repo = fakeRepo();

    await deleteMessageForEveryone('uid-me', 'uid-bob', message(), repo);

    expect(repo.deleteMessageForEveryone).toHaveBeenCalledWith('uid-bob_uid-me', 'm1');
  });

  // Guarded here as well as in the rules, so the user gets a sentence rather
  // than a permission error.
  it('refuses someone else’s message', async () => {
    const repo = fakeRepo();

    await expect(
      deleteMessageForEveryone('uid-me', 'uid-bob', message({ senderId: 'uid-bob' }), repo),
    ).rejects.toThrow('can no longer be deleted');
    expect(repo.deleteMessageForEveryone).not.toHaveBeenCalled();
  });

  it('refuses a message older than the window', async () => {
    const repo = fakeRepo();
    const stale = message({ sentAt: Date.now() - DELETE_FOR_EVERYONE_WINDOW_MS - 1000 });

    await expect(deleteMessageForEveryone('uid-me', 'uid-bob', stale, repo)).rejects.toThrow();
    expect(repo.deleteMessageForEveryone).not.toHaveBeenCalled();
  });

  // Without a server timestamp there is no trustworthy clock to measure the
  // window against.
  it('refuses a message that has not reached the server', async () => {
    const repo = fakeRepo();

    await expect(
      deleteMessageForEveryone('uid-me', 'uid-bob', message({ sentAt: null }), repo),
    ).rejects.toThrow();
  });

  it('refuses a message already withdrawn', async () => {
    const repo = fakeRepo();

    await expect(
      deleteMessageForEveryone('uid-me', 'uid-bob', message({ deletedForEveryone: true }), repo),
    ).rejects.toThrow();
  });
});

describe('visibleTo', () => {
  it('drops messages this user hid', () => {
    const messages = [message({ id: 'kept' }), message({ id: 'hidden', deletedFor: ['uid-me'] })];

    expect(visibleTo(messages, 'uid-me').map((m) => m.id)).toEqual(['kept']);
  });

  // Hiding is per person: the other side keeps seeing it.
  it('keeps messages the other participant hid', () => {
    const messages = [message({ id: 'm1', deletedFor: ['uid-bob'] })];

    expect(visibleTo(messages, 'uid-me').map((m) => m.id)).toEqual(['m1']);
  });

  // A withdrawn message stays as a tombstone rather than vanishing, so the
  // other side can tell that something was removed.
  it('keeps messages withdrawn for everyone', () => {
    const messages = [message({ id: 'm1', deletedForEveryone: true })];

    expect(visibleTo(messages, 'uid-me').map((m) => m.id)).toEqual(['m1']);
  });
});
