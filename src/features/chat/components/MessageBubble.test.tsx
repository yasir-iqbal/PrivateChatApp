import { render, screen } from '@testing-library/react-native';

import { MessageBubble } from './MessageBubble';
import { ThemeProvider } from '../../../shared/theme';
import type { Message } from '../domain/message';

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    senderId: 'uid-me',
    type: 'text',
    text: 'hello',
    mediaUrl: null,
    mediaAspectRatio: null,
    durationMs: null,
    latitude: null,
    longitude: null,
    sentAt: 1_700_000_000_000,
    clientSentAt: 1_700_000_000_000,
    pending: false,
    ...overrides,
  };
}

function renderBubble(overrides: Partial<Message> = {}, isMine = true) {
  render(
    <ThemeProvider>
      <MessageBubble message={message(overrides)} isMine={isMine} status="sent" />
    </ThemeProvider>,
  );
}

describe('MessageBubble', () => {
  it('renders text', () => {
    renderBubble();

    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('renders a photo', () => {
    renderBubble({ type: 'image', text: '', mediaUrl: 'https://cdn/p.jpg', mediaAspectRatio: 1.5 });

    expect(screen.getByLabelText('Photo')).toBeTruthy();
  });

  it('renders a video with a play control', () => {
    renderBubble({ type: 'video', text: '', mediaUrl: 'https://cdn/v.mp4', durationMs: 4000 });

    expect(screen.getByLabelText('Play video')).toBeTruthy();
  });

  it('renders a voice message with a play control', () => {
    renderBubble({ type: 'voice', text: '', mediaUrl: 'https://cdn/v.m4a', durationMs: 4000 });

    expect(screen.getByLabelText('Play voice message')).toBeTruthy();
  });

  it('renders a location that opens in maps', () => {
    renderBubble({ type: 'location', text: '', latitude: 51.5, longitude: -0.12 });

    expect(screen.getByLabelText('Open location in maps')).toBeTruthy();
    expect(screen.getByText('51.50000, -0.12000')).toBeTruthy();
  });

  // A message claiming to be media without a URL would otherwise render an
  // empty bubble; falling back to text at least shows something.
  it('falls back to text when a media message has no url', () => {
    renderBubble({ type: 'image', text: 'broken', mediaUrl: null });

    expect(screen.getByText('broken')).toBeTruthy();
  });

  it('shows no ticks on the other side messages', () => {
    renderBubble({}, false);

    expect(screen.queryByLabelText('Sent')).toBeNull();
  });
});
