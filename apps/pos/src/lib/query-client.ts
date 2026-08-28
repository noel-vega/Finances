import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // the catalog is read-mostly and the shop floor tolerates slightly
      // stale prices/stock far better than a spinner — refetch in the
      // background instead
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
  },
});

// survives app restarts, so a paired device shows its catalog offline
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'pos_query_cache',
});
