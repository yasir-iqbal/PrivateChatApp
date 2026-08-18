import { useQuery } from '@tanstack/react-query';

import { listSharedMedia } from '../domain/listSharedMedia';

export function useSharedMedia(currentUid: string, otherUid: string) {
  return useQuery({
    queryKey: ['sharedMedia', currentUid, otherUid],
    queryFn: () => listSharedMedia(currentUid, otherUid),
  });
}
