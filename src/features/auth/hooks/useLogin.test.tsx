import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useLogin } from './useLogin';
import { signIn } from '../domain/signIn';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import type { AuthUser } from '../domain/authUser';

jest.mock('../domain/signIn');

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe('useLogin', () => {
  const wrapper = createQueryClientWrapper();

  it('validates input and blocks submission when the schema fails', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.submit();
    });

    await waitFor(() => expect(result.current.form.formState.submitCount).toBe(1));
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(result.current.form.formState.errors.email).toBeDefined();
  });

  it('calls the signIn domain function with valid input', async () => {
    const fakeUser: AuthUser = { uid: 'uid-1', email: 'a@b.com', displayName: 'Alice', photoURL: null, emailVerified: true };
    mockSignIn.mockResolvedValue(fakeUser);

    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.form.setValue('email', 'a@b.com');
      result.current.form.setValue('password', 'password1');
    });

    act(() => {
      result.current.submit();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password1' });
  });
});
