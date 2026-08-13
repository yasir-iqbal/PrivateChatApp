import { useMutation } from '@tanstack/react-query';

import { logOut } from '../domain/logOut';

export function useSignOut() {
  return useMutation({ mutationFn: () => logOut() });
}
