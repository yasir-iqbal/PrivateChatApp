import { sendMessage } from './sendMessage';
import { MAX_MESSAGE_LENGTH } from './message';
import type { ChatRepository } from '../data/chatRepository';

function fakeRepo(): jest.Mocked<ChatRepository> {
  return {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    observeMessages: jest.fn(),
    observeConversationMeta: jest.fn(),
    markDelivered: jest.fn(),
    observeConversations: jest.fn(),
  };
}

describe('sendMessage', () => {
  it('writes to the conversation derived from both uids, with sorted participants', async () => {
    const repo = fakeRepo();

    await sendMessage('uid-b', 'uid-a', 'hello', repo);

    expect(repo.sendMessage).toHaveBeenCalledWith('uid-a_uid-b', ['uid-a', 'uid-b'], 'uid-b', 'hello');
  });

  it('trims the text before sending', async () => {
    const repo = fakeRepo();

    await sendMessage('uid-a', 'uid-b', '  hello  ', repo);

    expect(repo.sendMessage).toHaveBeenCalledWith(expect.any(String), expect.any(Array), 'uid-a', 'hello');
  });

  // Guarded in the domain, not just the UI, so no other caller can bypass it.
  it('refuses empty messages without touching the repository', async () => {
    const repo = fakeRepo();

    await expect(sendMessage('uid-a', 'uid-b', '   ', repo)).rejects.toThrow();
    expect(repo.sendMessage).not.toHaveBeenCalled();
  });

  it('refuses messages past the length limit', async () => {
    const repo = fakeRepo();

    await expect(sendMessage('uid-a', 'uid-b', 'a'.repeat(MAX_MESSAGE_LENGTH + 1), repo)).rejects.toThrow();
    expect(repo.sendMessage).not.toHaveBeenCalled();
  });
});
