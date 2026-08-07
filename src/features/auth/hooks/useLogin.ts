import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { signIn } from '../domain/signIn';
import { loginSchema, type LoginInput } from '../domain/validation';

export function useLogin() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: LoginInput) => signIn(input),
  });

  const submit = form.handleSubmit((input) => mutation.mutateAsync(input));

  return { form, submit, ...mutation };
}
