import { useMutation } from '@tanstack/react-query';
import type { CreateOrderPayload, PosOrder } from 'pos-sdk';

import { posApi } from '@/lib/pos-api';
import { queryClient } from '@/lib/query-client';

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload): Promise<PosOrder> => {
      const order = await posApi.orders.create(payload);
      if (!order) throw new Error('The sale could not be completed');
      return order;
    },
    onSuccess: () => {
      // stock just changed — let the catalog and any open product refetch
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
      void queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}
