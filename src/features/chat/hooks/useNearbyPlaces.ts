import { useQuery } from '@tanstack/react-query';

import { hasPlacesKey } from '../../../shared/config/places';
import type { Coordinates } from '../data/chatMediaRepository';
import { findNearbyPlaces } from '../domain/nearbyPlaces';

export function useNearbyPlaces(position: Coordinates | null) {
  return useQuery({
    queryKey: ['nearbyPlaces', position?.latitude, position?.longitude],
    queryFn: () => findNearbyPlaces(position as Coordinates),
    // Skipped entirely without a key, so no request is made and no error is
    // shown — the picker just has no list.
    enabled: position !== null && hasPlacesKey(),
    // Places is billed per request; the same point should not be re-charged
    // while the user is still looking at the same screen.
    staleTime: 5 * 60 * 1000,
  });
}
