import { createFileRoute } from '@tanstack/react-router'
import { ListOrdersView } from '../../../features/orders/views/list-orders.view'
import { getListOrdersQueryOptions } from '../../../features/orders/orders.hooks'
import { queryClient } from '../../../lib/react-query-client'

export const Route = createFileRoute('/app/orders/')({
  staticData: { breadcrumb: 'Orders' },
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getListOrdersQueryOptions())
  },
  component: ListOrdersView,
})
