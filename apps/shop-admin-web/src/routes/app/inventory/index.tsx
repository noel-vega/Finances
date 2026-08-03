import { createFileRoute } from '@tanstack/react-router'
import { ListInventoryView } from '../../../features/inventory/views/list-inventory.view'
import { getListInventoryQueryOptions } from '../../../features/inventory/inventory.hooks'
import { queryClient } from '../../../lib/react-query-client'

export const Route = createFileRoute('/app/inventory/')({
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getListInventoryQueryOptions())
  },
  component: ListInventoryView,
})
