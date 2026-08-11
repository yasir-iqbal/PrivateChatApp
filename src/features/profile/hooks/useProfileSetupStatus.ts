import { useCallback, useEffect, useState } from 'react';

import { getHasSkippedProfileSetup } from '../domain/getHasSkippedProfileSetup';
import { skipProfileSetup } from '../domain/skipProfileSetup';

export function useProfileSetupStatus(uid: string | undefined) {
  const [hasSkipped, setHasSkipped] = useState(false);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getHasSkippedProfileSetup(uid).then((skipped) => {
      if (!cancelled) {
        setHasSkipped(skipped);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const markSkipped = useCallback(async () => {
    if (!uid) return;
    await skipProfileSetup(uid);
    setHasSkipped(true);
  }, [uid]);

  return { hasSkipped, loading, markSkipped };
}
