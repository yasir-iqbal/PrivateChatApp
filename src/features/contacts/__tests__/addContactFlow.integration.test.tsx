import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MainNavigator } from '../../../navigation/MainNavigator';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { addContactByEmail } from '../domain/addContactByEmail';
import { listContacts } from '../domain/listContacts';
import type { Contact } from '../domain/contact';

jest.mock('../domain/addContactByEmail');
jest.mock('../domain/listContacts');
// The navigator now opens on Chats; this flow is only about contacts.
jest.mock('../../chat/domain/observeConversations', () => ({ observeConversations: jest.fn(() => jest.fn()) }));

const mockAddContactByEmail = addContactByEmail as jest.MockedFunction<typeof addContactByEmail>;
const mockListContacts = listContacts as jest.MockedFunction<typeof listContacts>;

const authUser: AuthUser = {
  uid: 'uid-me',
  email: 'me@b.com',
  displayName: 'Ada',
  photoURL: null,
  emailVerified: true,
};

const bob: Contact = { uid: 'uid-bob', email: 'bob@b.com', displayName: 'Bob', photoURL: null, addedAt: 1 };

describe('add contact flow', () => {
  const QueryWrapper = createQueryClientWrapper();

  function renderFlow() {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <QueryWrapper>
          <ThemeProvider>
            <NavigationContainer>
              <MainNavigator
                authUser={authUser}
                firebaseUser={{ uid: authUser.uid } as never}
                refreshAuthState={jest.fn()}
              />
            </NavigationContainer>
          </ThemeProvider>
        </QueryWrapper>
      </SafeAreaProvider>,
    );
  }

  // The whole point of the feature: a newly added contact has to show up in
  // the list without the user reloading anything.
  it('adds a contact and shows them in the list on return', async () => {
    mockListContacts.mockResolvedValue([]);
    mockAddContactByEmail.mockResolvedValue({
      status: 'added',
      contact: { uid: 'uid-bob', email: 'bob@b.com', displayName: 'Bob', photoURL: null },
    });

    renderFlow();
    fireEvent.press(screen.getByLabelText('Contacts'));
    await waitFor(() => expect(screen.getByText(/No contacts yet/)).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Add contact'));
    await waitFor(() => expect(screen.getByText('New contact')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('add-contact-email-input'), 'bob@b.com');
    // The list must reflect the new contact, so the refetch has to see it.
    mockListContacts.mockResolvedValue([bob]);
    fireEvent.press(screen.getByText('Add contact'));

    await waitFor(() => expect(mockAddContactByEmail).toHaveBeenCalledWith('uid-me', 'me@b.com', 'bob@b.com'));
    await waitFor(() => expect(screen.getByText('Bob')).toBeTruthy());
  });

  it('keeps the user on the add screen with an invite when the email is unregistered', async () => {
    mockListContacts.mockResolvedValue([]);
    mockAddContactByEmail.mockResolvedValue({ status: 'not-found', email: 'ghost@b.com' });

    renderFlow();
    fireEvent.press(screen.getByLabelText('Contacts'));
    await waitFor(() => expect(screen.getByText(/No contacts yet/)).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Add contact'));
    await waitFor(() => expect(screen.getByText('New contact')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('add-contact-email-input'), 'ghost@b.com');
    fireEvent.press(screen.getByText('Add contact'));

    await waitFor(() => expect(screen.getByText('No account for ghost@b.com')).toBeTruthy());
    expect(screen.getByText('Send invite')).toBeTruthy();
  });
});
