import { buildInviteMessage, sendInvite } from './sendInvite';
import type { ShareRepository } from '../data/shareRepository';

describe('sendInvite', () => {
  it('shares a message naming the inviter', async () => {
    const repo: jest.Mocked<ShareRepository> = { share: jest.fn().mockResolvedValue(undefined) };

    await sendInvite('Ada', repo);

    expect(repo.share).toHaveBeenCalledWith(buildInviteMessage('Ada'));
    expect(repo.share.mock.calls[0][0]).toContain('Ada');
  });
});
