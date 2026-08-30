import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"
import { queryClient } from "../../lib/react-query-client"

export function getListCategoriesQueryOptions() {
  return queryOptions({
    queryKey: ["categories"],
    queryFn: adminApi.categories.list,
  })
}

export function useListCategoriesQuery() {
  return useQuery(getListCategoriesQueryOptions())
}

export function useCreateCategoryMutation() {
  return useMutation({
    mutationFn: adminApi.categories.create,
    onSuccess: () => {
      queryClient.invalidateQueries(getListCategoriesQueryOptions())
    },
  })
}
