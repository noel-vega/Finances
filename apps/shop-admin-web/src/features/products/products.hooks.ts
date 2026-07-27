import { queryOptions, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"

export function getListProductsQueryOptions() {
    return queryOptions({
        queryKey: ['products'],
        queryFn: adminApi.products.list
    })
}

export function useListProductsQuery() {
    return useQuery(getListProductsQueryOptions())
}