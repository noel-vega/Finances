import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"
import { queryClient } from "../../lib/react-query-client"

export function getListUsersQueryOptions() {
  return queryOptions({
    queryKey: ["users"],
    queryFn: adminApi.users.list,
  })
}

export function useListUsersQuery() {
  return useQuery(getListUsersQueryOptions())
}

export function useCreateUserMutation() {
  return useMutation({
    mutationFn: adminApi.users.create,
    onSuccess: () => {
      queryClient.invalidateQueries(getListUsersQueryOptions())
    },
  })
}

export function useUpdateUserRolesMutation() {
  return useMutation({
    mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) =>
      adminApi.users.updateRoles(id, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries(getListUsersQueryOptions())
    },
  })
}
