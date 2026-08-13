import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAddContact } from './useAddContact';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import { addContactByEmail } from '../domain/addContactByEmail';

jest.mock('../domain/addContactByEmail');

const mockAddContactByEmail = addContactByEmail as jest.MockedFunction<typeof addContactByEmail>;

const bob = { uid: 'uid-bob', email: 'bob@b.com', displayName: 'Bob', photoURL: null };

describe('useAddContact', () => {
  const wrapper = createQueryClientWrapper();

  it('adds the contact and clears the field on success', async () => {
    mockAddContactByEmail.mockResolvedValue({ status: 'added', contact: bob });
    const { result } = renderHook(() => useAddContact('uid-me', 'me@b.com'), { wrapper });

    act(() => {
      result.current.form.setValue('email', 'bob@b.com');
    });
    act(() => {
      result.current.submit();
    });

    await waitFor(() => expect(result.current.data).toEqual({ status: 'added', contact: bob }));
    expect(mockAddContactByEmail).toHaveBeenCalledWith('uid-me', 'me@b.com', 'bob@b.com');
    await waitFor(() => expect(result.current.form.getValues('email')).toBe(''));
  });

  // The typed address has to survive so the user can correct a typo rather
  // than retype it from scratch.
  it('keeps the typed email when nobody has that address', async () => {
    mockAddContactByEmail.mockResolvedValue({ status: 'not-found', email: 'ghost@b.com' });
    const { result } = renderHook(() => useAddContact('uid-me', 'me@b.com'), { wrapper });

    act(() => {
      result.current.form.setValue('email', 'ghost@b.com');
    });
    act(() => {
      result.current.submit();
    });

    await waitFor(() => expect(result.current.data).toEqual({ status: 'not-found', email: 'ghost@b.com' }));
    expect(result.current.form.getValues('email')).toBe('ghost@b.com');
  });

  it('does not call the domain for a malformed email', async () => {
    const { result } = renderHook(() => useAddContact('uid-me', 'me@b.com'), { wrapper });

    act(() => {
      result.current.form.setValue('email', 'not-an-email');
    });
    act(() => {
      result.current.submit();
    });

    await waitFor(() => expect(result.current.form.formState.errors.email).toBeTruthy());
    expect(mockAddContactByEmail).not.toHaveBeenCalled();
  });
});
