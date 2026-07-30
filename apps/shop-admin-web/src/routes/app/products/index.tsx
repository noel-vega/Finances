import { createFileRoute } from '@tanstack/react-router'
import { ProductListView } from '../../../features/products/views/list-products.view'

export const Route = createFileRoute('/app/products/')({
  component: ProductListView,
})