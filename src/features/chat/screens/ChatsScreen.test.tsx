import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChatsScreen } from './ChatsScreen';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { useSignOut } from '../../auth/hooks/useSignOut';
import { useConversations, type ConversationRow } from '../hooks/useConversations';

jest.mock('../hooks/useConversations');
jest.mock('../../auth/hooks/useSignOut');
// Fires from this screen on every incoming conversation; not what these
// tests are about, and it would otherwise reach Firestore.
jest.mock('../hooks/useDeliveryReporter');

const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;
const mockUseSignOut = useSignOut as jest.MockedFunction<typeof useSignOut>;

const authUser: AuthUser = {
  uid: 'uid-me',
  email: 'me@b.com',
  displayName: 'Me',
  photoURL: null,
  emailVerified: true,
};

const withBob: ConversationRow = {
  id: 'uid-bob_uid-me',
  otherUid: 'uid-bob',
  lastMessageText: 'see you then',
  lastMessageAt: Date.now(),
  lastMessageSenderId: 'uid-bob',
  profile: { uid: 'uid-bob', email: 'bob@b.com', displayName: 'Bob', photoURL: null },
};

function renderScreen(
  state: Partial<ReturnType<typeof useConversations>> = {},
  navigation = { navigate: jest.fn() },
) {
  mockUseConversations.mockReturnValue({
    conversations: [],
    loading: false,
    error: null,
    ...state,
  } as any);
  render(
    <ThemeProvider>
      <ChatsScreen {...({ navigation } as any)} authUser={authUser} />
    </ThemeProvider>,
  );
  return { navigation };
}

describe('ChatsScreen', () => {
  beforeEach(() => {
    mockUseSignOut.mockReturnValue({ mutate: jest.fn() } as any);
  });

  it('shows each conversation with its last message', () => {
    renderScreen({ conversations: [withBob] });

    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByText('see you then')).toBeTruthy();
  });

  it('opens the chat for the other participant when a row is tapped', () => {
    const { navigation } = renderScreen({ conversations: [withBob] });

    fireEvent.press(screen.getByLabelText('Chat with Bob'));

    expect(navigation.navigate).toHaveBeenCalledWith('Chat', {
      contactUid: 'uid-bob',
      contactName: 'Bob',
      contactPhotoURL: null,
    });
  });

  // The profile fetch is separate from the conversation listener, so a row can
  // legitimately render before its name arrives.
  it('renders a row whose profile has not loaded yet', () => {
    renderScreen({ conversations: [{ ...withBob, profile: null }] });

    expect(screen.getByText('Unknown')).toBeTruthy();
  });

  it('prompts to start one when there are no conversations', () => {
    renderScreen({ conversations: [] });

    expect(screen.getByText(/No chats yet/)).toBeTruthy();
  });

  it('opens the new chat picker from the button', () => {
    const { navigation } = renderScreen({ conversations: [withBob] });

    fireEvent.press(screen.getByLabelText('New chat'));

    expect(navigation.navigate).toHaveBeenCalledWith('NewChat');
  });

  it('reaches contacts from the header', () => {
    const { navigation } = renderScreen({ conversations: [] });

    fireEvent.press(screen.getByLabelText('Contacts'));

    expect(navigation.navigate).toHaveBeenCalledWith('Contacts');
  });

  it('surfaces a listener failure', () => {
    renderScreen({ error: new Error('permission denied') });

    expect(screen.getByText('permission denied')).toBeTruthy();
  });
});
