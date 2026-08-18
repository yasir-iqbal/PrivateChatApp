import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

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
    deletedFor: [],
    deletedForEveryone: false,
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

describe('MessageBubble deletion', () => {
  it('shows a placeholder in place of a withdrawn message', () => {
    renderBubble({ deletedForEveryone: true, text: '' });

    expect(screen.getByText('This message was deleted')).toBeTruthy();
  });

  // The content is cleared server-side, but the client must not render media
  // for a withdrawn message even if a stale copy still carries the URL.
  it('does not render media for a withdrawn message', () => {
    renderBubble({
      type: 'image',
      text: '',
      mediaUrl: 'https://cdn/p.jpg',
      deletedForEveryone: true,
    });

    expect(screen.queryByLabelText('Photo')).toBeNull();
    expect(screen.getByText('This message was deleted')).toBeTruthy();
  });

  // Ticks on a tombstone would be claiming delivery of nothing.
  it('shows no ticks on a withdrawn message', () => {
    renderBubble({ deletedForEveryone: true, text: '' });

    expect(screen.queryByLabelText('Sent')).toBeNull();
  });
});

describe('MessageBubble location tap', () => {
  // The regression this guards: LocationMessage had its own Pressable nested
  // inside the bubble's, and on Android the outer one swallowed the tap.
  it('opens maps from a single pressable on the bubble', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

    renderBubble({ type: 'location', text: '', latitude: 51.5, longitude: -0.12 });
    fireEvent.press(screen.getByLabelText('Open location in maps'));

    expect(openURL).toHaveBeenCalledWith(expect.stringContaining('51.5,-0.12'));
    openURL.mockRestore();
  });

  // A device with no maps app rejects openURL; that must not surface as an
  // unhandled rejection, which is how it failed silently.
  it('survives a device that cannot open the link', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    renderBubble({ type: 'location', text: '', latitude: 51.5, longitude: -0.12 });
    fireEvent.press(screen.getByLabelText('Open location in maps'));

    await waitFor(() => expect(warn).toHaveBeenCalled());
    openURL.mockRestore();
    warn.mockRestore();
  });

  it('still long-presses to delete a location message', () => {
    const onLongPress = jest.fn();
    render(
      <ThemeProvider>
        <MessageBubble
          message={message({ type: 'location', text: '', latitude: 51.5, longitude: -0.12 })}
          isMine
          status="sent"
          onLongPress={onLongPress}
        />
      </ThemeProvider>,
    );

    fireEvent(screen.getByLabelText('Open location in maps'), 'longPress');

    expect(onLongPress).toHaveBeenCalled();
  });
});
