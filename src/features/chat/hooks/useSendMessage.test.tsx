import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSendMessage } from './useSendMessage';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import { sendMessage } from '../domain/sendMessage';

jest.mock('../domain/sendMessage');

const mockSendMessage = sendMessage as jest.MockedFunction<typeof sendMessage>;

describe('useSendMessage', () => {
  const wrapper = createQueryClientWrapper();

  it('sends the draft and clears the input', async () => {
    mockSendMessage.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSendMessage('uid-a', 'uid-b'), { wrapper });

    act(() => result.current.setDraft('hello'));
    act(() => result.current.send());

    expect(result.current.draft).toBe('');
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledWith('uid-a', 'uid-b', 'hello'));
  });

  it('does nothing when the draft is empty', () => {
    const { result } = renderHook(() => useSendMessage('uid-a', 'uid-b'), { wrapper });

    act(() => result.current.setDraft('   '));
    expect(result.current.canSend).toBe(false);

    act(() => result.current.send());
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  // Losing what you typed because the network blipped is worse than a retry.
  it('restores the draft when sending fails', async () => {
    mockSendMessage.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useSendMessage('uid-a', 'uid-b'), { wrapper });

    act(() => result.current.setDraft('hello'));
    act(() => result.current.send());

    await waitFor(() => expect(result.current.draft).toBe('hello'));
    expect(result.current.error?.message).toBe('offline');
  });

  // If the user started typing again, their new text wins over the restore.
  it('does not clobber a new draft when a failed send restores', async () => {
    mockSendMessage.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useSendMessage('uid-a', 'uid-b'), { wrapper });

    act(() => result.current.setDraft('first'));
    act(() => result.current.send());
    act(() => result.current.setDraft('second'));

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.draft).toBe('second');
  });
});
