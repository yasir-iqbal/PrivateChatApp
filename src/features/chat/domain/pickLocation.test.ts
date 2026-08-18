import { describeLocation, readCurrentLocation } from './pickLocation';
import type { ChatMediaRepository } from '../data/chatMediaRepository';

function fakeRepo(overrides: Partial<jest.Mocked<ChatMediaRepository>> = {}) {
  return {
    getCurrentPosition: jest.fn().mockResolvedValue({ latitude: 51.5, longitude: -0.12 }),
    describePosition: jest.fn().mockResolvedValue('1 Example Street, London'),
    ...overrides,
  } as unknown as ChatMediaRepository;
}

describe('readCurrentLocation', () => {
  it('returns the position with its address', async () => {
    const result = await readCurrentLocation(fakeRepo());

    expect(result).toEqual({
      latitude: 51.5,
      longitude: -0.12,
      address: '1 Example Street, London',
    });
  });

  // An address is a nicety; failing to resolve one must not stop someone
  // sharing where they are.
  it('returns the position even with no address', async () => {
    const repo = fakeRepo({ describePosition: jest.fn().mockResolvedValue(null) });

    const result = await readCurrentLocation(repo);

    expect(result).toMatchObject({ latitude: 51.5, address: null });
  });

  // A refused permission has to surface: there is no point to show.
  it('propagates a refused location permission', async () => {
    const repo = fakeRepo({
      getCurrentPosition: jest.fn().mockRejectedValue(new Error('Location permission was not granted.')),
    });

    await expect(readCurrentLocation(repo)).rejects.toThrow('permission');
  });
});

describe('describeLocation', () => {
  it('describes an arbitrary point, not just the current one', async () => {
    const repo = fakeRepo();

    await describeLocation({ latitude: 10, longitude: 20 }, repo);

    expect(repo.describePosition).toHaveBeenCalledWith({ latitude: 10, longitude: 20 });
  });
});
