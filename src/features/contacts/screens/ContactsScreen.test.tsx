import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { ContactsScreen } from './ContactsScreen';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { useSignOut } from '../../auth/hooks/useSignOut';
import type { Contact } from '../domain/contact';
import { useContacts } from '../hooks/useContacts';

jest.mock('../hooks/useContacts');
jest.mock('../../auth/hooks/useSignOut');

const mockUseContacts = useContacts as jest.MockedFunction<typeof useContacts>;
const mockUseSignOut = useSignOut as jest.MockedFunction<typeof useSignOut>;

const authUser: AuthUser = {
  uid: 'uid-me',
  email: 'me@b.com',
  displayName: 'Me',
  photoURL: null,
  emailVerified: true,
};

const bob: Contact = { uid: 'uid-bob', email: 'bob@b.com', displayName: 'Bob', photoURL: null, addedAt: 1 };

function contactsStub(overrides: Record<string, unknown> = {}) {
  return {
    contacts: { data: [], isPending: false, error: null, refetch: jest.fn(), ...overrides },
    remove: { mutate: jest.fn(), isPending: false, error: null },
  } as any;
}

function renderScreen(navigation = { navigate: jest.fn() }) {
  render(
    <ThemeProvider>
      <ContactsScreen {...({ navigation } as any)} authUser={authUser} />
    </ThemeProvider>,
  );
  return { navigation };
}

describe('ContactsScreen', () => {
  beforeEach(() => {
    mockUseSignOut.mockReturnValue({ mutate: jest.fn() } as any);
  });

  it('lists each contact with their email', () => {
    mockUseContacts.mockReturnValue(contactsStub({ data: [bob] }));

    renderScreen();

    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByText('bob@b.com')).toBeTruthy();
  });

  it('shows an empty state that leads to the add screen', () => {
    mockUseContacts.mockReturnValue(contactsStub({ data: [] }));

    const { navigation } = renderScreen();
    fireEvent.press(screen.getByText('Add contact'));

    expect(navigation.navigate).toHaveBeenCalledWith('AddContact');
  });

  it('surfaces a load failure with a retry', () => {
    const refetch = jest.fn();
    mockUseContacts.mockReturnValue(contactsStub({ data: undefined, error: new Error('offline'), refetch }));

    renderScreen();
    expect(screen.getByText('offline')).toBeTruthy();

    fireEvent.press(screen.getByText('Try again'));
    expect(refetch).toHaveBeenCalled();
  });

  // Removing is destructive and the row control is a small icon, so it must
  // not fire straight from the tap.
  it('confirms before removing a contact', () => {
    const stub = contactsStub({ data: [bob] });
    mockUseContacts.mockReturnValue(stub);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    renderScreen();
    fireEvent.press(screen.getByLabelText('Remove Bob'));

    expect(alert).toHaveBeenCalled();
    expect(stub.remove.mutate).not.toHaveBeenCalled();

    // Invoke the confirm button the alert was configured with.
    const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((button) => button.text === 'Remove')?.onPress?.();
    expect(stub.remove.mutate).toHaveBeenCalledWith('uid-bob');

    alert.mockRestore();
  });
});
