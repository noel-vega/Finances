import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"
import { queryClient } from "../../lib/react-query-client"

export function getListBrandsQueryOptions() {
  return queryOptions({
    queryKey: ["brands"],
    queryFn: adminApi.brands.list,
  })
}

export function useListBrandsQuery() {
  return useQuery(getListBrandsQueryOptions())
}

export function useCreateBrandMutation() {
  return useMutation({
    mutationFn: adminApi.brands.create,
    onSuccess: () => {
      queryClient.invalidateQueries(getListBrandsQueryOptions())
    },
  })
}
