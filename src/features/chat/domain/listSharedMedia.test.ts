import { listSharedMedia, MEDIA_SCAN_LIMIT, toSharedMedia } from './listSharedMedia';
import type { Message } from './message';
import type { ChatRepository } from '../data/chatRepository';

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    senderId: 'uid-me',
    type: 'text',
    text: '',
    mediaUrl: null,
    mediaAspectRatio: null,
    durationMs: null,
    latitude: null,
    longitude: null,
    address: null,
    sentAt: 1,
    clientSentAt: 1,
    pending: false,
    deletedFor: [],
    deletedForEveryone: false,
    ...overrides,
  };
}

const photo = message({ id: 'photo', type: 'image', mediaUrl: 'https://cdn/p.jpg' });
const clip = message({ id: 'clip', type: 'video', mediaUrl: 'https://cdn/v.mp4' });

describe('toSharedMedia', () => {
  it('keeps photos and videos', () => {
    expect(toSharedMedia([photo, clip], 'uid-me').map((m) => m.id)).toEqual(['photo', 'clip']);
  });

  it('drops text, voice and location', () => {
    const others = [
      message({ id: 'text', type: 'text', text: 'hi' }),
      message({ id: 'voice', type: 'voice', mediaUrl: 'https://cdn/v.m4a' }),
      message({ id: 'loc', type: 'location', latitude: 1, longitude: 2 }),
    ];

    expect(toSharedMedia(others, 'uid-me')).toEqual([]);
  });

  // A gallery that still showed deleted media would be a way around deleting
  // it.
  it('drops media withdrawn for everyone', () => {
    const withdrawn = message({ ...photo, id: 'gone', deletedForEveryone: true });

    expect(toSharedMedia([withdrawn], 'uid-me')).toEqual([]);
  });

  it('drops media this user hid', () => {
    const hidden = message({ ...photo, id: 'hidden', deletedFor: ['uid-me'] });

    expect(toSharedMedia([hidden], 'uid-me')).toEqual([]);
  });

  it('keeps media the other participant hid', () => {
    const hidden = message({ ...photo, id: 'kept', deletedFor: ['uid-bob'] });

    expect(toSharedMedia([hidden], 'uid-me').map((m) => m.id)).toEqual(['kept']);
  });

  // A media message with no URL cannot be rendered, and would leave a blank
  // tile in the grid.
  it('drops media with no url', () => {
    expect(toSharedMedia([message({ type: 'image', mediaUrl: null })], 'uid-me')).toEqual([]);
  });
});

describe('listSharedMedia', () => {
  it('scans a bounded window of the conversation', async () => {
    const repo = {
      listRecentMessages: jest.fn().mockResolvedValue([photo, clip]),
    } as unknown as ChatRepository;

    const result = await listSharedMedia('uid-me', 'uid-bob', repo);

    expect(repo.listRecentMessages).toHaveBeenCalledWith('uid-bob_uid-me', MEDIA_SCAN_LIMIT);
    expect(result.map((m) => m.id)).toEqual(['photo', 'clip']);
  });
});
