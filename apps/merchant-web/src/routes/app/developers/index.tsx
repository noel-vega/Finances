import { createFileRoute } from '@tanstack/react-router'
import { ApiKeysView } from '../../../features/api-keys/views/api-keys.view'
import { queryClient } from '../../../lib/react-query-client'
import { getListApiKeysQueryOptions } from '../../../features/api-keys/api-keys.hooks'

export const Route = createFileRoute('/app/developers/')({
  staticData: { breadcrumb: 'Developers' },
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getListApiKeysQueryOptions())
  },
  component: ApiKeysView,
})
