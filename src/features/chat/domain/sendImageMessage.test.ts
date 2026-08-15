import { sendImageMessage } from './sendMessage';
import { IMAGE_PREVIEW_TEXT } from './message';
import type { ChatMediaRepository, PickedImage } from '../data/chatMediaRepository';
import type { ChatRepository } from '../data/chatRepository';

const picked: PickedImage = { uri: 'file:///raw.jpg', width: 2000, height: 1000 };

function fakeMediaRepo(image: PickedImage | null = picked): jest.Mocked<ChatMediaRepository> {
  return {
    pickImage: jest.fn().mockResolvedValue(image),
    compressImage: jest.fn().mockResolvedValue('file:///small.jpg'),
    uploadImage: jest.fn().mockResolvedValue('https://cdn/photo.jpg'),
  };
}

function fakeChatRepo(): jest.Mocked<ChatRepository> {
  return {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    observeMessages: jest.fn(),
    observeConversationMeta: jest.fn(),
    markDelivered: jest.fn(),
    markSeen: jest.fn(),
    observeConversations: jest.fn(),
  };
}

describe('sendImageMessage', () => {
  it('compresses, uploads, then writes a message pointing at the upload', async () => {
    const media = fakeMediaRepo();
    const chat = fakeChatRepo();

    const sent = await sendImageMessage('uid-b', 'uid-a', 'library', media, chat);

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

    await sendImageMessage('uid-a', 'uid-b', 'library', media, chat);

    expect(order).toEqual(['upload', 'write']);
  });

  it('records the aspect ratio so the bubble does not jump once it loads', async () => {
    const chat = fakeChatRepo();

    await sendImageMessage('uid-a', 'uid-b', 'library', fakeMediaRepo(), chat);

    expect(chat.sendMessage.mock.calls[0][3]).toMatchObject({ mediaAspectRatio: 2 });
  });

  it('previews as a photo in the chat list, since there is no text', async () => {
    const chat = fakeChatRepo();

    await sendImageMessage('uid-a', 'uid-b', 'library', fakeMediaRepo(), chat);

    expect(chat.sendMessage.mock.calls[0][3]).toMatchObject({ preview: IMAGE_PREVIEW_TEXT });
  });

  it('reports a cancelled picker without uploading or writing', async () => {
    const media = fakeMediaRepo(null);
    const chat = fakeChatRepo();

    const sent = await sendImageMessage('uid-a', 'uid-b', 'library', media, chat);

    expect(sent).toBe(false);
    expect(media.uploadImage).not.toHaveBeenCalled();
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });

  it('passes the requested source through to the picker', async () => {
    const media = fakeMediaRepo();

    await sendImageMessage('uid-a', 'uid-b', 'camera', media, fakeChatRepo());

    expect(media.pickImage).toHaveBeenCalledWith('camera');
  });

  it('does not write a message when the upload fails', async () => {
    const media = fakeMediaRepo();
    media.uploadImage.mockRejectedValue(new Error('storage unavailable'));
    const chat = fakeChatRepo();

    await expect(sendImageMessage('uid-a', 'uid-b', 'library', media, chat)).rejects.toThrow(
      'storage unavailable',
    );
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });
});
