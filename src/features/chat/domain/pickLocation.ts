import {
  nativeChatMediaRepository,
  type ChatMediaRepository,
  type Coordinates,
} from '../data/chatMediaRepository';

export type PickedLocation = Coordinates & {
  address: string | null;
};

// Reads the current position and, separately, tries to describe it. The
// address is best effort: a failed lookup must not stop someone sharing where
// they are.
export async function readCurrentLocation(
  repo: ChatMediaRepository = nativeChatMediaRepository,
): Promise<PickedLocation> {
  const position = await repo.getCurrentPosition();
  const address = await repo.describePosition(position);
  return { ...position, address };
}

export async function describeLocation(
  position: Coordinates,
  repo: ChatMediaRepository = nativeChatMediaRepository,
): Promise<string | null> {
  return repo.describePosition(position);
}
