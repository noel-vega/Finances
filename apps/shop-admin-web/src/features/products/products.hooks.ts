import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"
import { queryClient } from "../../lib/react-query-client";

export function getListProductsQueryOptions() {
    return queryOptions({
        queryKey: ['products'],
        queryFn: adminApi.products.list
    })
}

export function useListProductsQuery() {
    return useQuery(getListProductsQueryOptions())
}


export function useCreateProductMutation() {
  return useMutation({
    mutationFn: adminApi.products.create,
    onSuccess: () => {
      queryClient.invalidateQueries(getListProductsQueryOptions());
    },
  });
}

export function getProductQueryOptions(id: number) {
  return queryOptions({
    queryKey: ['products', id],
    queryFn: () => adminApi.products.getById(id)
  })
}

export function useProductQuery(id: number) {
  return useQuery(getProductQueryOptions(id))
}

export function getProductVariantsQueryOptions(id: number) {
  return queryOptions({
    queryKey: ['products', id, 'variants'],
    queryFn: () => adminApi.products.variants.list(id)
  })
}

export function useProductVariantsQuery(id: number) {
  return useQuery(getProductVariantsQueryOptions(id))
}

export function useCreateVariantsMutation(productId: number) {
  return useMutation({
    mutationFn: (params: Parameters<typeof adminApi.products.variants.create>[1]) =>
      adminApi.products.variants.create(productId, params),
    onSuccess: () => {
      queryClient.invalidateQueries(getProductQueryOptions(productId));
      queryClient.invalidateQueries(getProductVariantsQueryOptions(productId));
      queryClient.invalidateQueries(getProductOptionsQueryOptions(productId));
    },
  });
}

export function getProductOptionsQueryOptions(id: number) {
  return queryOptions({
    queryKey: ['products', id, 'options'],
    queryFn: () => adminApi.products.options.list(id)
  })
}

export function useProductOptionsQuery(id: number) {
  return useQuery(getProductOptionsQueryOptions(id))
}

export function useDeleteProductOptionMutation(productId: number) {
  return useMutation({
    mutationFn: (optionId: number) =>
      adminApi.products.options.remove(productId, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries(getProductOptionsQueryOptions(productId));
      queryClient.invalidateQueries(getProductVariantsQueryOptions(productId));
      queryClient.invalidateQueries(getProductQueryOptions(productId));
    },
  });
}

export function useUpdateProductOptionMutation(productId: number) {
  return useMutation({
    mutationFn: ({ optionId, name }: { optionId: number; name: string }) =>
      adminApi.products.options.update(productId, optionId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries(getProductOptionsQueryOptions(productId));
    },
  });
}

export function useDeleteProductOptionValueMutation(productId: number) {
  return useMutation({
    mutationFn: ({
      optionId,
      valueId,
    }: {
      optionId: number;
      valueId: number;
    }) => adminApi.products.options.values.remove(productId, optionId, valueId),
    onSuccess: () => {
      queryClient.invalidateQueries(getProductOptionsQueryOptions(productId));
      queryClient.invalidateQueries(getProductVariantsQueryOptions(productId));
    },
  });
}

export function useDeleteProductMutation() {
  return useMutation({
    mutationFn: adminApi.products.remove,
    onSuccess: () => {
      queryClient.invalidateQueries(getListProductsQueryOptions());
    },
  });
}

export function useUpdateProductMutation(id: number) {
  return useMutation({
    mutationFn: (params: Parameters<typeof adminApi.products.update>[1]) =>
      adminApi.products.update(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries(getProductQueryOptions(id));
      queryClient.invalidateQueries(getListProductsQueryOptions());
    },
  });
}

export function useUpdateVariantMutation(productId: number) {
  return useMutation({
    mutationFn: ({
      variantId,
      ...params
    }: { variantId: number } & Parameters<
      typeof adminApi.products.variants.update
    >[2]) => adminApi.products.variants.update(productId, variantId, params),
    onSuccess: () => {
      queryClient.invalidateQueries(getProductVariantsQueryOptions(productId));
    },
  });
}