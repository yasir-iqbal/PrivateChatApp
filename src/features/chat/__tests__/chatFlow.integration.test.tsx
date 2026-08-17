import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MainNavigator } from '../../../navigation/MainNavigator';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import type { Contact } from '../../contacts/domain/contact';
import { listContacts } from '../../contacts/domain/listContacts';
import type { Message } from '../domain/message';
import { observeMessages } from '../domain/observeMessages';
import { sendMessage } from '../domain/sendMessage';

jest.mock('../../contacts/domain/listContacts');
jest.mock('../domain/sendMessage');
// The chat list is the navigator root now; this flow starts from its FAB.
jest.mock('../domain/observeConversations', () => ({ observeConversations: jest.fn(() => jest.fn()) }));
jest.mock('../domain/observeMessages', () => ({
  observeMessages: jest.fn(),
  toChronological: jest.requireActual('../domain/observeMessages').toChronological,
}));

const mockListContacts = listContacts as jest.MockedFunction<typeof listContacts>;
const mockObserveMessages = observeMessages as jest.MockedFunction<typeof observeMessages>;
const mockSendMessage = sendMessage as jest.MockedFunction<typeof sendMessage>;

const authUser: AuthUser = {
  uid: 'uid-me',
  email: 'me@b.com',
  displayName: 'Me',
  photoURL: null,
  emailVerified: true,
};

const bob: Contact = { uid: 'uid-bob', email: 'bob@b.com', displayName: 'Bob', photoURL: null, addedAt: 1 };

describe('chat flow', () => {
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
              <MainNavigator authUser={authUser} />
            </NavigationContainer>
          </ThemeProvider>
        </QueryWrapper>
      </SafeAreaProvider>,
    );
  }

  it('opens a contact chat and sends a message to that contact', async () => {
    mockListContacts.mockResolvedValue([bob]);
    let emit: ((messages: Message[]) => void) | undefined;
    mockObserveMessages.mockImplementation((_a, _b, onChange) => {
      emit = onChange;
      onChange([]);
      return jest.fn();
    });
    mockSendMessage.mockResolvedValue(undefined);

    renderFlow();
    fireEvent.press(screen.getByLabelText('New chat'));
    await waitFor(() => expect(screen.getByText('Bob')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Chat with Bob'));
    await waitFor(() => expect(screen.getByText('No messages yet. Say hello.')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('chat-input'), 'hello Bob');
    fireEvent.press(screen.getByLabelText('Send message'));

    // The uid matters: sending to the wrong participant is the failure mode
    // that a screen-level test with a stubbed hook cannot catch.
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledWith('uid-me', 'uid-bob', 'hello Bob'));

    // Firestore echoes the local write straight back through the listener.
    emit?.([
      { id: 'm1', senderId: 'uid-me', type: 'text' as const, mediaUrl: null, mediaAspectRatio: null, durationMs: null, latitude: null, longitude: null, deletedFor: [], deletedForEveryone: false, text: 'hello Bob', sentAt: null, clientSentAt: 1, pending: true },
    ]);
    await waitFor(() => expect(screen.getByText('hello Bob')).toBeTruthy());
  });

  it('shows an incoming message without any user action', async () => {
    mockListContacts.mockResolvedValue([bob]);
    let emit: ((messages: Message[]) => void) | undefined;
    mockObserveMessages.mockImplementation((_a, _b, onChange) => {
      emit = onChange;
      onChange([]);
      return jest.fn();
    });

    renderFlow();
    fireEvent.press(screen.getByLabelText('New chat'));
    await waitFor(() => expect(screen.getByText('Bob')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Chat with Bob'));
    await waitFor(() => expect(screen.getByText('No messages yet. Say hello.')).toBeTruthy());

    emit?.([
      { id: 'm1', senderId: 'uid-bob', type: 'text' as const, mediaUrl: null, mediaAspectRatio: null, durationMs: null, latitude: null, longitude: null, deletedFor: [], deletedForEveryone: false, text: 'hi there', sentAt: 2, clientSentAt: 2, pending: false },
    ]);

    await waitFor(() => expect(screen.getByText('hi there')).toBeTruthy());
  });
});
