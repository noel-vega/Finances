import { queryOptions, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"

export function getListCustomersQueryOptions() {
  return queryOptions({
    queryKey: ["customers"],
    queryFn: adminApi.customers.list,
  })
}

export function useListCustomersQuery() {
  return useQuery(getListCustomersQueryOptions())
}
