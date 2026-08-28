import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { PosCatalogPage, PosCatalogProduct, PosScanResult } from 'pos-sdk';

import { posApi } from '@/lib/pos-api';

const PAGE_SIZE = 50;

export function useCatalog(search: string) {
  const term = search.trim();
  return useInfiniteQuery({
    queryKey: ['catalog', term] as const,
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam }): Promise<PosCatalogPage> => {
      const page = await posApi.catalog.list({
        ...(term ? { search: term } : {}),
        limit: PAGE_SIZE,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      });
      if (!page) throw new Error('Failed to load catalog');
      return page;
    },
    getNextPageParam: (lastPage) =>
      lastPage.nextCursor ? Number(lastPage.nextCursor) : undefined,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id] as const,
    queryFn: async (): Promise<PosCatalogProduct> => {
      const product = await posApi.catalog.getById(id);
      if (!product) throw new Error('Product not found');
      return product;
    },
  });
}

export function useScan(code: string | null) {
  return useQuery({
    queryKey: ['scan', code] as const,
    enabled: code !== null,
    retry: false,
    queryFn: async (): Promise<PosScanResult> => {
      const result = await posApi.catalog.scan(code as string);
      if (!result) throw new Error('No product matches that code');
      return result;
    },
  });
}
