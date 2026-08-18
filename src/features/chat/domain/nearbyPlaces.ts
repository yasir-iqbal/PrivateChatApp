import type { Coordinates } from '../data/chatMediaRepository';
import {
  googlePlacesRepository,
  type NearbyPlace,
  type PlacesRepository,
} from '../data/placesRepository';

export type { NearbyPlace };

// Returns an empty list rather than throwing when the lookup fails or no key
// is configured: the nearby list is a convenience on top of the picker, and
// losing it must not stop someone sharing where they are.
export async function findNearbyPlaces(
  position: Coordinates,
  repo: PlacesRepository = googlePlacesRepository,
): Promise<NearbyPlace[]> {
  try {
    return await repo.searchNearby(position);
  } catch (error) {
    console.warn('Nearby places lookup failed', error);
    return [];
  }
}
