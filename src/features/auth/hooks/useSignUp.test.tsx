import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSignUp } from './useSignUp';
import { signUp } from '../domain/signUp';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import type { AuthUser } from '../domain/authUser';

jest.mock('../domain/signUp');

const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;

describe('useSignUp', () => {
  const wrapper = createQueryClientWrapper();

  it('validates input and blocks submission when the schema fails', async () => {
    const { result } = renderHook(() => useSignUp(), { wrapper });

    act(() => {
      result.current.submit();
    });

    await waitFor(() => expect(result.current.form.formState.submitCount).toBe(1));
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(result.current.form.formState.errors.email).toBeDefined();
  });

  it('calls the signUp domain function with valid input', async () => {
    const fakeUser: AuthUser = { uid: 'uid-1', email: 'a@b.com', displayName: 'Alice', photoURL: null, emailVerified: false };
    mockSignUp.mockResolvedValue(fakeUser);

    const { result } = renderHook(() => useSignUp(), { wrapper });

    act(() => {
      result.current.form.setValue('displayName', 'Alice');
      result.current.form.setValue('email', 'a@b.com');
      result.current.form.setValue('password', 'password1');
      result.current.form.setValue('confirmPassword', 'password1');
    });

    act(() => {
      result.current.submit();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSignUp).toHaveBeenCalledWith({
      displayName: 'Alice',
      email: 'a@b.com',
      password: 'password1',
      confirmPassword: 'password1',
    });
  });
});
