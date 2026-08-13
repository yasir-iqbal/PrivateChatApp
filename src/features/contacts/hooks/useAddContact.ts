import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { addContactByEmail } from '../domain/addContactByEmail';
import { addContactSchema, type AddContactInput } from '../domain/validation';
import { contactsQueryKey } from './contactsQueryKey';

export function useAddContact(ownerUid: string, ownerEmail: string | null) {
  const queryClient = useQueryClient();

  const form = useForm<AddContactInput>({
    resolver: zodResolver(addContactSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: AddContactInput) => addContactByEmail(ownerUid, ownerEmail, input.email),
    onSuccess: (result) => {
      // 'not-found' and 'self' are successful lookups with nothing added, so
      // the list is untouched and the typed email stays put for correction.
      if (result.status === 'added') {
        queryClient.invalidateQueries({ queryKey: contactsQueryKey(ownerUid) });
        form.reset();
      }
    },
  });

  const submit = form.handleSubmit((input) => mutation.mutateAsync(input));

  return { form, submit, ...mutation };
}
