import { act, renderHook } from '@testing-library/react-native';
import type { User } from '@react-native-firebase/auth';

import { useAuthState } from './useAuthState';
import { observeAuthState } from '../domain/observeAuthState';

jest.mock('../domain/observeAuthState');

const mockObserveAuthState = observeAuthState as jest.MockedFunction<typeof observeAuthState>;

describe('useAuthState', () => {
  it('starts initializing and resolves once the auth callback fires', () => {
    let capturedCallback: ((user: User | null) => void) | undefined;
    const unsubscribe = jest.fn();
    mockObserveAuthState.mockImplementation((callback) => {
      capturedCallback = callback;
      return unsubscribe;
    });

    const { result } = renderHook(() => useAuthState());

    expect(result.current.initializing).toBe(true);
    expect(result.current.authUser).toBeNull();

    const fakeUser = { uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: false } as User;
    act(() => {
      capturedCallback?.(fakeUser);
    });

    expect(result.current.initializing).toBe(false);
    expect(result.current.authUser).toEqual({
      uid: 'uid-1',
      email: 'a@b.com',
      displayName: null,
      photoURL: null,
      emailVerified: false,
    });
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockObserveAuthState.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAuthState());
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
