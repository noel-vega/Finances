import { queryOptions, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"

export function getDashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: ["dashboard"],
    queryFn: adminApi.dashboard.get,
  })
}

export function useDashboardSummaryQuery() {
  return useQuery(getDashboardSummaryQueryOptions())
}
