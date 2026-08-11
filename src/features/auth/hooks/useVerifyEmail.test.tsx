import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { User } from '@react-native-firebase/auth';

import { useVerifyEmail } from './useVerifyEmail';
import { logOut } from '../domain/logOut';
import { resendVerificationEmail } from '../domain/resendVerificationEmail';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';

jest.mock('../domain/logOut');
jest.mock('../domain/resendVerificationEmail');

const mockLogOut = logOut as jest.MockedFunction<typeof logOut>;
const mockResend = resendVerificationEmail as jest.MockedFunction<typeof resendVerificationEmail>;

const fakeUser = { uid: 'uid-1' } as User;

describe('useVerifyEmail', () => {
  const wrapper = createQueryClientWrapper();

  it('resends the verification email for the given user', async () => {
    mockResend.mockResolvedValue(undefined);
    const refreshAuthState = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVerifyEmail(fakeUser, refreshAuthState), { wrapper });

    await act(async () => {
      await result.current.resend.mutateAsync();
    });

    expect(mockResend).toHaveBeenCalledWith(fakeUser);
    await waitFor(() => expect(result.current.resend.isSuccess).toBe(true));
  });

  it('refreshes auth state via the provided callback', async () => {
    const refreshAuthState = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVerifyEmail(fakeUser, refreshAuthState), { wrapper });

    await act(async () => {
      await result.current.refresh.mutateAsync();
    });

    expect(refreshAuthState).toHaveBeenCalled();
    await waitFor(() => expect(result.current.refresh.isSuccess).toBe(true));
  });

  it('signs out', async () => {
    mockLogOut.mockResolvedValue(undefined);
    const refreshAuthState = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVerifyEmail(fakeUser, refreshAuthState), { wrapper });

    await act(async () => {
      await result.current.signOut.mutateAsync();
    });

    expect(mockLogOut).toHaveBeenCalled();
    await waitFor(() => expect(result.current.signOut.isSuccess).toBe(true));
  });

  it('rejects resend and refresh when there is no signed-in user', async () => {
    const refreshAuthState = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVerifyEmail(null, refreshAuthState), { wrapper });

    await act(async () => {
      await expect(result.current.resend.mutateAsync()).rejects.toThrow('No signed-in user.');
    });
    await act(async () => {
      await expect(result.current.refresh.mutateAsync()).rejects.toThrow('No signed-in user.');
    });
  });
});
