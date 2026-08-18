import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatScreen } from './ChatScreen';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import type { Message } from '../domain/message';
import { useConversationMeta } from '../hooks/useConversationMeta';
import { useSendAttachment } from '../hooks/useSendAttachment';
import { useBlockStatus } from '../../contacts/hooks/useBlockStatus';
import { useDeleteMessage } from '../hooks/useDeleteMessage';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';

jest.mock('../hooks/useMessages');
jest.mock('../hooks/useSendMessage');
jest.mock('../hooks/useConversationMeta');
jest.mock('../hooks/useSendAttachment');
jest.mock('../hooks/useVoiceRecorder');
jest.mock('../hooks/useDeleteMessage');
jest.mock('../../contacts/hooks/useBlockStatus');

const mockUseMessages = useMessages as jest.MockedFunction<typeof useMessages>;
const mockUseSendMessage = useSendMessage as jest.MockedFunction<typeof useSendMessage>;
const mockUseConversationMeta = useConversationMeta as jest.MockedFunction<typeof useConversationMeta>;
const mockUseSendAttachment = useSendAttachment as jest.MockedFunction<typeof useSendAttachment>;
const mockUseVoiceRecorder = useVoiceRecorder as jest.MockedFunction<typeof useVoiceRecorder>;
const mockUseDeleteMessage = useDeleteMessage as jest.MockedFunction<typeof useDeleteMessage>;
const mockUseBlockStatus = useBlockStatus as jest.MockedFunction<typeof useBlockStatus>;

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
    type: 'text',
    mediaUrl: null,
    mediaAspectRatio: null,
    durationMs: null,
    latitude: null,
    longitude: null,
    address: null,
    deletedFor: [],
    deletedForEveryone: false,
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
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <ChatScreen
          {...({
            navigation,
            route: { params: { contactUid: 'uid-bob', contactName: 'Bob' } },
          } as any)}
          authUser={authUser}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return { navigation };
}

describe('ChatScreen', () => {
  beforeEach(() => {
    mockUseSendMessage.mockReturnValue(sendStub());
    mockUseConversationMeta.mockReturnValue({ otherDeliveredAt: null, otherSeenAt: null });
    mockUseSendAttachment.mockReturnValue({
      isSheetOpen: false,
      openSheet: jest.fn(),
      closeSheet: jest.fn(),
      choose: jest.fn(),
      sendLocation: jest.fn(),
      sendVoice: jest.fn(),
      isSending: false,
      error: null,
    });
    mockUseVoiceRecorder.mockReturnValue({
      isRecording: false,
      elapsedMs: 0,
      start: jest.fn(),
      stop: jest.fn().mockResolvedValue({ status: 'idle' }),
    });
    mockUseDeleteMessage.mockReturnValue({ confirmDelete: jest.fn(), error: null });
    mockUseBlockStatus.mockReturnValue({
      blocked: false,
      toggle: jest.fn(),
      isPending: false,
      error: null,
    });
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

  it('replaces the composer with a notice when the contact is blocked', () => {
    mockUseMessages.mockReturnValue({ messages: [], loading: false, error: null });
    mockUseBlockStatus.mockReturnValue({
      blocked: true,
      toggle: jest.fn(),
      isPending: false,
      error: null,
    });

    renderScreen();

    expect(screen.getByText(/You blocked this contact/)).toBeTruthy();
    expect(screen.queryByTestId('chat-input')).toBeNull();
  });

  // Hiding presence from someone you blocked is the point; showing "online"
  // for a contact you have cut off reads as a bug.
  it('hides presence for a blocked contact', () => {
    mockUseMessages.mockReturnValue({ messages: [], loading: false, error: null });
    mockUseBlockStatus.mockReturnValue({
      blocked: true,
      toggle: jest.fn(),
      isPending: false,
      error: null,
    });

    renderScreen();

    expect(screen.getByLabelText('Unblock contact')).toBeTruthy();
  });

  it('offers blocking from the header when not blocked', () => {
    mockUseMessages.mockReturnValue({ messages: [], loading: false, error: null });
    const toggle = jest.fn();
    mockUseBlockStatus.mockReturnValue({ blocked: false, toggle, isPending: false, error: null });

    renderScreen();
    fireEvent.press(screen.getByLabelText('Block contact'));

    expect(toggle).toHaveBeenCalledWith('Bob');
  });
});
