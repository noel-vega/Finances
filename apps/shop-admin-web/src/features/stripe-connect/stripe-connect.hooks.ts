import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"

export function getStripeConnectStatusQueryOptions() {
  return queryOptions({
    queryKey: ["stripe-connect", "status"],
    queryFn: () => adminApi.stripeConnect.getStatus(),
  })
}

export function useStripeConnectStatusQuery() {
  return useQuery(getStripeConnectStatusQueryOptions())
}

// called right after the embedded onboarding component exits — webhook
// delivery can lag, so this does a live Stripe lookup instead of trusting
// the cached DB status
export function useRefreshStripeConnectStatus() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.fetchQuery({
      queryKey: ["stripe-connect", "status"],
      queryFn: () => adminApi.stripeConnect.getStatus({ refresh: true }),
    })
}

export function useCreateAccountSessionMutation() {
  return useMutation({
    mutationFn: () => adminApi.stripeConnect.createAccountSession(),
  })
}
