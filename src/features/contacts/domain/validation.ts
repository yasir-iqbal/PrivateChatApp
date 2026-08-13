import { z } from 'zod';

export const addContactSchema = z.object({
  email: z.email('Enter a valid email'),
});

export type AddContactInput = z.infer<typeof addContactSchema>;
