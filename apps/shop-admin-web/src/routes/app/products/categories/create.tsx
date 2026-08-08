import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/products/categories/create')({
  staticData: { breadcrumb: 'Create' },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/products/categories/create"!</div>
}
