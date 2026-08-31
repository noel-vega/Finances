import { createFileRoute } from '@tanstack/react-router'
import { CreateProductView } from '../../../features/products/views/create-product.view'

export const Route = createFileRoute('/app/products/create')({
  staticData: { breadcrumb: 'Create' },
  component: CreateProductView,
})