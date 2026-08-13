import { renderHook, waitFor } from '@testing-library/react-native';

import { useSyncUserProfile } from './useSyncUserProfile';
import { syncUserProfile } from '../domain/syncUserProfile';
import type { AuthUser } from '../../auth/domain/authUser';

jest.mock('../domain/syncUserProfile');

const mockSyncUserProfile = syncUserProfile as jest.MockedFunction<typeof syncUserProfile>;

const authUser: AuthUser = {
  uid: 'uid-1',
  email: 'a@b.com',
  displayName: 'Ada',
  photoURL: null,
  emailVerified: true,
};

describe('useSyncUserProfile', () => {
  it('syncs the profile when a user is present', async () => {
    mockSyncUserProfile.mockResolvedValue(undefined);

    renderHook(() => useSyncUserProfile(authUser));

    await waitFor(() => expect(mockSyncUserProfile).toHaveBeenCalledWith(authUser));
  });

  it('does nothing when signed out', () => {
    renderHook(() => useSyncUserProfile(null));

    expect(mockSyncUserProfile).not.toHaveBeenCalled();
  });

  it('does not re-sync when only the object identity changes', async () => {
    mockSyncUserProfile.mockResolvedValue(undefined);
    const { rerender } = renderHook<void, { user: AuthUser }>(({ user }) => useSyncUserProfile(user), {
      initialProps: { user: authUser },
    });

    await waitFor(() => expect(mockSyncUserProfile).toHaveBeenCalledTimes(1));
    rerender({ user: { ...authUser } });

    expect(mockSyncUserProfile).toHaveBeenCalledTimes(1);
  });

  it('re-syncs when a published field changes', async () => {
    mockSyncUserProfile.mockResolvedValue(undefined);
    const { rerender } = renderHook<void, { user: AuthUser }>(({ user }) => useSyncUserProfile(user), {
      initialProps: { user: authUser },
    });

    await waitFor(() => expect(mockSyncUserProfile).toHaveBeenCalledTimes(1));
    rerender({ user: { ...authUser, photoURL: 'https://cdn/new.jpg' } });

    await waitFor(() => expect(mockSyncUserProfile).toHaveBeenCalledTimes(2));
  });

  // A sync failure only costs discoverability until the next sign-in, so it
  // must not surface as an unhandled rejection or break the tree.
  it('swallows sync failures', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockSyncUserProfile.mockRejectedValue(new Error('offline'));

    renderHook(() => useSyncUserProfile(authUser));

    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});
