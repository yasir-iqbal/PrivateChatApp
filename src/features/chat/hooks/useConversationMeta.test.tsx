import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useConversationMeta } from './useConversationMeta';
import { markSeen, observeConversationMeta } from '../domain/observeConversationMeta';
import type { ConversationMeta } from '../data/chatRepository';
import type { Message } from '../domain/message';

jest.mock('../domain/observeConversationMeta');

const mockObserve = observeConversationMeta as jest.MockedFunction<typeof observeConversationMeta>;
const mockMarkSeen = markSeen as jest.MockedFunction<typeof markSeen>;

function message(senderId: string, clientSentAt: number): Message {
  return { id: `m${clientSentAt}`, senderId, type: 'text', mediaUrl: null, mediaAspectRatio: null, durationMs: null, latitude: null, longitude: null, address: null, deletedFor: [], deletedForEveryone: false, text: 'x', sentAt: clientSentAt, clientSentAt, pending: false };
}

describe('useConversationMeta', () => {
  beforeEach(() => {
    mockMarkSeen.mockResolvedValue(undefined);
    mockObserve.mockReturnValue(jest.fn());
  });

  it('exposes the other participant marks, not our own', async () => {
    let emit: ((meta: ConversationMeta) => void) | undefined;
    mockObserve.mockImplementation((_a, _b, onChange) => {
      emit = onChange;
      return jest.fn();
    });

    const { result } = renderHook(() => useConversationMeta('uid-me', 'uid-bob', []));
    act(() => emit?.({ deliveredAt: { 'uid-bob': 500, 'uid-me': 900 }, seenAt: { 'uid-bob': 400 } }));

    await waitFor(() => expect(result.current.otherDeliveredAt).toBe(500));
    expect(result.current.otherSeenAt).toBe(400);
  });

  it('reports seen when an incoming message is on screen', async () => {
    renderHook(() => useConversationMeta('uid-me', 'uid-bob', [message('uid-bob', 1)]));

    await waitFor(() => expect(mockMarkSeen).toHaveBeenCalledWith('uid-me', 'uid-bob'));
  });

  // Otherwise every sender would mark their own messages seen by
  // themselves, and the blue tick would never mean anything.
  it('does not report seen for our own messages', () => {
    renderHook(() => useConversationMeta('uid-me', 'uid-bob', [message('uid-me', 1)]));

    expect(mockMarkSeen).not.toHaveBeenCalled();
  });

  it('reports once per arrival rather than on every render', async () => {
    const messages = [message('uid-bob', 1)];
    const { rerender } = renderHook<void, { messages: Message[] }>(
      ({ messages: m }) => useConversationMeta('uid-me', 'uid-bob', m),
      { initialProps: { messages } },
    );

    await waitFor(() => expect(mockMarkSeen).toHaveBeenCalledTimes(1));
    rerender({ messages: [...messages] });
    expect(mockMarkSeen).toHaveBeenCalledTimes(1);

    rerender({ messages: [...messages, message('uid-bob', 2)] });
    await waitFor(() => expect(mockMarkSeen).toHaveBeenCalledTimes(2));
  });

  it('swallows seen-report failures', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockMarkSeen.mockRejectedValue(new Error('offline'));

    renderHook(() => useConversationMeta('uid-me', 'uid-bob', [message('uid-bob', 1)]));

    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});
