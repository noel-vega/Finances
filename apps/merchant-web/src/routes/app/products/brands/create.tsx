import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/products/brands/create')({
  staticData: { breadcrumb: 'Create' },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/products/brands/create"!</div>
}
