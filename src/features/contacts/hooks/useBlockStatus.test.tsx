import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useBlockStatus } from './useBlockStatus';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import { blockContact, observeBlocked, unblockContact } from '../domain/blocking';

jest.mock('../domain/blocking', () => ({
  ...jest.requireActual('../domain/blocking'),
  observeBlocked: jest.fn(),
  blockContact: jest.fn(),
  unblockContact: jest.fn(),
}));

const mockObserveBlocked = observeBlocked as jest.MockedFunction<typeof observeBlocked>;
const mockBlockContact = blockContact as jest.MockedFunction<typeof blockContact>;
const mockUnblockContact = unblockContact as jest.MockedFunction<typeof unblockContact>;

function pressAlertButton(alert: jest.SpyInstance, text: string) {
  const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
  buttons.find((button) => button.text === text)?.onPress?.();
}

describe('useBlockStatus', () => {
  const wrapper = createQueryClientWrapper();

  beforeEach(() => {
    mockBlockContact.mockResolvedValue(undefined);
    mockUnblockContact.mockResolvedValue(undefined);
    mockObserveBlocked.mockReturnValue(jest.fn());
  });

  it('reports not blocked when the list is empty', () => {
    const { result } = renderHook(() => useBlockStatus('uid-me', 'uid-bob'), { wrapper });

    expect(result.current.blocked).toBe(false);
  });

  it('reports blocked once the uid appears in the list', async () => {
    let emit: ((uids: string[]) => void) | undefined;
    mockObserveBlocked.mockImplementation((_uid, onChange) => {
      emit = onChange;
      return jest.fn();
    });
    const { result } = renderHook(() => useBlockStatus('uid-me', 'uid-bob'), { wrapper });

    act(() => emit?.(['uid-bob']));

    await waitFor(() => expect(result.current.blocked).toBe(true));
  });

  it('ignores other people in the blocked list', async () => {
    let emit: ((uids: string[]) => void) | undefined;
    mockObserveBlocked.mockImplementation((_uid, onChange) => {
      emit = onChange;
      return jest.fn();
    });
    const { result } = renderHook(() => useBlockStatus('uid-me', 'uid-bob'), { wrapper });

    act(() => emit?.(['uid-ada']));

    expect(result.current.blocked).toBe(false);
  });

  // Consequential and easy to hit from a menu by accident.
  it('confirms before blocking', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useBlockStatus('uid-me', 'uid-bob'), { wrapper });

    act(() => result.current.toggle('Bob'));
    expect(alert).toHaveBeenCalled();
    expect(mockBlockContact).not.toHaveBeenCalled();

    act(() => pressAlertButton(alert, 'Block'));
    await waitFor(() => expect(mockBlockContact).toHaveBeenCalledWith('uid-me', 'uid-bob'));
    alert.mockRestore();
  });

  it('does nothing when the block confirmation is cancelled', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useBlockStatus('uid-me', 'uid-bob'), { wrapper });

    act(() => result.current.toggle('Bob'));
    act(() => pressAlertButton(alert, 'Cancel'));

    expect(mockBlockContact).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  // Unblocking restores something, so it does not need guarding.
  it('unblocks without a confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    let emit: ((uids: string[]) => void) | undefined;
    mockObserveBlocked.mockImplementation((_uid, onChange) => {
      emit = onChange;
      return jest.fn();
    });
    const { result } = renderHook(() => useBlockStatus('uid-me', 'uid-bob'), { wrapper });
    act(() => emit?.(['uid-bob']));
    await waitFor(() => expect(result.current.blocked).toBe(true));

    act(() => result.current.toggle('Bob'));

    await waitFor(() => expect(mockUnblockContact).toHaveBeenCalledWith('uid-me', 'uid-bob'));
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockObserveBlocked.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useBlockStatus('uid-me', 'uid-bob'), { wrapper });
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
