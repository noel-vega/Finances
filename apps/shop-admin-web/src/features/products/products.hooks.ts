import { queryOptions, useQuery } from "@tanstack/react-query"
import { listProducts } from "./products.api"

export function getListProductsQueryOptions() {
    return queryOptions({
        queryKey: ['products'],
        queryFn: listProducts
    })
}

export function useListProductsQuery() {
    return useQuery(getListProductsQueryOptions())
}