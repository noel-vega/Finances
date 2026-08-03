import { queryOptions, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"

export function getListInventoryQueryOptions() {
  return queryOptions({
    queryKey: ["inventory"],
    queryFn: adminApi.inventory.list,
  })
}

export function useListInventoryQuery() {
  return useQuery(getListInventoryQueryOptions())
}
