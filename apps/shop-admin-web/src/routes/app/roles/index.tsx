import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/roles/')({
  staticData: { breadcrumb: 'Roles' },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/roles/"!</div>
}
