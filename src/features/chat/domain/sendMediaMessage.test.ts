import { sendImageMessage, sendLocationMessage, sendVideoMessage, sendVoiceMessage } from './sendMediaMessage';
import { PREVIEW_TEXT } from './message';
import type { ChatMediaRepository, PickedImage, PickedVideo } from '../data/chatMediaRepository';
import type { ChatRepository } from '../data/chatRepository';

const picked: PickedImage = { uri: 'file:///raw.jpg', width: 2000, height: 1000 };

const pickedVideo: PickedVideo = { uri: 'file:///clip.mov', width: 1920, height: 1080, durationMs: 4200 };

function fakeMediaRepo(
  image: PickedImage | null = picked,
  video: PickedVideo | null = pickedVideo,
): jest.Mocked<ChatMediaRepository> {
  return {
    pickImage: jest.fn().mockResolvedValue(image),
    pickVideo: jest.fn().mockResolvedValue(video),
    compressImage: jest.fn().mockResolvedValue('file:///small.jpg'),
    uploadImage: jest.fn().mockResolvedValue('https://cdn/photo.jpg'),
    uploadVideo: jest.fn().mockResolvedValue('https://cdn/clip.mp4'),
    uploadVoice: jest.fn().mockResolvedValue('https://cdn/voice.m4a'),
    getCurrentPosition: jest.fn().mockResolvedValue({ latitude: 51.5, longitude: -0.12 }),
    requestMicrophoneAccess: jest.fn().mockResolvedValue(true),
  };
}

function fakeChatRepo(): jest.Mocked<ChatRepository> {
  return {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    observeMessages: jest.fn(),
    observeConversationMeta: jest.fn(),
    markDelivered: jest.fn(),
    markSeen: jest.fn(),
    listRecentMessages: jest.fn(),
    deleteMessageForMe: jest.fn(),
    deleteMessageForEveryone: jest.fn(),
    observeConversations: jest.fn(),
  };
}

describe('sendImageMessage', () => {
  it('compresses, uploads, then writes a message pointing at the upload', async () => {
    const media = fakeMediaRepo();
    const chat = fakeChatRepo();

    const sent = await sendImageMessage('uid-b', 'uid-a', 'library', { mediaRepo: media, repo: chat });

    expect(sent).toBe(true);
    expect(media.compressImage).toHaveBeenCalledWith('file:///raw.jpg');
    expect(media.uploadImage).toHaveBeenCalledWith('uid-a_uid-b', 'file:///small.jpg');
    expect(chat.sendMessage).toHaveBeenCalledWith(
      'uid-a_uid-b',
      ['uid-a', 'uid-b'],
      'uid-b',
      expect.objectContaining({ type: 'image', mediaUrl: 'https://cdn/photo.jpg' }),
    );
  });

  // The order matters: a message written first could point at a file that
  // never finished uploading.
  it('uploads before writing the message', async () => {
    const media = fakeMediaRepo();
    const chat = fakeChatRepo();
    const order: string[] = [];
    media.uploadImage.mockImplementation(async () => {
      order.push('upload');
      return 'https://cdn/photo.jpg';
    });
    chat.sendMessage.mockImplementation(async () => {
      order.push('write');
    });

    await sendImageMessage('uid-a', 'uid-b', 'library', { mediaRepo: media, repo: chat });

    expect(order).toEqual(['upload', 'write']);
  });

  it('records the aspect ratio so the bubble does not jump once it loads', async () => {
    const chat = fakeChatRepo();

    await sendImageMessage('uid-a', 'uid-b', 'library', { mediaRepo: fakeMediaRepo(), repo: chat });

    expect(chat.sendMessage.mock.calls[0][3]).toMatchObject({ mediaAspectRatio: 2 });
  });

  it('previews as a photo in the chat list, since there is no text', async () => {
    const chat = fakeChatRepo();

    await sendImageMessage('uid-a', 'uid-b', 'library', { mediaRepo: fakeMediaRepo(), repo: chat });

    expect(chat.sendMessage.mock.calls[0][3]).toMatchObject({ preview: PREVIEW_TEXT.image });
  });

  it('reports a cancelled picker without uploading or writing', async () => {
    const media = fakeMediaRepo(null);
    const chat = fakeChatRepo();

    const sent = await sendImageMessage('uid-a', 'uid-b', 'library', { mediaRepo: media, repo: chat });

    expect(sent).toBe(false);
    expect(media.uploadImage).not.toHaveBeenCalled();
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });

  it('passes the requested source through to the picker', async () => {
    const media = fakeMediaRepo();

    await sendImageMessage('uid-a', 'uid-b', 'camera', { mediaRepo: media, repo: fakeChatRepo() });

    expect(media.pickImage).toHaveBeenCalledWith('camera');
  });

  it('does not write a message when the upload fails', async () => {
    const media = fakeMediaRepo();
    media.uploadImage.mockRejectedValue(new Error('storage unavailable'));
    const chat = fakeChatRepo();

    await expect(sendImageMessage('uid-a', 'uid-b', 'library', { mediaRepo: media, repo: chat })).rejects.toThrow(
      'storage unavailable',
    );
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });
});

