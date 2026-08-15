import { messageStatusFor } from './messageStatus';
import type { Message } from './message';

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    senderId: 'uid-me',
    type: 'text',
    mediaUrl: null,
    mediaAspectRatio: null,
    durationMs: null,
    latitude: null,
    longitude: null,
    text: 'hi',
    sentAt: 1000,
    clientSentAt: 1000,
    pending: false,
    ...overrides,
  };
}

describe('messageStatusFor', () => {
  it('is sending while the write is still local', () => {
    expect(messageStatusFor(message({ pending: true }), null)).toBe('sending');
  });

  // A serverTimestamp is null until it round-trips, so this is the same
  // situation seen from the data rather than the metadata.
  it('is sending when the server timestamp has not landed', () => {
    expect(messageStatusFor(message({ sentAt: null }), null)).toBe('sending');
  });

  it('is sent once on the server with nobody having received it', () => {
    expect(messageStatusFor(message(), null)).toBe('sent');
  });

  it('is still sent when the recipient last received an older message', () => {
    expect(messageStatusFor(message({ sentAt: 2000 }), 1000)).toBe('sent');
  });

  it('is delivered once the recipient mark reaches the send time', () => {
    expect(messageStatusFor(message({ sentAt: 1000 }), 1000)).toBe('delivered');
    expect(messageStatusFor(message({ sentAt: 1000 }), 5000)).toBe('delivered');
  });

  it('is seen once the seen mark reaches the send time', () => {
    expect(messageStatusFor(message({ sentAt: 1000 }), 1000, 1000)).toBe('seen');
  });

  // Seen is the stronger claim and wins even if the marks disagree.
  it('prefers seen over delivered', () => {
    expect(messageStatusFor(message({ sentAt: 1000 }), 5000, 5000)).toBe('seen');
  });

  it('is not seen when the seen mark is older than the message', () => {
    expect(messageStatusFor(message({ sentAt: 2000 }), 2000, 1000)).toBe('delivered');
  });
});
