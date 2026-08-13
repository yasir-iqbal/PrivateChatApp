import { fireEvent, render, screen } from '@testing-library/react-native';

import { AddContactScreen } from './AddContactScreen';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { sendInvite } from '../domain/sendInvite';
import { useAddContact } from '../hooks/useAddContact';

jest.mock('../hooks/useAddContact');
jest.mock('../domain/sendInvite');

const mockUseAddContact = useAddContact as jest.MockedFunction<typeof useAddContact>;
const mockSendInvite = sendInvite as jest.MockedFunction<typeof sendInvite>;

const authUser: AuthUser = {
  uid: 'uid-me',
  email: 'me@b.com',
  displayName: 'Ada',
  photoURL: null,
  emailVerified: true,
};

function hookStub(overrides: Record<string, unknown> = {}) {
  return {
    form: { control: { register: jest.fn() }, formState: { errors: {} } },
    submit: jest.fn(),
    isPending: false,
    error: null,
    data: undefined,
    ...overrides,
  } as any;
}

function renderScreen(hook: unknown, navigation = { goBack: jest.fn(), navigate: jest.fn() }) {
  mockUseAddContact.mockReturnValue(hook as any);
  render(
    <ThemeProvider>
      <AddContactScreen {...({ navigation } as any)} authUser={authUser} />
    </ThemeProvider>,
  );
  return { navigation };
}

// The Controller-driven field needs a real form; these tests target the
// result branches, so a minimal control stub is enough for rendering.
jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  Controller: ({ render: renderProp }: any) =>
    renderProp({ field: { value: '', onChange: jest.fn() } }),
}));

describe('AddContactScreen', () => {
  it('submits the form when "Add contact" is pressed', () => {
    const submit = jest.fn();
    renderScreen(hookStub({ submit }));

    fireEvent.press(screen.getByText('Add contact'));

    expect(submit).toHaveBeenCalled();
  });

  it('returns to the list once a contact is added', () => {
    const { navigation } = renderScreen(
      hookStub({ data: { status: 'added', contact: { uid: 'uid-bob' } } }),
    );

    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('offers an invite instead of an error when nobody has that email', () => {
    renderScreen(hookStub({ data: { status: 'not-found', email: 'ghost@b.com' } }));

    expect(screen.getByText('No account for ghost@b.com')).toBeTruthy();

    fireEvent.press(screen.getByText('Send invite'));
    expect(mockSendInvite).toHaveBeenCalledWith('Ada');
  });

  it('explains when the user enters their own address', () => {
    renderScreen(hookStub({ data: { status: 'self' } }));

    expect(screen.getByText('That is your own email address.')).toBeTruthy();
  });

  it('shows the failure message when the lookup errors', () => {
    renderScreen(hookStub({ error: new Error('offline') }));

    expect(screen.getByText('offline')).toBeTruthy();
  });
});
