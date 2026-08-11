import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"
import { queryClient } from "../../lib/react-query-client"

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

export function useGetShippingRatesMutation() {
  return useMutation({
    mutationFn: (orderId: number) => adminApi.orders.getShippingRates(orderId),
  })
}

export function useBuyShippingLabelMutation(orderId: number) {
  return useMutation({
    mutationFn: (params: Parameters<typeof adminApi.orders.buyShippingLabel>[1]) =>
      adminApi.orders.buyShippingLabel(orderId, params),
    onSuccess: () => {
      queryClient.invalidateQueries(getOrderQueryOptions(orderId))
    },
  })
}
