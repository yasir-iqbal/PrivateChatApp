import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listContacts } from '../domain/listContacts';
import { removeContact } from '../domain/removeContact';
import { contactsQueryKey } from './contactsQueryKey';

export function useContacts(ownerUid: string | undefined) {
  const queryClient = useQueryClient();

  const contacts = useQuery({
    queryKey: contactsQueryKey(ownerUid),
    queryFn: () => listContacts(ownerUid as string),
    enabled: !!ownerUid,
  });

  const remove = useMutation({
    mutationFn: (contactUid: string) => removeContact(ownerUid as string, contactUid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsQueryKey(ownerUid) }),
  });

  return { contacts, remove };
}
