import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useContacts } from './useContacts';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import { listContacts } from '../domain/listContacts';
import { removeContact } from '../domain/removeContact';
import type { Contact } from '../domain/contact';

jest.mock('../domain/listContacts');
jest.mock('../domain/removeContact');

const mockListContacts = listContacts as jest.MockedFunction<typeof listContacts>;
const mockRemoveContact = removeContact as jest.MockedFunction<typeof removeContact>;

const bob: Contact = {
  uid: 'uid-bob',
  email: 'bob@b.com',
  displayName: 'Bob',
  photoURL: null,
  addedAt: 1,
};

describe('useContacts', () => {
  const wrapper = createQueryClientWrapper();

  it('loads the contact list for the owner', async () => {
    mockListContacts.mockResolvedValue([bob]);

    const { result } = renderHook(() => useContacts('uid-me'), { wrapper });

    await waitFor(() => expect(result.current.contacts.data).toEqual([bob]));
    expect(mockListContacts).toHaveBeenCalledWith('uid-me');
  });

  it('does not query while there is no signed-in uid', () => {
    const { result } = renderHook(() => useContacts(undefined), { wrapper });

    expect(mockListContacts).not.toHaveBeenCalled();
    expect(result.current.contacts.fetchStatus).toBe('idle');
  });

  it('refetches the list after removing a contact', async () => {
    mockListContacts.mockResolvedValue([bob]);
    mockRemoveContact.mockResolvedValue(undefined);

    const { result } = renderHook(() => useContacts('uid-me'), { wrapper });
    await waitFor(() => expect(result.current.contacts.data).toEqual([bob]));

    mockListContacts.mockResolvedValue([]);
    await act(async () => {
      await result.current.remove.mutateAsync('uid-bob');
    });

    expect(mockRemoveContact).toHaveBeenCalledWith('uid-me', 'uid-bob');
    await waitFor(() => expect(result.current.contacts.data).toEqual([]));
  });
});
