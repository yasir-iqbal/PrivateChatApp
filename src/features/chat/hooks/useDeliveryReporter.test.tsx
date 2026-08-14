import { renderHook, waitFor } from '@testing-library/react-native';

import { useDeliveryReporter } from './useDeliveryReporter';
import { markDelivered } from '../domain/observeConversationMeta';
import type { ConversationSummary } from '../domain/observeConversations';

jest.mock('../domain/observeConversationMeta');

const mockMarkDelivered = markDelivered as jest.MockedFunction<typeof markDelivered>;

function conversation(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id: 'uid-bob_uid-me',
    otherUid: 'uid-bob',
    lastMessageText: 'hi',
    lastMessageAt: 100,
    lastMessageSenderId: 'uid-bob',
    ...overrides,
  };
}

describe('useDeliveryReporter', () => {
  beforeEach(() => {
    mockMarkDelivered.mockResolvedValue(undefined);
  });

  it('reports delivery for a conversation whose last message came from the other person', async () => {
    renderHook(() => useDeliveryReporter('uid-me', [conversation()]));

    await waitFor(() => expect(mockMarkDelivered).toHaveBeenCalledWith('uid-me', 'uid-bob'));
  });

  // Reporting our own message delivered to ourselves would turn every tick
  // double the instant it was sent.
  it('ignores conversations whose last message is ours', () => {
    renderHook(() => useDeliveryReporter('uid-me', [conversation({ lastMessageSenderId: 'uid-me' })]));

    expect(mockMarkDelivered).not.toHaveBeenCalled();
  });

  it('ignores conversations with no messages yet', () => {
    renderHook(() =>
      useDeliveryReporter('uid-me', [
        conversation({ lastMessageAt: null, lastMessageSenderId: null }),
      ]),
    );

    expect(mockMarkDelivered).not.toHaveBeenCalled();
  });

  // The listener re-emits on any conversation change, so without the guard
  // every unrelated update would rewrite the same watermark.
  it('does not re-report the same message', async () => {
    const { rerender } = renderHook<void, { conversations: ConversationSummary[] }>(
      ({ conversations }) => useDeliveryReporter('uid-me', conversations),
      { initialProps: { conversations: [conversation()] } },
    );

    await waitFor(() => expect(mockMarkDelivered).toHaveBeenCalledTimes(1));
    rerender({ conversations: [conversation()] });
    expect(mockMarkDelivered).toHaveBeenCalledTimes(1);
  });

  it('reports again when a newer message arrives', async () => {
    const { rerender } = renderHook<void, { conversations: ConversationSummary[] }>(
      ({ conversations }) => useDeliveryReporter('uid-me', conversations),
      { initialProps: { conversations: [conversation()] } },
    );

    await waitFor(() => expect(mockMarkDelivered).toHaveBeenCalledTimes(1));
    rerender({ conversations: [conversation({ lastMessageAt: 200 })] });

    await waitFor(() => expect(mockMarkDelivered).toHaveBeenCalledTimes(2));
  });

  it('reports each incoming conversation separately', async () => {
    renderHook(() =>
      useDeliveryReporter('uid-me', [
        conversation(),
        conversation({ id: 'uid-ada_uid-me', otherUid: 'uid-ada', lastMessageSenderId: 'uid-ada' }),
      ]),
    );

    await waitFor(() => expect(mockMarkDelivered).toHaveBeenCalledTimes(2));
    expect(mockMarkDelivered).toHaveBeenCalledWith('uid-me', 'uid-bob');
    expect(mockMarkDelivered).toHaveBeenCalledWith('uid-me', 'uid-ada');
  });

  it('swallows reporting failures', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockMarkDelivered.mockRejectedValue(new Error('offline'));

    renderHook(() => useDeliveryReporter('uid-me', [conversation()]));

    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});
