import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/users/')({
  staticData: { breadcrumb: 'Staff' },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/users/"!</div>
}
