import { queryOptions, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"

export function getListCartsQueryOptions() {
  return queryOptions({
    queryKey: ["carts"],
    queryFn: () => adminApi.carts.list(),
  })
}

export function useListCartsQuery() {
  return useQuery(getListCartsQueryOptions())
}

export function getCartQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["carts", id],
    queryFn: () => adminApi.carts.getById(id),
  })
}

export function useCartQuery(id: number) {
  return useQuery(getCartQueryOptions(id))
}
