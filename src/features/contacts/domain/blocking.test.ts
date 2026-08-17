import { blockContact, isBlocked, observeBlocked, unblockContact } from './blocking';
import type { BlocksRepository } from '../data/blocksRepository';

function fakeRepo(): jest.Mocked<BlocksRepository> {
  return {
    observeBlocked: jest.fn(
      (_ownerUid: string, _onChange: (blockedUids: string[]) => void) => jest.fn(),
    ),
    block: jest.fn().mockResolvedValue(undefined),
    unblock: jest.fn().mockResolvedValue(undefined),
  };
}

describe('blockContact', () => {
  it('records the block against the blocking user', async () => {
    const repo = fakeRepo();

    await blockContact('uid-me', 'uid-bob', repo);

    expect(repo.block).toHaveBeenCalledWith('uid-me', 'uid-bob');
  });

  // Blocking yourself would lock you out of your own conversations for no
  // reachable reason.
  it('refuses to block yourself', async () => {
    const repo = fakeRepo();

    await expect(blockContact('uid-me', 'uid-me', repo)).rejects.toThrow('cannot block yourself');
    expect(repo.block).not.toHaveBeenCalled();
  });
});

describe('unblockContact', () => {
  it('removes the block', async () => {
    const repo = fakeRepo();

    await unblockContact('uid-me', 'uid-bob', repo);

    expect(repo.unblock).toHaveBeenCalledWith('uid-me', 'uid-bob');
  });
});

describe('observeBlocked', () => {
  it('watches the blocking user own list', () => {
    const repo = fakeRepo();
    const onChange = jest.fn();

    observeBlocked('uid-me', onChange, repo);

    expect(repo.observeBlocked).toHaveBeenCalledWith('uid-me', onChange);
  });
});

describe('isBlocked', () => {
  it('is true only for a uid in the list', () => {
    expect(isBlocked(['uid-bob'], 'uid-bob')).toBe(true);
    expect(isBlocked(['uid-bob'], 'uid-ada')).toBe(false);
    expect(isBlocked([], 'uid-bob')).toBe(false);
  });
});
