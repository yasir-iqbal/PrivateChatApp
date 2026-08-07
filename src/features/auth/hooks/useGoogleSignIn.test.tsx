import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useGoogleSignIn } from './useGoogleSignIn';
import { configureGoogleSignIn } from '../domain/configureGoogleSignIn';
import { signInWithGoogle } from '../domain/signInWithGoogle';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import type { AuthUser } from '../domain/authUser';

jest.mock('../domain/configureGoogleSignIn');
jest.mock('../domain/signInWithGoogle');
jest.mock('../../../shared/config/googleSignIn', () => ({ GOOGLE_WEB_CLIENT_ID: 'test-web-client-id' }));

const mockConfigure = configureGoogleSignIn as jest.MockedFunction<typeof configureGoogleSignIn>;
const mockSignInWithGoogle = signInWithGoogle as jest.MockedFunction<typeof signInWithGoogle>;

describe('useGoogleSignIn', () => {
  const wrapper = createQueryClientWrapper();

  it('configures Google sign-in with the configured web client id on mount', () => {
    renderHook(() => useGoogleSignIn(), { wrapper });

    expect(mockConfigure).toHaveBeenCalledWith('test-web-client-id');
  });

  it('signs in with Google when triggered', async () => {
    const fakeUser: AuthUser = { uid: 'uid-1', email: 'a@b.com', displayName: 'Alice', photoURL: null, emailVerified: true };
    mockSignInWithGoogle.mockResolvedValue(fakeUser);

    const { result } = renderHook(() => useGoogleSignIn(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fakeUser);
  });
});
