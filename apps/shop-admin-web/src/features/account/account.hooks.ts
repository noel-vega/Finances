import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"
import { queryClient } from "../../lib/react-query-client"

export function getAccountQueryOptions() {
  return queryOptions({
    queryKey: ["account"],
    queryFn: () => adminApi.account.get(),
  })
}

export function useAccountQuery() {
  return useQuery(getAccountQueryOptions())
}

export function useUpdateAccountMutation() {
  return useMutation({
    mutationFn: (params: Parameters<typeof adminApi.account.update>[0]) =>
      adminApi.account.update(params),
    onSuccess: () => {
      queryClient.invalidateQueries(getAccountQueryOptions())
    },
  })
}
