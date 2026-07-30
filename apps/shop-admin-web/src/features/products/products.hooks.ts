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
    queryFn: () => adminApi.products.getVariants(id)
  })
}

export function useProductVariantsQuery(id: number) {
  return useQuery(getProductVariantsQueryOptions(id))
}

export function useDeleteProductMutation() {
  return useMutation({
    mutationFn: adminApi.products.remove,
    onSuccess: () => {
      queryClient.invalidateQueries(getListProductsQueryOptions());
    },
  });
}