import { firestoreBlocksRepository, type BlocksRepository } from '../data/blocksRepository';

export function observeBlocked(
  ownerUid: string,
  onChange: (blockedUids: string[]) => void,
  repo: BlocksRepository = firestoreBlocksRepository,
): () => void {
  return repo.observeBlocked(ownerUid, onChange);
}

export async function blockContact(
  ownerUid: string,
  blockedUid: string,
  repo: BlocksRepository = firestoreBlocksRepository,
): Promise<void> {
  // Blocking yourself would lock you out of your own conversations for no
  // reachable reason.
  if (ownerUid === blockedUid) {
    throw new Error('You cannot block yourself.');
  }
  await repo.block(ownerUid, blockedUid);
}

export async function unblockContact(
  ownerUid: string,
  blockedUid: string,
  repo: BlocksRepository = firestoreBlocksRepository,
): Promise<void> {
  await repo.unblock(ownerUid, blockedUid);
}

export function isBlocked(blockedUids: string[], uid: string): boolean {
  return blockedUids.includes(uid);
}
