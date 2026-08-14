import { observeConversations, type ConversationSummary } from './observeConversations';
import type { ChatRepository, ConversationRecord } from '../data/chatRepository';

function fakeRepo(records: ConversationRecord[]): jest.Mocked<ChatRepository> {
  return {
    sendMessage: jest.fn(),
    observeMessages: jest.fn(),
    observeConversationMeta: jest.fn(),
    markDelivered: jest.fn(),
    observeConversations: jest.fn(
      (
        _uid: string,
        onChange: (conversations: ConversationRecord[]) => void,
        _onError: (error: Error) => void,
      ) => {
        onChange(records);
        return jest.fn();
      },
    ),
  };
}

function capture(records: ConversationRecord[]): ConversationSummary[] {
  let captured: ConversationSummary[] = [];
  observeConversations('uid-me', (summaries) => { captured = summaries; }, jest.fn(), fakeRepo(records));
  return captured;
}

describe('observeConversations', () => {
  it('identifies the other participant in each conversation', () => {
    const result = capture([
      { id: 'c1', participants: ['uid-me', 'uid-bob'], lastMessageText: 'hi', lastMessageAt: 5 },
    ]);

    expect(result[0].otherUid).toBe('uid-bob');
    expect(result[0].lastMessageText).toBe('hi');
  });

  // The query returns unordered documents because array-contains plus orderBy
  // would need a composite index; ordering is this function's job.
  it('orders most recently active first', () => {
    const result = capture([
      { id: 'old', participants: ['uid-me', 'uid-a'], lastMessageText: 'x', lastMessageAt: 1 },
      { id: 'new', participants: ['uid-me', 'uid-b'], lastMessageText: 'y', lastMessageAt: 9 },
      { id: 'mid', participants: ['uid-me', 'uid-c'], lastMessageText: 'z', lastMessageAt: 5 },
    ]);

    expect(result.map((row) => row.id)).toEqual(['new', 'mid', 'old']);
  });

  it('sorts conversations with no messages last', () => {
    const result = capture([
      { id: 'empty', participants: ['uid-me', 'uid-a'], lastMessageText: null, lastMessageAt: null },
      { id: 'active', participants: ['uid-me', 'uid-b'], lastMessageText: 'y', lastMessageAt: 3 },
    ]);

    expect(result.map((row) => row.id)).toEqual(['active', 'empty']);
  });

  // A row with nobody to name would render blank and go nowhere when tapped.
  it('drops malformed conversations with no other participant', () => {
    const result = capture([
      { id: 'broken', participants: ['uid-me'], lastMessageText: 'x', lastMessageAt: 1 },
      { id: 'ok', participants: ['uid-me', 'uid-b'], lastMessageText: 'y', lastMessageAt: 2 },
    ]);

    expect(result.map((row) => row.id)).toEqual(['ok']);
  });
});
