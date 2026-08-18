import { registerForPush, unregisterFromPush } from './pushRegistration';
import type { PushRepository } from '../data/pushRepository';

function fakeRepo(overrides: Partial<jest.Mocked<PushRepository>> = {}): jest.Mocked<PushRepository> {
  return {
    requestPermission: jest.fn().mockResolvedValue(true),
    getToken: jest.fn().mockResolvedValue('token-1'),
    onTokenRefresh: jest.fn(),
    saveToken: jest.fn().mockResolvedValue(undefined),
    removeToken: jest.fn().mockResolvedValue(undefined),
    onNotificationOpened: jest.fn(),
    getInitialNotification: jest.fn(),
    ...overrides,
  } as jest.Mocked<PushRepository>;
}

describe('registerForPush', () => {
  it('stores the token against the signed-in user', async () => {
    const repo = fakeRepo();

    const result = await registerForPush('uid-me', repo);

    expect(result).toEqual({ status: 'registered', token: 'token-1' });
    expect(repo.saveToken).toHaveBeenCalledWith('uid-me', 'token-1');
  });

  // Reported rather than thrown: no notifications must never stop the app
  // working.
  it('reports a refused permission without storing anything', async () => {
    const repo = fakeRepo({ requestPermission: jest.fn().mockResolvedValue(false) });

    const result = await registerForPush('uid-me', repo);

    expect(result).toEqual({ status: 'denied' });
    expect(repo.getToken).not.toHaveBeenCalled();
    expect(repo.saveToken).not.toHaveBeenCalled();
  });

  it('reports an unavailable token without storing anything', async () => {
    const repo = fakeRepo({ getToken: jest.fn().mockResolvedValue(null) });

    const result = await registerForPush('uid-me', repo);

    expect(result).toEqual({ status: 'unavailable' });
    expect(repo.saveToken).not.toHaveBeenCalled();
  });
});

describe('unregisterFromPush', () => {
  // Without this a shared phone keeps receiving the previous user's messages.
  it('removes the token for that user', async () => {
    const repo = fakeRepo();

    await unregisterFromPush('uid-me', 'token-1', repo);

    expect(repo.removeToken).toHaveBeenCalledWith('uid-me', 'token-1');
  });
});
