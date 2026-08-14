import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useConversationMeta } from './useConversationMeta';
import { markDelivered, observeConversationMeta } from '../domain/observeConversationMeta';
import type { ConversationMeta } from '../data/chatRepository';
import type { Message } from '../domain/message';

jest.mock('../domain/observeConversationMeta');

const mockObserve = observeConversationMeta as jest.MockedFunction<typeof observeConversationMeta>;
const mockMarkDelivered = markDelivered as jest.MockedFunction<typeof markDelivered>;

function message(senderId: string, clientSentAt: number): Message {
  return { id: `m${clientSentAt}`, senderId, text: 'x', sentAt: clientSentAt, clientSentAt, pending: false };
}

describe('useConversationMeta', () => {
  beforeEach(() => {
    mockMarkDelivered.mockResolvedValue(undefined);
    mockObserve.mockReturnValue(jest.fn());
  });

  it('exposes the other participant marks, not our own', async () => {
    let emit: ((meta: ConversationMeta) => void) | undefined;
    mockObserve.mockImplementation((_a, _b, onChange) => {
      emit = onChange;
      return jest.fn();
    });

    const { result } = renderHook(() => useConversationMeta('uid-me', 'uid-bob', []));
    act(() => emit?.({ deliveredAt: { 'uid-bob': 500, 'uid-me': 900 }, readAt: { 'uid-bob': 400 } }));

    await waitFor(() => expect(result.current.otherDeliveredAt).toBe(500));
    expect(result.current.otherReadAt).toBe(400);
  });

  it('reports delivery when an incoming message is on screen', async () => {
    renderHook(() => useConversationMeta('uid-me', 'uid-bob', [message('uid-bob', 1)]));

    await waitFor(() => expect(mockMarkDelivered).toHaveBeenCalledWith('uid-me', 'uid-bob'));
  });

  // Otherwise every sender would mark their own messages delivered to
  // themselves, and the tick would never mean anything.
  it('does not report delivery for our own messages', () => {
    renderHook(() => useConversationMeta('uid-me', 'uid-bob', [message('uid-me', 1)]));

    expect(mockMarkDelivered).not.toHaveBeenCalled();
  });

  it('reports once per arrival rather than on every render', async () => {
    const messages = [message('uid-bob', 1)];
    const { rerender } = renderHook<void, { messages: Message[] }>(
      ({ messages: m }) => useConversationMeta('uid-me', 'uid-bob', m),
      { initialProps: { messages } },
    );

    await waitFor(() => expect(mockMarkDelivered).toHaveBeenCalledTimes(1));
    rerender({ messages: [...messages] });
    expect(mockMarkDelivered).toHaveBeenCalledTimes(1);

    rerender({ messages: [...messages, message('uid-bob', 2)] });
    await waitFor(() => expect(mockMarkDelivered).toHaveBeenCalledTimes(2));
  });

  it('swallows delivery failures', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockMarkDelivered.mockRejectedValue(new Error('offline'));

    renderHook(() => useConversationMeta('uid-me', 'uid-bob', [message('uid-bob', 1)]));

    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});
