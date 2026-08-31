import { createFileRoute } from '@tanstack/react-router'
import { ListLocationsView } from '../../../features/locations/views/list-locations.view'
import { getListLocationsQueryOptions } from '../../../features/locations/locations.hooks'
import { queryClient } from '../../../lib/react-query-client'

export const Route = createFileRoute('/app/locations/')({
  staticData: { breadcrumb: 'Locations' },
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getListLocationsQueryOptions())
  },
  component: ListLocationsView,
})
