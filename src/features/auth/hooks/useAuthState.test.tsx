import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { User } from '@react-native-firebase/auth';

import { useAuthState } from './useAuthState';
import { observeAuthState } from '../domain/observeAuthState';
import { refreshAuthUser } from '../domain/refreshAuthUser';
import type { AuthUser } from '../domain/authUser';

jest.mock('../domain/observeAuthState');
jest.mock('../domain/refreshAuthUser');

const mockObserveAuthState = observeAuthState as jest.MockedFunction<typeof observeAuthState>;
const mockRefreshAuthUser = refreshAuthUser as jest.MockedFunction<typeof refreshAuthUser>;

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

  it('refresh() reloads the user and pushes the updated fields into authUser', async () => {
    let capturedCallback: ((user: User | null) => void) | undefined;
    mockObserveAuthState.mockImplementation((callback) => {
      capturedCallback = callback;
      return jest.fn();
    });
    const fakeUser = { uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: false } as User;
    const refreshedAuthUser: AuthUser = { ...fakeUser, photoURL: 'https://example.com/avatar.jpg' };
    mockRefreshAuthUser.mockResolvedValue(refreshedAuthUser);

    const { result } = renderHook(() => useAuthState());
    act(() => {
      capturedCallback?.(fakeUser);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockRefreshAuthUser).toHaveBeenCalledWith(fakeUser);
    await waitFor(() => expect(result.current.authUser).toEqual(refreshedAuthUser));
  });

  it('refresh() is a no-op when there is no signed-in user', async () => {
    mockObserveAuthState.mockReturnValue(jest.fn());

    const { result } = renderHook(() => useAuthState());
    await act(async () => {
      await result.current.refresh();
    });

    expect(mockRefreshAuthUser).not.toHaveBeenCalled();
  });
});
