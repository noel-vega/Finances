import { createFileRoute } from '@tanstack/react-router'
import { ListBrandsView } from '../../../../features/brands/views/list-brands.view'
import { queryClient } from '../../../../lib/react-query-client'
import { getListBrandsQueryOptions } from '../../../../features/brands/brands.hooks'

export const Route = createFileRoute('/app/products/brands/')({
  staticData: { breadcrumb: 'Brands' },
  beforeLoad: async () => {
      await queryClient.ensureQueryData(getListBrandsQueryOptions())
  },
  component: ListBrandsView,
})

