import { useEffect, useState } from 'react';

import { getUserProfiles } from '../../profile/domain/getUserProfiles';
import type { UserProfile } from '../../profile/data/userProfileRepository';
import { observeConversations, type ConversationSummary } from '../domain/observeConversations';

export type ConversationRow = ConversationSummary & {
  profile: UserProfile | null;
};

export type ConversationsState = {
  conversations: ConversationRow[];
  loading: boolean;
  error: Error | null;
};

export function useConversations(currentUid: string): ConversationsState {
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [profilesByUid, setProfilesByUid] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    return observeConversations(
      currentUid,
      (incoming) => {
        setSummaries(incoming);
        setLoading(false);
      },
      (listenerError) => {
        setError(listenerError);
        setLoading(false);
      },
    );
  }, [currentUid]);

  // Fetched separately from the conversations so a name or avatar change
  // shows up without every conversation document having to be rewritten.
  // Keyed by the uid list so it refetches only when the set changes.
  const uidKey = summaries.map((summary) => summary.otherUid).sort().join(',');

  useEffect(() => {
    if (uidKey === '') return;
    let cancelled = false;
    getUserProfiles(uidKey.split(','))
      .then((profiles) => {
        if (cancelled) return;
        setProfilesByUid(Object.fromEntries(profiles.map((profile) => [profile.uid, profile])));
      })
      .catch((profileError) => {
        // The list still renders without them, just without names.
        console.warn('Failed to load conversation profiles', profileError);
      });
    return () => {
      cancelled = true;
    };
  }, [uidKey]);

  const conversations = summaries.map((summary) => ({
    ...summary,
    profile: profilesByUid[summary.otherUid] ?? null,
  }));

  return { conversations, loading, error };
}
