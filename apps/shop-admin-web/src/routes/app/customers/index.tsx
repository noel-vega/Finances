import { createFileRoute } from '@tanstack/react-router'
import { ListCustomersView } from '../../../features/customers/views/list-customers.view'
import { getListCustomersQueryOptions } from '../../../features/customers/customers.hooks'
import { queryClient } from '../../../lib/react-query-client'

export const Route = createFileRoute('/app/customers/')({
  staticData: { breadcrumb: 'Customers' },
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getListCustomersQueryOptions())
  },
  component: ListCustomersView,
})
