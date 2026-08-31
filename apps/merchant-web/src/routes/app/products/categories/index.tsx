import { createFileRoute } from '@tanstack/react-router'
import { ListCategoriesView } from '../../../../features/categories/views/list-categories'
import { getListCategoriesQueryOptions } from '../../../../features/categories/categories.hooks'
import { queryClient } from '../../../../lib/react-query-client'

export const Route = createFileRoute('/app/products/categories/')({
  staticData: { breadcrumb: 'Categories' },
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getListCategoriesQueryOptions())
  },
  component: ListCategoriesView,
})