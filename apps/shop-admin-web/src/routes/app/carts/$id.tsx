import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { getCartQueryOptions } from '../../../features/carts/carts.hooks'
import { queryClient } from '../../../lib/react-query-client'
import { CartView } from '../../../features/carts/views/cart.view'

export const Route = createFileRoute('/app/carts/$id')({
  params: {
    parse: z.object({ id: z.coerce.number() }).parse,
  },
  staticData: {
    breadcrumb: (params) => `Cart #${params.id}`,
  },
  beforeLoad: async ({ params }) => {
    await queryClient.ensureQueryData(getCartQueryOptions(params.id))
  },
  component: () => {
    const { id } = Route.useParams()
    return <CartView id={id} />
  },
})
