import { findNearbyPlaces } from './nearbyPlaces';
import type { NearbyPlace, PlacesRepository } from '../data/placesRepository';

const place: NearbyPlace = {
  id: 'p1',
  name: 'Example Cafe',
  address: '1 Example Street',
  latitude: 51.5,
  longitude: -0.12,
};

describe('findNearbyPlaces', () => {
  it('returns what the repository found', async () => {
    const repo: PlacesRepository = { searchNearby: jest.fn().mockResolvedValue([place]) };

    const result = await findNearbyPlaces({ latitude: 51.5, longitude: -0.12 }, repo);

    expect(result).toEqual([place]);
    expect(repo.searchNearby).toHaveBeenCalledWith({ latitude: 51.5, longitude: -0.12 });
  });

  // The nearby list is a convenience on top of the picker. Losing it — a
  // missing key, a quota error, no network — must not stop someone sharing
  // where they are, so a failure is an empty list rather than a throw.
  it('is empty when the lookup fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repo: PlacesRepository = {
      searchNearby: jest.fn().mockRejectedValue(new Error('quota exceeded')),
    };

    const result = await findNearbyPlaces({ latitude: 51.5, longitude: -0.12 }, repo);

    expect(result).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  // What the repository returns with no key configured.
  it('is empty when there is nothing nearby', async () => {
    const repo: PlacesRepository = { searchNearby: jest.fn().mockResolvedValue([]) };

    expect(await findNearbyPlaces({ latitude: 0, longitude: 0 }, repo)).toEqual([]);
  });
});
