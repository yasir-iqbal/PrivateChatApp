import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChatScreen } from './ChatScreen';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import type { Message } from '../domain/message';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';

jest.mock('../hooks/useMessages');
jest.mock('../hooks/useSendMessage');

const mockUseMessages = useMessages as jest.MockedFunction<typeof useMessages>;
const mockUseSendMessage = useSendMessage as jest.MockedFunction<typeof useSendMessage>;

const authUser: AuthUser = {
  uid: 'uid-me',
  email: 'me@b.com',
  displayName: 'Me',
  photoURL: null,
  emailVerified: true,
};

function msg(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    senderId: 'uid-me',
    text: 'hello',
    sentAt: 1,
    clientSentAt: 1,
    pending: false,
    ...overrides,
  };
}

function sendStub(overrides: Record<string, unknown> = {}) {
  return {
    draft: '',
    setDraft: jest.fn(),
    send: jest.fn(),
    canSend: false,
    error: null,
    ...overrides,
  } as any;
}

function renderScreen(navigation = { goBack: jest.fn(), navigate: jest.fn() }) {
  render(
    <ThemeProvider>
      <ChatScreen
        {...({
          navigation,
          route: { params: { contactUid: 'uid-bob', contactName: 'Bob' } },
        } as any)}
        authUser={authUser}
      />
    </ThemeProvider>,
  );
  return { navigation };
}

describe('ChatScreen', () => {
  beforeEach(() => {
    mockUseSendMessage.mockReturnValue(sendStub());
  });

  it('shows the contact name in the header', () => {
    mockUseMessages.mockReturnValue({ messages: [], loading: false, error: null });

    renderScreen();

    expect(screen.getByText('Bob')).toBeTruthy();
  });

  it('renders the message history', () => {
    mockUseMessages.mockReturnValue({
      messages: [msg({ id: 'm1', text: 'hi' }), msg({ id: 'm2', text: 'there', senderId: 'uid-bob' })],
      loading: false,
      error: null,
    });

    renderScreen();

    expect(screen.getByText('hi')).toBeTruthy();
    expect(screen.getByText('there')).toBeTruthy();
  });

  it('prompts when there is no history yet', () => {
    mockUseMessages.mockReturnValue({ messages: [], loading: false, error: null });

    renderScreen();

    expect(screen.getByText('No messages yet. Say hello.')).toBeTruthy();
  });

  it('surfaces a listener failure', () => {
    mockUseMessages.mockReturnValue({ messages: [], loading: false, error: new Error('permission denied') });

    renderScreen();

    expect(screen.getByText('permission denied')).toBeTruthy();
  });

  it('sends when the send button is pressed', () => {
    mockUseMessages.mockReturnValue({ messages: [], loading: false, error: null });
    const send = jest.fn();
    mockUseSendMessage.mockReturnValue(sendStub({ draft: 'hello', canSend: true, send }));

    renderScreen();
    fireEvent.press(screen.getByLabelText('Send message'));

    expect(send).toHaveBeenCalled();
  });

  it('routes typing into the draft', () => {
    mockUseMessages.mockReturnValue({ messages: [], loading: false, error: null });
    const setDraft = jest.fn();
    mockUseSendMessage.mockReturnValue(sendStub({ setDraft }));

    renderScreen();
    fireEvent.changeText(screen.getByTestId('chat-input'), 'typing');

    expect(setDraft).toHaveBeenCalledWith('typing');
  });
});
