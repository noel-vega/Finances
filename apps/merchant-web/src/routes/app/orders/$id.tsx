import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { getOrderQueryOptions } from '../../../features/orders/orders.hooks'
import { queryClient } from '../../../lib/react-query-client'
import { OrderView } from '../../../features/orders/views/order.view'

export const Route = createFileRoute('/app/orders/$id')({
  params: {
    parse: z.object({ id: z.coerce.number() }).parse,
  },
  staticData: {
    breadcrumb: (params) => `Order #${params.id}`,
  },
  beforeLoad: async ({ params }) => {
    await queryClient.ensureQueryData(getOrderQueryOptions(params.id))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <OrderView id={id} />
}
