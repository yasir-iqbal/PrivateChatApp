import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { User } from '@react-native-firebase/auth';

import { updateDisplayName } from '../domain/updateDisplayName';

export function useEditDisplayName(
  user: User,
  currentName: string,
  refreshAuthState: () => Promise<void>,
) {
  const [draft, setDraft] = useState(currentName);
  const [isEditing, setEditing] = useState(false);

  const mutation = useMutation({
    mutationFn: (name: string) => updateDisplayName(user, name),
    onSuccess: async () => {
      // The auth profile does not re-emit on change, so the new name only
      // reaches the UI if the caller refreshes it.
      await refreshAuthState();
      setEditing(false);
    },
  });

  function save() {
    const trimmed = draft.trim();
    if (trimmed === '' || trimmed === currentName) {
      setEditing(false);
      setDraft(currentName);
      return;
    }
    mutation.mutate(trimmed);
  }

  function cancel() {
    setDraft(currentName);
    setEditing(false);
  }

  return {
    draft,
    setDraft,
    isEditing,
    beginEditing: () => {
      setDraft(currentName);
      setEditing(true);
    },
    save,
    cancel,
    isSaving: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
