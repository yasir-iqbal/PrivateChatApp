import { fireEvent, render, screen } from '@testing-library/react-native';

import { NewChatScreen } from './NewChatScreen';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import type { Contact } from '../domain/contact';
import { useContacts } from '../hooks/useContacts';

jest.mock('../hooks/useContacts');

const mockUseContacts = useContacts as jest.MockedFunction<typeof useContacts>;

const authUser: AuthUser = {
  uid: 'uid-me',
  email: 'me@b.com',
  displayName: 'Me',
  photoURL: null,
  emailVerified: true,
};

const bob: Contact = {
  uid: 'uid-bob',
  email: 'bob@b.com',
  displayName: 'Bob',
  photoURL: 'https://cdn/bob.jpg',
  addedAt: 1,
};

function contactsStub(data: Contact[] | undefined, isPending = false) {
  return {
    contacts: { data, isPending, error: null, refetch: jest.fn() },
    remove: { mutate: jest.fn(), isPending: false, error: null },
  } as any;
}

function renderScreen(navigation = { goBack: jest.fn(), navigate: jest.fn(), replace: jest.fn() }) {
  render(
    <ThemeProvider>
      <NewChatScreen {...({ navigation } as any)} authUser={authUser} />
    </ThemeProvider>,
  );
  return { navigation };
}

describe('NewChatScreen', () => {
  it('lists the contacts available to chat with', () => {
    mockUseContacts.mockReturnValue(contactsStub([bob]));

    renderScreen();

    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByText('bob@b.com')).toBeTruthy();
  });

  // replace, not navigate: backing out of the chat should land on the list the
  // user started from, not this picker.
  it('replaces itself with the chat when a contact is chosen', () => {
    mockUseContacts.mockReturnValue(contactsStub([bob]));

    const { navigation } = renderScreen();
    fireEvent.press(screen.getByLabelText('Chat with Bob'));

    expect(navigation.replace).toHaveBeenCalledWith('Chat', {
      contactUid: 'uid-bob',
      contactName: 'Bob',
      contactPhotoURL: 'https://cdn/bob.jpg',
    });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('offers adding a new contact above the list', () => {
    mockUseContacts.mockReturnValue(contactsStub([bob]));

    const { navigation } = renderScreen();
    fireEvent.press(screen.getByLabelText('New contact'));

    expect(navigation.navigate).toHaveBeenCalledWith('AddContact');
  });

  it('still offers adding a contact when there are none', () => {
    mockUseContacts.mockReturnValue(contactsStub([]));

    renderScreen();

    expect(screen.getByLabelText('New contact')).toBeTruthy();
    expect(screen.getByText(/No contacts yet/)).toBeTruthy();
  });
});
