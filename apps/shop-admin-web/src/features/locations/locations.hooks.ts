import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"
import { queryClient } from "../../lib/react-query-client"

export function getListLocationsQueryOptions() {
  return queryOptions({
    queryKey: ["locations"],
    queryFn: adminApi.locations.list,
  })
}

export function useListLocationsQuery() {
  return useQuery(getListLocationsQueryOptions())
}

export function useCreateLocationMutation() {
  return useMutation({
    mutationFn: adminApi.locations.create,
    onSuccess: () => {
      queryClient.invalidateQueries(getListLocationsQueryOptions())
    },
  })
}
