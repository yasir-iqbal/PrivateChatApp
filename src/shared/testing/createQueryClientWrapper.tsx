import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// QueryClient schedules real timers (garbage collection, retries) that keep
// the Jest process alive after the test finishes unless unmounted. Call this
// once at the top of a `describe` block (not inside an `it`) — it registers
// its own beforeEach/afterEach to give every test a fresh, cleanly-torn-down
// client via the returned Wrapper.
export function createQueryClientWrapper() {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
    queryClient.unmount();
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
