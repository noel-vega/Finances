import { queryOptions, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"

export function getListOrdersQueryOptions() {
  return queryOptions({
    queryKey: ["orders"],
    queryFn: () => adminApi.orders.list(),
  })
}

export function useListOrdersQuery() {
  return useQuery(getListOrdersQueryOptions())
}

export function getOrderQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["orders", id],
    queryFn: () => adminApi.orders.getById(id),
  })
}

export function useOrderQuery(id: number) {
  return useQuery(getOrderQueryOptions(id))
}
