import { createFileRoute } from '@tanstack/react-router'
import { ListUsersView } from '../../../features/users/views/list-users.view'
import { getListUsersQueryOptions } from '../../../features/users/users.hooks'
import { queryClient } from '../../../lib/react-query-client'

export const Route = createFileRoute('/app/users/')({
  staticData: { breadcrumb: 'Staff' },
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getListUsersQueryOptions())
  },
  component: ListUsersView,
})
