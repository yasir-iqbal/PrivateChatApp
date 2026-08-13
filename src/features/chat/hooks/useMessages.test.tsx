import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useMessages } from './useMessages';
import { observeMessages } from '../domain/observeMessages';
import type { Message } from '../domain/message';

jest.mock('../domain/observeMessages', () => ({
  observeMessages: jest.fn(),
  // The hook orders through this; keep the real implementation.
  toChronological: jest.requireActual('../domain/observeMessages').toChronological,
}));

const mockObserveMessages = observeMessages as jest.MockedFunction<typeof observeMessages>;

function message(id: string, clientSentAt: number): Message {
  return { id, senderId: 'uid-a', text: id, sentAt: null, clientSentAt, pending: false };
}

describe('useMessages', () => {
  it('starts loading and resolves on the first snapshot', async () => {
    let emit: ((messages: Message[]) => void) | undefined;
    mockObserveMessages.mockImplementation((_a, _b, onChange) => {
      emit = onChange;
      return jest.fn();
    });

    const { result } = renderHook(() => useMessages('uid-a', 'uid-b'));
    expect(result.current.loading).toBe(true);

    act(() => emit?.([message('m1', 1)]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toHaveLength(1);
  });

  // The query is newest-first so the limit keeps recent messages; the UI needs
  // the opposite order.
  it('presents messages oldest-first', async () => {
    let emit: ((messages: Message[]) => void) | undefined;
    mockObserveMessages.mockImplementation((_a, _b, onChange) => {
      emit = onChange;
      return jest.fn();
    });

    const { result } = renderHook(() => useMessages('uid-a', 'uid-b'));
    act(() => emit?.([message('newest', 3), message('middle', 2), message('oldest', 1)]));

    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual(['oldest', 'middle', 'newest']),
    );
  });

  it('surfaces listener errors and stops loading', async () => {
    let fail: ((error: Error) => void) | undefined;
    mockObserveMessages.mockImplementation((_a, _b, _onChange, onError) => {
      fail = onError;
      return jest.fn();
    });

    const { result } = renderHook(() => useMessages('uid-a', 'uid-b'));
    act(() => fail?.(new Error('permission denied')));

    await waitFor(() => expect(result.current.error?.message).toBe('permission denied'));
    expect(result.current.loading).toBe(false);
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockObserveMessages.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useMessages('uid-a', 'uid-b'));
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  // Otherwise switching chats would keep showing the previous person's messages.
  it('resubscribes when the other participant changes', () => {
    const unsubscribe = jest.fn();
    mockObserveMessages.mockReturnValue(unsubscribe);

    const { rerender } = renderHook<void, { other: string }>(
      ({ other }) => useMessages('uid-a', other),
      { initialProps: { other: 'uid-b' } },
    );
    rerender({ other: 'uid-c' });

    expect(unsubscribe).toHaveBeenCalled();
    expect(mockObserveMessages).toHaveBeenLastCalledWith(
      'uid-a',
      'uid-c',
      expect.any(Function),
      expect.any(Function),
    );
  });
});
