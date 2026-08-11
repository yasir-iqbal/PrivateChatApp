import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { User } from '@react-native-firebase/auth';

import { useProfileSetup } from './useProfileSetup';
import { pickAndUploadAvatar } from '../domain/pickAndUploadAvatar';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';

jest.mock('../domain/pickAndUploadAvatar');

const mockPickAndUploadAvatar = pickAndUploadAvatar as jest.MockedFunction<typeof pickAndUploadAvatar>;

const fakeUser = { uid: 'uid-1' } as User;

describe('useProfileSetup', () => {
  const wrapper = createQueryClientWrapper();

  it('refreshes auth state after a successful upload', async () => {
    mockPickAndUploadAvatar.mockResolvedValue(true);
    const refreshAuthState = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useProfileSetup(fakeUser, refreshAuthState), { wrapper });

    await act(async () => {
      await result.current.uploadAvatar.mutateAsync();
    });

    expect(mockPickAndUploadAvatar).toHaveBeenCalledWith(fakeUser);
    expect(refreshAuthState).toHaveBeenCalled();
    await waitFor(() => expect(result.current.uploadAvatar.data).toBe(true));
  });

  it('does not refresh auth state when the user cancels the picker', async () => {
    mockPickAndUploadAvatar.mockResolvedValue(false);
    const refreshAuthState = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useProfileSetup(fakeUser, refreshAuthState), { wrapper });

    await act(async () => {
      await result.current.uploadAvatar.mutateAsync();
    });

    expect(refreshAuthState).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.uploadAvatar.data).toBe(false));
  });
});