describe('sendVideoMessage', () => {
  it('uploads the clip and records its length and shape', async () => {
    const media = fakeMediaRepo();
    const chat = fakeChatRepo();

    const sent = await sendVideoMessage('uid-a', 'uid-b', 'camera', { mediaRepo: media, repo: chat });

    expect(sent).toBe(true);
    expect(media.uploadVideo).toHaveBeenCalledWith('uid-a_uid-b', 'file:///clip.mov');
    expect(chat.sendMessage.mock.calls[0][3]).toMatchObject({
      type: 'video',
      mediaUrl: 'https://cdn/clip.mp4',
      durationMs: 4200,
      mediaAspectRatio: 16 / 9,
      preview: PREVIEW_TEXT.video,
    });
  });

  // Video is uploaded as picked; the picker caps the duration instead.
  it('does not run video through the image compressor', async () => {
    const media = fakeMediaRepo();

    await sendVideoMessage('uid-a', 'uid-b', 'library', { mediaRepo: media, repo: fakeChatRepo() });

    expect(media.compressImage).not.toHaveBeenCalled();
  });

  it('reports a cancelled picker without uploading', async () => {
    const media = fakeMediaRepo(picked, null);
    const chat = fakeChatRepo();

    const sent = await sendVideoMessage('uid-a', 'uid-b', 'library', { mediaRepo: media, repo: chat });

    expect(sent).toBe(false);
    expect(media.uploadVideo).not.toHaveBeenCalled();
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });
});

describe('sendVoiceMessage', () => {
  it('uploads the recording and keeps its duration', async () => {
    const media = fakeMediaRepo();
    const chat = fakeChatRepo();

    await sendVoiceMessage('uid-a', 'uid-b', 'file:///note.m4a', 3500, {
      mediaRepo: media,
      repo: chat,
    });

    expect(media.uploadVoice).toHaveBeenCalledWith('uid-a_uid-b', 'file:///note.m4a');
    expect(chat.sendMessage.mock.calls[0][3]).toMatchObject({
      type: 'voice',
      mediaUrl: 'https://cdn/voice.m4a',
      durationMs: 3500,
      preview: PREVIEW_TEXT.voice,
    });
  });

  it('does not write a message when the upload fails', async () => {
    const media = fakeMediaRepo();
    media.uploadVoice.mockRejectedValue(new Error('storage unavailable'));
    const chat = fakeChatRepo();

    await expect(
      sendVoiceMessage('uid-a', 'uid-b', 'file:///note.m4a', 1000, { mediaRepo: media, repo: chat }),
    ).rejects.toThrow();
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });
});

describe('sendLocationMessage', () => {
  it('writes the current coordinates', async () => {
    const media = fakeMediaRepo();
    const chat = fakeChatRepo();

    await sendLocationMessage('uid-a', 'uid-b', { mediaRepo: media, repo: chat });

    expect(chat.sendMessage.mock.calls[0][3]).toMatchObject({
      type: 'location',
      latitude: 51.5,
      longitude: -0.12,
      preview: PREVIEW_TEXT.location,
    });
  });

  // Nothing is uploaded for a location, so a refused permission must surface
  // rather than writing a message with no coordinates.
  it('writes nothing when the location cannot be read', async () => {
    const media = fakeMediaRepo();
    media.getCurrentPosition.mockRejectedValue(new Error('Location permission was not granted.'));
    const chat = fakeChatRepo();

    await expect(
      sendLocationMessage('uid-a', 'uid-b', { mediaRepo: media, repo: chat }),
    ).rejects.toThrow('Location permission was not granted.');
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });
});
