import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { User } from '@react-native-firebase/auth';

import { useVerifyEmail } from './useVerifyEmail';
import { logOut } from '../domain/logOut';
import { refreshAuthUser } from '../domain/refreshAuthUser';
import { resendVerificationEmail } from '../domain/resendVerificationEmail';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import type { AuthUser } from '../domain/authUser';

jest.mock('../domain/logOut');
jest.mock('../domain/refreshAuthUser');
jest.mock('../domain/resendVerificationEmail');

const mockLogOut = logOut as jest.MockedFunction<typeof logOut>;
const mockRefresh = refreshAuthUser as jest.MockedFunction<typeof refreshAuthUser>;
const mockResend = resendVerificationEmail as jest.MockedFunction<typeof resendVerificationEmail>;

const fakeUser = { uid: 'uid-1' } as User;

describe('useVerifyEmail', () => {
  const wrapper = createQueryClientWrapper();

  it('resends the verification email for the given user', async () => {
    mockResend.mockResolvedValue(undefined);
    const { result } = renderHook(() => useVerifyEmail(fakeUser), { wrapper });

    await act(async () => {
      await result.current.resend.mutateAsync();
    });

    expect(mockResend).toHaveBeenCalledWith(fakeUser);
    await waitFor(() => expect(result.current.resend.isSuccess).toBe(true));
  });

  it('refreshes the auth user', async () => {
    const fakeAuthUser: AuthUser = { uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: true };
    mockRefresh.mockResolvedValue(fakeAuthUser);
    const { result } = renderHook(() => useVerifyEmail(fakeUser), { wrapper });

    await act(async () => {
      await result.current.refresh.mutateAsync();
    });

    expect(mockRefresh).toHaveBeenCalledWith(fakeUser);
    await waitFor(() => expect(result.current.refresh.data).toEqual(fakeAuthUser));
  });

  it('signs out', async () => {
    mockLogOut.mockResolvedValue(undefined);
    const { result } = renderHook(() => useVerifyEmail(fakeUser), { wrapper });

    await act(async () => {
      await result.current.signOut.mutateAsync();
    });

    expect(mockLogOut).toHaveBeenCalled();
    await waitFor(() => expect(result.current.signOut.isSuccess).toBe(true));
  });

  it('rejects resend when there is no signed-in user', async () => {
    const { result } = renderHook(() => useVerifyEmail(null), { wrapper });

    await act(async () => {
      await expect(result.current.resend.mutateAsync()).rejects.toThrow('No signed-in user.');
    });
  });
});
