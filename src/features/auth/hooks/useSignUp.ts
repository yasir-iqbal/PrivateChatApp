import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { signUp } from '../domain/signUp';
import { signUpSchema, type SignUpInput } from '../domain/validation';

export function useSignUp() {
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: SignUpInput) => signUp(input),
  });

  const submit = form.handleSubmit((input) => mutation.mutateAsync(input));

  return { form, submit, ...mutation };
}
