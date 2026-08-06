import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import {
  getProductQueryOptions,
  getProductVariantsQueryOptions,
} from '../../../features/products/products.hooks'
import { queryClient } from '../../../lib/react-query-client'
import { ProductView } from '../../../features/products/views/product.view'

export const Route = createFileRoute('/app/products/$id')({
  params: {
    parse: z.object({id: z.coerce.number()}).parse
  },
  beforeLoad: async ({params}) => {
    const data = await Promise.all([
      queryClient.ensureQueryData(getProductQueryOptions(params.id)),
      queryClient.ensureQueryData(getProductVariantsQueryOptions(params.id)),
    ]);
    console.log(data)
  },
  component: () => {
    const {id} = Route.useParams()
    return <ProductView id={id} />
  },
})