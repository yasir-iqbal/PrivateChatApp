import { hasPlacesKey, PLACES_API_KEY } from '../../../shared/config/places';
import type { Coordinates } from './chatMediaRepository';

export type NearbyPlace = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

export type PlacesRepository = {
  // Empty when no key is configured, so the picker simply shows no list
  // rather than erroring — the feature is optional by design.
  searchNearby: (position: Coordinates) => Promise<NearbyPlace[]>;
};

// How far around the picked point to look.
export const NEARBY_RADIUS_METRES = 500;
export const NEARBY_LIMIT = 15;

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchNearby';

// Only the fields the list actually renders. Places bills by field mask, so
// asking for less costs less.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
].join(',');

type PlacesResponse = {
  places?: {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
  }[];
};

export const googlePlacesRepository: PlacesRepository = {
  async searchNearby({ latitude, longitude }) {
    if (!hasPlacesKey()) return [];

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        maxResultCount: NEARBY_LIMIT,
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: NEARBY_RADIUS_METRES,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Nearby places lookup failed (${response.status}).`);
    }

    const data = (await response.json()) as PlacesResponse;
    return (data.places ?? [])
      .map((place) => ({
        id: place.id ?? '',
        name: place.displayName?.text ?? '',
        address: place.formattedAddress ?? null,
        latitude: place.location?.latitude ?? 0,
        longitude: place.location?.longitude ?? 0,
      }))
      // A place with no name or no point cannot be shown or sent.
      .filter((place) => place.id !== '' && place.name !== '' && place.latitude !== 0);
  },
};
